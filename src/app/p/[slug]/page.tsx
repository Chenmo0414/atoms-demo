import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, GitFork, Sparkles, Zap } from "lucide-react";

interface PublicPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PublicPageProps) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug } });
  return {
    title: project ? `${project.title} - Atoms` : "Atoms",
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: {
      versions: {
        where: { isActive: true },
        take: 1,
      },
      _count: { select: { versions: true } },
    },
  });

  if (!project || !project.isPublished || !project.versions.length) {
    notFound();
  }

  const activeVersion = project.versions[0];
  const html = activeVersion.html;
  const versionLabel = activeVersion.label || `v${activeVersion.versionNum}`;

  return (
    <div className="h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-xs">Built with Atoms</span>
            </Link>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-white truncate mt-1">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-0.5">
                <Sparkles className="w-3 h-3" />
                {versionLabel}
              </span>
              <span>{project._count.versions} versions</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/register?remix=${params.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" />
              Clone
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Build your own
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-950">
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
