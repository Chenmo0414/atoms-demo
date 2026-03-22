"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Zap, ArrowLeft, Monitor, Code2, History as HistoryIcon,
  GitFork, Globe, Cpu, Trophy, Check, Pencil
} from "lucide-react";
import Link from "next/link";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { AppViewer } from "@/components/workspace/AppViewer";
import { CodeViewer } from "@/components/workspace/CodeViewer";
import { VersionHistory } from "@/components/workspace/VersionHistory";
import { RaceMode } from "@/components/workspace/RaceMode";
import { ModelSelector } from "@/components/workspace/ModelSelector";
import { useGenerate } from "@/hooks/useGenerate";
import { useRace } from "@/hooks/useRace";
import { Message, Project, Version } from "@/types";
import { LoadingDots } from "@/components/shared/LoadingDots";
import { extractHTML } from "@/lib/extractCode";
import { resolveModel } from "@/lib/models";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PreviewTab = "preview" | "code";
type Mode = "engineer" | "race";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data, mutate } = useSWR<{ project: Project & { messages: Message[]; versions: Version[] } }>(
    `/api/projects/${projectId}`,
    fetcher
  );

  const project = data?.project;

  // Local state
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeHtml, setActiveHtml] = useState("");
  const [activeVersionNum, setActiveVersionNum] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("preview");
  const [mode, setMode] = useState<Mode>("engineer");
  const [showHistory, setShowHistory] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string>(
    () => resolveModel().id
  );

  // Split pane
  const [splitPos, setSplitPos] = useState(40); // percentage
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Init state from fetched data
  useEffect(() => {
    if (project && messages.length === 0) {
      setMessages(project.messages || []);
      const active = project.versions?.[0];
      if (active) {
        setActiveHtml(active.html);
        setActiveVersionNum(active.versionNum);
      }
      setTitleDraft(project.title);
    }
  }, [project, messages.length]);

  // Streaming live preview: extract HTML from buffer as it streams
  const streamDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleStreamBuffer = useCallback((buffer: string) => {
    if (streamDebounceRef.current) clearTimeout(streamDebounceRef.current);
    streamDebounceRef.current = setTimeout(() => {
      const html = extractHTML(buffer);
      if (html && html.includes("<")) {
        setActiveHtml(html);
      }
    }, 300);
  }, []);

  const handleGenerationComplete = useCallback(
    (html: string, _versionId: string, versionNum: number) => {
      setActiveHtml(html);
      setActiveVersionNum(versionNum);
      mutate();
      toast.success(`v${versionNum} generated`);
    },
    [mutate]
  );

  const { status, streamBuffer, error, generate, cancel } = useGenerate(handleGenerationComplete);

  // Watch stream buffer for live preview
  useEffect(() => {
    if (streamBuffer) handleStreamBuffer(streamBuffer);
  }, [streamBuffer, handleStreamBuffer]);

  const handleRaceWinner = useCallback(
    (html: string) => {
      setActiveHtml(html);
      setMode("engineer");
      mutate();
      toast.success("Winner saved!");
    },
    [mutate]
  );

  const { slots, isRacing, race, pickWinner, reset: resetRace } = useRace(handleRaceWinner);

  const handleSend = useCallback(
    (prompt: string) => {
      // Optimistically add user message
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        projectId,
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);

      if (mode === "race") {
        race(projectId, prompt, selectedModelId);
      } else {
        generate(projectId, prompt, selectedModelId);
      }
    },
    [mode, projectId, generate, race, selectedModelId]
  );

  // Refresh messages after generation
  useEffect(() => {
    if (status === "done") {
      mutate().then((d) => {
        if (d?.project?.messages) setMessages(d.project.messages);
      });
    }
  }, [status, mutate]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(
        <div>
          <p className="font-medium">Published!</p>
          <a
            href={json.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 underline text-sm"
          >
            {json.url}
          </a>
        </div>,
        {
          duration: 8000,
          action: {
            label: "Copy link",
            onClick: () => navigator.clipboard.writeText(json.url),
          },
        }
      );
      mutate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleRemix = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/remix`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push(`/project/${json.project.id}`);
      toast.success("Remixed! Working on a new copy.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Remix failed");
    }
  };

  const handleRestoreVersion = useCallback((html: string) => {
    setActiveHtml(html);
    setShowHistory(false);
    mutate().then((d) => {
      if (d?.project?.versions?.[0]) {
        setActiveVersionNum(d.project.versions[0].versionNum);
      }
    });
  }, [mutate]);

  // Drag to resize
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(25, Math.min(70, percent)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleTitleSave = async () => {
    if (!titleDraft.trim()) return;
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleDraft }),
    });
    setIsEditingTitle(false);
    mutate();
  };

  const isGenerating = status === "streaming" || isRacing;

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <header className="h-12 border-b border-zinc-800 flex items-center px-3 gap-3 shrink-0 bg-zinc-950/90 backdrop-blur">
        <Link
          href="/dashboard"
          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
              className="text-sm font-medium text-white bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 focus:outline-none focus:border-purple-500 w-48"
            />
          ) : (
            <button
              onClick={() => { setTitleDraft(project.title); setIsEditingTitle(true); }}
              className="flex items-center gap-1.5 text-sm font-medium text-white hover:text-purple-300 transition-colors group"
            >
              {project.title}
              <Pencil className="w-3 h-3 text-zinc-600 group-hover:text-purple-400 transition-colors" />
            </button>
          )}
          {activeVersionNum && (
            <span className="text-xs text-zinc-600 font-mono">v{activeVersionNum}</span>
          )}
        </div>

        <div className="flex-1" />

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => { setMode("engineer"); resetRace(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
              mode === "engineer"
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Cpu className="w-3 h-3" />
            Engineer
          </button>
          <button
            onClick={() => setMode("race")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
              mode === "race"
                ? "bg-yellow-900/60 text-yellow-300 border border-yellow-700/50"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Trophy className="w-3 h-3" />
            Race
          </button>
        </div>

        <ModelSelector
          value={selectedModelId}
          onChange={setSelectedModelId}
          disabled={isGenerating}
        />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
              showHistory
                ? "bg-zinc-700 border-zinc-600 text-white"
                : "border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            History
          </button>
          <button
            onClick={handleRemix}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <GitFork className="w-3.5 h-3.5" />
            Remix
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !activeHtml}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
              project.isPublished
                ? "bg-green-900/50 border border-green-700/50 text-green-300 hover:bg-green-800/50"
                : "bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40"
            }`}
          >
            {project.isPublished ? (
              <><Check className="w-3.5 h-3.5" /> Published</>
            ) : (
              <><Globe className="w-3.5 h-3.5" /> {publishing ? "Publishing..." : "Publish"}</>
            )}
          </button>
        </div>
      </header>

      {/* Main split pane */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden"
        style={{ userSelect: isDragging.current ? "none" : "auto" }}
      >
        {/* Left: Chat */}
        <div style={{ width: `${splitPos}%` }} className="flex flex-col overflow-hidden border-r border-zinc-800">
          <ChatPanel
            messages={messages}
            isStreaming={isGenerating}
            error={error}
            onSend={handleSend}
            onCancel={() => { cancel(); resetRace(); }}
            mode={mode}
          />
        </div>

        {/* Divider */}
        <div
          ref={dividerRef}
          onMouseDown={handleDividerMouseDown}
          className="w-1 bg-zinc-800 hover:bg-purple-600 cursor-col-resize transition-colors active:bg-purple-500 shrink-0"
        />

        {/* Right: Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === "race" && (slots[0].status !== "idle" || slots[1].status !== "idle" || isRacing) ? (
            <RaceMode
              slots={slots}
              isRacing={isRacing}
              onPickWinner={(slot) => pickWinner(projectId, slot)}
            />
          ) : (
            <>
              {/* Preview tabs */}
              <div className="flex items-center border-b border-zinc-800 px-3 bg-zinc-950 shrink-0">
                {(["preview", "code"] as PreviewTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      previewTab === tab
                        ? "border-purple-500 text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === "preview" ? (
                      <><Monitor className="w-3.5 h-3.5" /> Preview</>
                    ) : (
                      <><Code2 className="w-3.5 h-3.5" /> Code</>
                    )}
                  </button>
                ))}
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-hidden bg-zinc-950">
                {previewTab === "preview" ? (
                  <AppViewer
                    html={activeHtml}
                    streaming={isGenerating && !activeHtml}
                  />
                ) : (
                  <CodeViewer html={activeHtml} />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Version History drawer */}
      {showHistory && (
        <VersionHistory
          projectId={projectId}
          onRestore={handleRestoreVersion}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
