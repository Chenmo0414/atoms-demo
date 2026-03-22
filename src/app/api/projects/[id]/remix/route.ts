import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the source project (can be any published project or own project)
  const source = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      versions: { where: { isActive: true }, take: 1 },
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Must be own project or published
  if (source.userId !== session.user.id && !source.isPublished) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!source.versions.length) {
    return NextResponse.json({ error: "No version to remix" }, { status: 400 });
  }

  const activeVersion = source.versions[0];

  // Create new project with cloned version
  const newProject = await prisma.project.create({
    data: {
      title: `Remix of ${source.title}`,
      description: source.description,
      userId: session.user.id,
      versions: {
        create: {
          versionNum: 1,
          prompt: `Remixed from "${source.title}"`,
          html: activeVersion.html,
          label: "v1 – remixed",
          isActive: true,
        },
      },
    },
  });

  return NextResponse.json({ project: newProject }, { status: 201 });
}
