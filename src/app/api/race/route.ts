import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const fullContents = ["", ""];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller already closed
        }
      };

      // Fire two streams in parallel
      const runSlot = async (slot: number) => {
        try {
          // Use same prompt but different system nudge to get variety
          const nudgedPrompt = slot === 1
            ? `${prompt} (try a different visual style and layout approach)`
            : prompt;

          const claudeStream = await generateAppStream(nudgedPrompt, [], modelId);

          for await (const chunk of claudeStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              fullContents[slot] += text;
              send({ type: "delta", slot, content: text });
            }
          }

          const html = extractHTML(fullContents[slot]);
          send({ type: "done", slot, html });
        } catch (error) {
          console.error(`Race slot ${slot} error:`, error);
          send({ type: "error", slot, message: "Generation failed" });
        }
      };

      await Promise.all([runSlot(0), runSlot(1)]);
      controller.close();
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
