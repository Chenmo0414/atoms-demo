import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateSlug } from "@/lib/slugify";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      versions: { where: { isActive: true }, take: 1 },
    },
  });

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!project.versions.length) {
    return NextResponse.json({ error: "No version to publish" }, { status: 400 });
  }

  const slug = project.slug || generateSlug();

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: { slug, isPublished: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    slug,
    url: `${appUrl}/p/${slug}`,
    project: updated,
  });
}
