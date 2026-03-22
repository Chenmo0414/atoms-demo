"use client";

import { useState } from "react";
import useSWR from "swr";
import { History, X, RotateCcw, Check } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface VersionItem {
  id: string;
  versionNum: number;
  prompt: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VersionHistoryProps {
  projectId: string;
  onRestore: (html: string) => void;
  onClose: () => void;
}

export function VersionHistory({ projectId, onRestore, onClose }: VersionHistoryProps) {
  const { data, mutate } = useSWR<{ versions: VersionItem[] }>(
    `/api/projects/${projectId}/versions`,
    fetcher
  );
  const [restoring, setRestoring] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      // Get the full version HTML
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`);
      if (!res.ok) throw new Error("Failed to fetch version");
      const { version } = await res.json();

      // Restore it
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restoreVersionId: versionId }),
      });

      onRestore(version.html);
      mutate();
      toast.success(`Restored to v${version.versionNum}`);
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-40 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-white text-sm">Version History</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!data ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : data.versions.length === 0 ? (
          <div className="text-center text-zinc-600 text-sm py-8">
            No versions yet
          </div>
        ) : (
          data.versions.map((v) => (
            <div
              key={v.id}
              className={`p-3 rounded-lg border transition-colors ${
                v.isActive
                  ? "border-purple-700 bg-purple-900/20"
                  : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-purple-400">
                      {v.label || `v${v.versionNum}`}
                    </span>
                    {v.isActive && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Check className="w-2.5 h-2.5" /> active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate" title={v.prompt}>
                    {v.prompt}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {formatRelativeTime(v.createdAt)}
                  </p>
                </div>
                {!v.isActive && (
                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoring === v.id}
                    className="shrink-0 p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-900/20 rounded transition-colors"
                    title="Restore this version"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${restoring === v.id ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
