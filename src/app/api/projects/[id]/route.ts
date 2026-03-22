import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function authorize(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project || project.userId !== userId) return null;
  return project;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      versions: {
        where: { isActive: true },
        orderBy: { versionNum: "desc" },
        take: 1,
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { versions: true } },
    },
  });

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await authorize(params.id, session.user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Handle version restore
  if (body.restoreVersionId) {
    await prisma.$transaction([
      prisma.version.updateMany({
        where: { projectId: params.id },
        data: { isActive: false },
      }),
      prisma.version.update({
        where: { id: body.restoreVersionId },
        data: { isActive: true },
      }),
      prisma.project.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      title: body.title ?? project.title,
      description: body.description ?? project.description,
    },
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await authorize(params.id, session.user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
