import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeVersionFiles } from "@/lib/workspace";

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

  // Handle save edited HTML as new version
  if (body.saveHtml !== undefined) {
    const version = await prisma.$transaction(async (tx) => {
      const lastVersion = await tx.version.findFirst({
        where: { projectId: params.id },
        orderBy: { versionNum: "desc" },
      });
      const nextNum = (lastVersion?.versionNum ?? 0) + 1;

      await tx.version.updateMany({
        where: { projectId: params.id },
        data: { isActive: false },
      });

      const v = await tx.version.create({
        data: {
          projectId: params.id,
          versionNum: nextNum,
          prompt: "Manual edit",
          html: body.saveHtml,
          label: "Manual edit",
          isActive: true,
        },
      });

      await tx.project.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });

      return v;
    });

    writeVersionFiles(session.user.email, params.id, version.versionNum, body.saveHtml).catch(
      (err) => console.error("[workspace] write failed:", err)
    );

    return NextResponse.json({ version });
  }

  // Handle version restore
  if (body.restoreVersionId) {
    const restoredVersion = await prisma.$transaction(async (tx) => {
      const sourceVersion = await tx.version.findUnique({
        where: { id: body.restoreVersionId },
      });

      if (!sourceVersion || sourceVersion.projectId !== params.id) {
        throw new Error("VERSION_NOT_FOUND");
      }

      const lastVersion = await tx.version.findFirst({
        where: { projectId: params.id },
        orderBy: { versionNum: "desc" },
      });

      const nextNum = (lastVersion?.versionNum ?? 0) + 1;

      await tx.version.updateMany({
        where: { projectId: params.id },
        data: { isActive: false },
      });

      const version = await tx.version.create({
        data: {
          projectId: params.id,
          versionNum: nextNum,
          prompt: sourceVersion.prompt,
          html: sourceVersion.html,
          label: `Restore of v${sourceVersion.versionNum}`,
          isActive: true,
        },
      });

      await tx.project.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });

      return version;
    }).catch((error) => {
      if (error instanceof Error && error.message === "VERSION_NOT_FOUND") {
        return null;
      }
      throw error;
    });

    if (!restoredVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    writeVersionFiles(
      session.user.email,
      params.id,
      restoredVersion.versionNum,
      restoredVersion.html
    ).catch((err) => console.error("[workspace] write failed:", err));

    return NextResponse.json({ version: restoredVersion });
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
