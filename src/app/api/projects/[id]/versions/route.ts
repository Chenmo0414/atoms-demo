import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await prisma.version.findMany({
    where: { projectId: params.id },
    orderBy: { versionNum: "desc" },
    select: {
      id: true,
      versionNum: true,
      prompt: true,
      label: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ versions });
}

// Save a version (used by Race Mode to save winning version)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { html, prompt, label } = body;

  // Get next version number
  const lastVersion = await prisma.version.findFirst({
    where: { projectId: params.id },
    orderBy: { versionNum: "desc" },
  });
  const nextNum = (lastVersion?.versionNum ?? 0) + 1;

  // Deactivate all existing versions
  await prisma.version.updateMany({
    where: { projectId: params.id },
    data: { isActive: false },
  });

  const version = await prisma.version.create({
    data: {
      projectId: params.id,
      versionNum: nextNum,
      prompt: prompt || "Race mode winner",
      html,
      label: label || `v${nextNum}`,
      isActive: true,
    },
  });

  await prisma.project.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ version }, { status: 201 });
}
