import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  remixSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, remixSlug } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null },
    });

    const session = await getSession();
    session.user = { id: user.id, email: user.email, name: user.name };
    await session.save();

    // Auto-remix if slug provided
    let remixProjectId: string | null = null;
    if (remixSlug) {
      const sourceProject = await prisma.project.findUnique({
        where: { slug: remixSlug },
        include: { versions: { where: { isActive: true }, take: 1 } },
      });
      if (sourceProject?.isPublished && sourceProject.versions.length > 0) {
        const newProject = await prisma.project.create({
          data: {
            title: `Remix of ${sourceProject.title}`,
            userId: user.id,
            versions: {
              create: {
                versionNum: 1,
                prompt: `Remixed from "${sourceProject.title}"`,
                html: sourceProject.versions[0].html,
                label: "v1 – remixed",
                isActive: true,
              },
            },
          },
        });
        remixProjectId = newProject.id;
      }
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      remixProjectId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
