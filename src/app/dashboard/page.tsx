"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Zap, LogOut, Sparkles, Clock, Layers, Trash2, Settings, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Project } from "@/types";
import { useT } from "@/contexts/LangContext";
import { LangToggle } from "@/components/shared/LangToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ModelSelector } from "@/components/workspace/ModelSelector";
import { resolveModel } from "@/lib/models";

interface WorkspaceVersionFiles {
  version: string;
  files: string[];
}

interface WorkspaceProjectDir {
  projectId: string;
  versions: WorkspaceVersionFiles[];
}

function WorkspacePanel() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, error: wsError } = useSWR<{ dirs: WorkspaceProjectDir[]; diskPath: string | null }>(
    open ? "/api/workspaces/files" : null,
    (url: string) => fetch(url).then((r) => r.json())
  );

  const dirs = data?.dirs ?? [];
  const diskPath = data?.diskPath;

  const totalFiles = dirs.reduce(
    (sum, d) => sum + d.versions.reduce((s, v) => s + v.files.length, 0),
    0
  );

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <FolderOpen className="w-4 h-4 text-purple-500 shrink-0" />
        <span className="text-sm font-medium text-zinc-900 dark:text-white flex-1">{t.userWorkspace}</span>
        {open && dirs.length > 0 && (
          <span className="text-xs text-zinc-500 mr-2">
            {dirs.length} {dirs.length === 1 ? "project" : "projects"} · {totalFiles} files
          </span>
        )}
        {open ? (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          {/* Disk path */}
          {diskPath && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">{t.diskPath}:</span>
              <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 truncate">
                {diskPath}/
              </code>
            </div>
          )}

          {wsError ? (
            <p className="text-sm text-red-500">{t.somethingWentWrong}</p>
          ) : !data ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
              ))}
            </div>
          ) : dirs.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">{t.noWorkspaceFiles}</p>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {dirs.map((dir) => {
                const isOpen = expanded[dir.projectId];
                return (
                  <div key={dir.projectId}>
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [dir.projectId]: !prev[dir.projectId] }))
                      }
                      className="flex items-center gap-1.5 w-full text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-0.5"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                      )}
                      <FolderOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{dir.projectId}</span>
                      <span className="text-zinc-400 ml-1 shrink-0">({dir.versions.length}v)</span>
                    </button>
                    {isOpen && (
                      <div className="ml-5 mt-0.5 space-y-1">
                        {dir.versions.map((v) => (
                          <div key={v.version}>
                            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 py-0.5">
                              <FolderOpen className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{v.version}/</span>
                            </div>
                            <div className="ml-4 space-y-0.5">
                              {v.files.map((f) => (
                                <div key={f} className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 py-0.5">
                                  <span className="w-3 h-3 shrink-0" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function NewProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string, prompt: string, modelId: string) => void;
}) {
  const t = useT();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => resolveModel().id);

  const create = async () => {
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: normalizedPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onCreated(json.project.id, normalizedPrompt, selectedModel);
    } catch {
      toast.error(t.failedToCreate);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md animate-fade-in">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t.newProject}</h2>
        <textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              create();
            }
          }}
          rows={4}
          placeholder={(t as typeof t & { describeAppPlaceholder?: string }).describeAppPlaceholder ?? "Describe your app..."}
          className="w-full resize-none px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 mb-4"
        />
        <div className="flex items-center justify-between gap-2">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={loading} />
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={create}
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading
                ? t.creating
                : ((t as typeof t & { createAndBuild?: string }).createAndBuild ?? "Create & Build")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const t = useT();
  const activeVersion = project.activeVersion ?? project.versions?.[0];

  return (
    <div className="group relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-purple-900/10">
      {/* Preview thumbnail */}
      <Link href={`/project/${project.id}`} className="block">
        <div className="h-40 bg-white dark:bg-zinc-950 overflow-hidden relative">
          {activeVersion?.html ? (
            <div className="absolute inset-0 scale-[0.25] origin-top-left w-[400%] h-[400%] pointer-events-none">
              <iframe
                srcDoc={activeVersion.html}
                sandbox=""
                className="w-full h-full border-0"
                title="preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Sparkles className="w-8 h-8 text-zinc-700" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/project/${project.id}`}>
          <h3 className="font-medium text-zinc-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
            {project.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(project.updatedAt, t)}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {t.versions(project._count?.versions ?? 0)}
          </span>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(project.id)}
        className="absolute top-2 right-2 p-1.5 bg-zinc-50/80 dark:bg-zinc-900/80 hover:bg-red-100/80 dark:hover:bg-red-900/80 text-zinc-500 hover:text-red-600 dark:hover:text-red-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        title={t.deleteProject}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const t = useT();
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const { data, mutate } = useSWR<{ projects: Project[] }>("/api/projects", fetcher);

  const projects = data?.projects ?? [];

  const handleCreated = (id: string, prompt: string, modelId: string) => {
    router.push(`/project/${id}?prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(modelId)}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    mutate();
    toast.success(t.projectDeleted);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">Atoms</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangToggle />
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.newProject}
            </button>
            <Link
              href="/settings"
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={t.settings}
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">{t.myProjects}</h1>
          <span className="text-sm text-zinc-500">{t.projectCount(projects.length)}</span>
        </div>

        {!data ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-zinc-100 dark:bg-zinc-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-zinc-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">{t.noProjectsYet}</h2>
            <p className="text-zinc-500 mb-6 max-w-sm">{t.noProjectsDesc}</p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.createFirstApp}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New project card */}
            <button
              onClick={() => setShowNew(true)}
              className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl h-[200px] flex flex-col items-center justify-center gap-2 hover:border-purple-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-purple-900/50 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-zinc-500 group-hover:text-purple-400" />
              </div>
              <span className="text-sm text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                {t.newProject}
              </span>
            </button>

            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* User Workspace panel */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <WorkspacePanel />
      </div>

      {showNew && (
        <NewProjectDialog
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
