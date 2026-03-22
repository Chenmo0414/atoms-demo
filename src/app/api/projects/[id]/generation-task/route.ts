import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// How long before a RUNNING/PENDING task is considered stale (30 minutes)
const STALE_THRESHOLD_MS = 30 * 60 * 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const staleAfter = new Date(Date.now() - STALE_THRESHOLD_MS);

  const task = await prisma.generationTask.findFirst({
    where: {
      projectId: params.id,
      status: { in: ["PENDING", "RUNNING"] },
      createdAt: { gte: staleAfter },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ task });
}

// PATCH: mark a task as FAILED (used when user dismisses the recovery banner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { taskId } = await req.json();
  if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

  await prisma.generationTask.update({
    where: { id: taskId },
    data: { status: "FAILED", error: "Dismissed by user" },
  });

  return NextResponse.json({ ok: true });
}
