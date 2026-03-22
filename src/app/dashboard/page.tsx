"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Zap, LogOut, Sparkles, Clock, Layers, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Project } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function NewProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onCreated(json.project.id);
    } catch {
      toast.error("Failed to create project");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md animate-fade-in">
        <h2 className="text-lg font-semibold text-white mb-4">New Project</h2>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Project name (e.g. Todo App, Dashboard...)"
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white text-sm rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={create}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const activeVersion = project.activeVersion ?? project.versions?.[0];

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-purple-900/10">
      {/* Preview thumbnail */}
      <Link href={`/project/${project.id}`} className="block">
        <div className="h-40 bg-zinc-950 overflow-hidden relative">
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
          <h3 className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">
            {project.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(project.updatedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {project._count?.versions ?? 0} versions
          </span>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(project.id)}
        className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 hover:bg-red-900/80 text-zinc-500 hover:text-red-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        title="Delete project"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const { data, mutate } = useSWR<{ projects: Project[] }>("/api/projects", fetcher);

  const projects = data?.projects ?? [];

  const handleCreated = (id: string) => {
    router.push(`/project/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    mutate();
    toast.success("Project deleted");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">Atoms</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-white">My Projects</h1>
          <span className="text-sm text-zinc-500">{projects.length} projects</span>
        </div>

        {!data ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-zinc-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-zinc-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-zinc-500 mb-6 max-w-sm">
              Create your first project and let AI agents build your idea in seconds.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first app
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New project card */}
            <button
              onClick={() => setShowNew(true)}
              className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl h-[200px] flex flex-col items-center justify-center gap-2 hover:border-purple-600 hover:bg-zinc-900 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-purple-900/50 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-zinc-500 group-hover:text-purple-400" />
              </div>
              <span className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
                New Project
              </span>
            </button>

            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {showNew && (
        <NewProjectDialog
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
