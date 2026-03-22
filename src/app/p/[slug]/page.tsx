import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, GitFork } from "lucide-react";

interface PublicPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PublicPageProps) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug } });
  return {
    title: project ? `${project.title} — Atoms` : "Atoms",
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: {
      versions: { where: { isActive: true }, take: 1 },
    },
  });

  if (!project || !project.isPublished || !project.versions.length) {
    notFound();
  }

  const html = project.versions[0].html;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="h-screen bg-zinc-950 flex flex-col">
      {/* Footer bar at top (not blocking content) */}
      <div className="shrink-0 h-10 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-xs text-zinc-400">
            <span className="text-white font-medium">{project.title}</span> — Built with Atoms
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/register?remix=${params.slug}`}
            className="flex items-center gap-1.5 px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors border border-zinc-700"
          >
            <GitFork className="w-3 h-3" />
            Remix this
          </Link>
          <Link
            href="/register"
            className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Build your own
          </Link>
        </div>
      </div>

      {/* Full-screen iframe */}
      <div className="flex-1">
        <iframe
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          className="w-full h-full border-0"
          title={project.title}
        />
      </div>
    </div>
  );
}
