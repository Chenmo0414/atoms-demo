import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { summarizeProjectTitle } from "@/lib/projectTitle";

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      versions: {
        where: { isActive: true },
        select: { id: true, versionNum: true, html: true, label: true, createdAt: true },
        take: 1,
      },
      _count: { select: { versions: true, messages: true } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = z
    .object({
      title: z.string().trim().min(1).max(100).optional(),
      prompt: z.string().trim().min(1).max(5000).optional(),
      description: z.string().optional(),
    })
    .refine((data) => !!data.title || !!data.prompt, {
      message: "Either title or prompt is required",
    });

  const body = await req.json();
  const { title, prompt, description } = schema.parse(body);
  const resolvedTitle = (title && title.trim()) || summarizeProjectTitle(prompt || "");

  const project = await prisma.project.create({
    data: { title: resolvedTitle, description, userId: session.user.id },
  });

  return NextResponse.json({ project }, { status: 201 });
}
