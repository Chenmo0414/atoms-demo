import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generatePlan } from "@/lib/claude";
import { parseAssistantMessage } from "@/lib/assistantMessage";

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

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const allMessages = await prisma.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  let history = allMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.role === "assistant" ? parseAssistantMessage(m.content).response : m.content,
  }));

  if (history.length > 10) {
    history = [history[0], ...history.slice(-8)];
  }

  try {
    const plan = await generatePlan(prompt, history, modelId);
    return new Response(JSON.stringify({ plan }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Plan generation error:", error);
    return new Response(JSON.stringify({ error: "Plan generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

