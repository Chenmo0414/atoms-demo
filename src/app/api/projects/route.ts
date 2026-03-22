import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

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

  const schema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().optional(),
  });

  const body = await req.json();
  const { title, description } = schema.parse(body);

  const project = await prisma.project.create({
    data: { title, description, userId: session.user.id },
  });

  return NextResponse.json({ project }, { status: 201 });
}
