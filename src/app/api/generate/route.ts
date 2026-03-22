import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateAppStream } from "@/lib/claude";
import { extractHTML } from "@/lib/extractCode";
import {
  parseAssistantMessage,
  serializeAssistantMessage,
} from "@/lib/assistantMessage";
import { writeVersionFiles } from "@/lib/workspace";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { projectId, prompt, modelId, confirmedRequirements, resumeFrom } = await req.json();

  if (!projectId || !prompt) {
    return new Response(JSON.stringify({ error: "Missing projectId or prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify ownership
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get conversation history (sliding window: first + last 8)
  const allMessages = await prisma.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  let history = allMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content:
      m.role === "assistant"
        ? parseAssistantMessage(m.content).response
        : m.content,
  }));

  if (history.length > 10) {
    history = [history[0], ...history.slice(-8)];
  }

  const encoder = new TextEncoder();
  let fullContent = "";
  let reasoningContent = "";
  const normalizedRequirements = Array.isArray(confirmedRequirements)
    ? confirmedRequirements
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const basePrompt =
    normalizedRequirements.length > 0
      ? `${prompt}\n\nConfirmed requirements:\n${normalizedRequirements
          .map((item) => `- ${item}`)
          .join("\n")}\n\nImplement all confirmed requirements in the app.`
      : prompt;

  const generationPrompt = resumeFrom
    ? `${basePrompt}\n\nNote: A previous generation was interrupted. Here is the partial output:\n\`\`\`\n${String(resumeFrom).slice(0, 4000)}\n\`\`\`\nBuild on this and return a complete, fully working app.`
    : basePrompt;

  // Create a generation task to survive page refreshes
  const task = await prisma.generationTask.create({
    data: {
      projectId,
      prompt,
      modelId: modelId ?? null,
      confirmedRequirements: normalizedRequirements.length > 0 ? normalizedRequirements : undefined,
      status: "PENDING",
    },
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Mark task as running
      await prisma.generationTask.update({
        where: { id: task.id },
        data: { status: "RUNNING" },
      });

      try {
        const claudeStream = await generateAppStream(generationPrompt, history, modelId);

        for await (const chunk of claudeStream) {
          if (chunk.type === "reasoning") {
            const text = chunk.text;
            reasoningContent += text;
            send({ type: "reasoning", content: text });
          } else if (chunk.type === "content") {
            const text = chunk.text;
            fullContent += text;
            send({ type: "delta", content: text });
          }
        }

        // Extract clean HTML from the full response
        const html = extractHTML(fullContent);

        // Persist to database
        const lastVersion = await prisma.version.findFirst({
          where: { projectId },
          orderBy: { versionNum: "desc" },
        });
        const nextNum = (lastVersion?.versionNum ?? 0) + 1;

        await prisma.version.updateMany({
          where: { projectId },
          data: { isActive: false },
        });

        const version = await prisma.version.create({
          data: {
            projectId,
            versionNum: nextNum,
            prompt,
            html,
            label: `v${nextNum}`,
            isActive: true,
          },
        });

        await prisma.message.createMany({
          data: [
            { projectId, role: "user", content: prompt },
            {
              projectId,
              role: "assistant",
              content: serializeAssistantMessage(reasoningContent, fullContent),
            },
          ],
        });

        await prisma.project.update({
          where: { id: projectId },
          data: { updatedAt: new Date() },
        });

        // Mark task as done
        await prisma.generationTask.update({
          where: { id: task.id },
          data: { status: "DONE", versionId: version.id },
        });

        // Write files to workspace (non-blocking — don't fail generation if disk write fails)
        writeVersionFiles(session.user!.email, projectId, nextNum, html).catch((err) =>
          console.error("[workspace] write failed:", err)
        );

        send({ type: "done", html, versionId: version.id, versionNum: nextNum });
      } catch (error) {
        console.error("Generation error:", error);
        await prisma.generationTask.update({
          where: { id: task.id },
          data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" },
        }).catch(() => {}); // don't fail the response if this update fails
        send({ type: "error", message: "Generation failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
