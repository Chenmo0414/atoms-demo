import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateAppStream } from "@/lib/claude";
import { extractHTML } from "@/lib/extractCode";

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

  const { projectId, prompt, modelId } = await req.json();

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
    content: m.content,
  }));

  if (history.length > 10) {
    history = [history[0], ...history.slice(-8)];
  }

  const encoder = new TextEncoder();
  let fullContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const claudeStream = await generateAppStream(prompt, history, modelId);

        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
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
            { projectId, role: "assistant", content: fullContent },
          ],
        });

        await prisma.project.update({
          where: { id: projectId },
          data: { updatedAt: new Date() },
        });

        send({ type: "done", html, versionId: version.id, versionNum: nextNum });
      } catch (error) {
        console.error("Generation error:", error);
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
