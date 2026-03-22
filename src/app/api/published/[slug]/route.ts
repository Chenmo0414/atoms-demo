import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: {
      versions: { where: { isActive: true }, take: 1 },
    },
  });

  if (!project || !project.isPublished || !project.versions.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    title: project.title,
    html: project.versions[0].html,
    projectId: project.id,
    createdAt: project.createdAt,
  });
}
