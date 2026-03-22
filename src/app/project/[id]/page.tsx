"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Zap, ArrowLeft, Monitor, Code2, History as HistoryIcon,
  GitFork, Globe, Check, Pencil, FolderOpen, FileText, ChevronDown, ChevronRight,
  RefreshCw, X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { AppViewer } from "@/components/workspace/AppViewer";
import { CodeViewer } from "@/components/workspace/CodeViewer";
import { VersionHistory } from "@/components/workspace/VersionHistory";
import { RaceMode } from "@/components/workspace/RaceMode";
import { useGenerate } from "@/hooks/useGenerate";
import { useRace } from "@/hooks/useRace";
import { usePlan } from "@/hooks/usePlan";
import { Message, ProcessRecord, Project, Version } from "@/types";
import { LoadingDots } from "@/components/shared/LoadingDots";
import { extractHTML } from "@/lib/extractCode";
import { resolveModel } from "@/lib/models";
import { useT } from "@/contexts/LangContext";
import { LangToggle } from "@/components/shared/LangToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PreviewTab = "preview" | "code";
type LeftTab = "chat" | "workspace";
type Mode = "workflow" | "race";

type PendingPlan = {
  summary: string;
  items: Array<{ id: string; label: string; description: string; checked: boolean }>;
};

export default function WorkspacePage() {
  const t = useT();
  const params = useParams();
  const searchParams = useSearchParams();
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
  const [mode, setMode] = useState<Mode>("workflow");
  const [showHistory, setShowHistory] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string>(
    () => resolveModel(searchParams.get("model")).id
  );
  const [workflowPlan, setWorkflowPlan] = useState<PendingPlan | null>(null);
  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [awaitingPlanConfirmation, setAwaitingPlanConfirmation] = useState(false);
  const [processRecords, setProcessRecords] = useState<ProcessRecord[]>([]);
  const [pendingTask, setPendingTask] = useState<{ id: string; prompt: string; modelId?: string | null; confirmedRequirements?: string[] | null } | null>(null);

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

      // Reconstruct process records from message history
      if (processRecords.length === 0) {
        const userMsgs = (project.messages || []).filter((m) => m.role === "user");
        if (userMsgs.length > 0) {
          setProcessRecords(
            userMsgs.map((m) => ({ prompt: m.content, plan: null, status: "done" }))
          );
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, messages.length]);

  // Check for interrupted generation tasks on load
  useEffect(() => {
    if (!project) return;
    fetch(`/api/projects/${projectId}/generation-task`)
      .then((r) => r.json())
      .then((json) => {
        if (json.task) {
          const t = json.task;
          setPendingTask({
            id: t.id,
            prompt: t.prompt,
            modelId: t.modelId,
            confirmedRequirements: Array.isArray(t.confirmedRequirements) ? t.confirmedRequirements : null,
          });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

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
      setProcessRecords((prev) => {
        const next = [...prev];
        if (next.length > 0) {
          next[next.length - 1] = { ...next[next.length - 1], status: "done", versionNum };
        }
        return next;
      });
      mutate();
      toast.success(t.vGenerated(versionNum));
    },
    [mutate, t]
  );

  const { status, streamBuffer, reasoningBuffer, error, generate, cancel, resume, discard } = useGenerate(handleGenerationComplete, {
    generationFailed: t.generationFailed,
    connectionError: t.connectionError,
  });

  const handleDismissPendingTask = useCallback(async () => {
    if (!pendingTask) return;
    const id = pendingTask.id;
    setPendingTask(null);
    await fetch(`/api/projects/${projectId}/generation-task`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: id }),
    }).catch(() => {});
  }, [pendingTask, projectId]);

  const handleRestartFromTask = useCallback(() => {
    if (!pendingTask) return;
    const { id: taskId, prompt: savedPrompt, modelId: savedModelId, confirmedRequirements: savedRequirements } = pendingTask;
    setPendingTask(null);
    fetch(`/api/projects/${projectId}/generation-task`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    }).catch(() => {});
    if (savedModelId) setSelectedModelId(savedModelId);
    const tempMsg: Message = {
      id: `temp-recovery-${Date.now()}`,
      projectId,
      role: "user",
      content: savedPrompt,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => (prev.some((m) => m.content === savedPrompt) ? prev : [...prev, tempMsg]));
    setProcessRecords((prev) => [...prev, { prompt: savedPrompt, plan: null, status: "generating" }]);
    generate(projectId, savedPrompt, savedModelId ?? undefined, savedRequirements ?? undefined);
  }, [pendingTask, projectId, generate]);

  const { status: planStatus, error: planError, createPlan, reset: resetPlan } = usePlan({
    planFailed:
      (t as typeof t & { planFailed?: string }).planFailed ?? "Plan generation failed",
    connectionError: t.connectionError,
  });
  const isPlanning = planStatus === "loading";

  // Watch stream buffer for live preview
  useEffect(() => {
    if (streamBuffer) handleStreamBuffer(streamBuffer);
  }, [streamBuffer, handleStreamBuffer]);

  const handleRaceWinner = useCallback(
    (html: string) => {
      setActiveHtml(html);
      setMode("workflow");
      mutate();
      toast.success(t.winnerSaved);
    },
    [mutate, t]
  );

  const { slots, isRacing, race, pickWinner, reset: resetRace } = useRace(handleRaceWinner, {
    raceWinnerLabel: t.raceWinnerLabel,
  });

  const handleModeChange = useCallback((nextMode: Mode) => {
    setMode(nextMode);
    if (nextMode === "workflow") {
      resetRace();
    }
  }, [resetRace]);

  const handleSend = useCallback(
    async (prompt: string) => {
      // Optimistically add user message
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        projectId,
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);

      setWorkflowPrompt(prompt);
      setAwaitingPlanConfirmation(false);

      if (mode === "race") {
        setWorkflowPlan(null);
        setProcessRecords((prev) => [...prev, { prompt, plan: null, status: "generating", isRace: true }]);
        race(projectId, prompt, selectedModelId);
      } else {
        setProcessRecords((prev) => [...prev, { prompt, plan: null, status: "planning" }]);
        const plan = await createPlan(projectId, prompt, selectedModelId);
        if (plan) {
          const normalizedPlan = {
            summary: plan.summary,
            items: plan.items.map((item) => ({ ...item, checked: true })),
          };
          setWorkflowPlan(normalizedPlan);
          setAwaitingPlanConfirmation(true);
          setProcessRecords((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], plan: normalizedPlan, status: "confirming" };
            return next;
          });
        }
      }
    },
    [mode, projectId, generate, race, selectedModelId, createPlan]
  );

  const handleTogglePlanItem = useCallback((id: string) => {
    setWorkflowPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      };
    });
  }, []);

  const handleConfirmPlan = useCallback(() => {
    if (!workflowPrompt.trim() || !workflowPlan?.items?.length) return;
    const confirmedRequirements = workflowPlan.items
      .filter((item) => item.checked)
      .map((item) => (item.description ? `${item.label}: ${item.description}` : item.label));

    if (!confirmedRequirements.length) {
      toast.error(
        (t as typeof t & { selectAtLeastOneRequirement?: string }).selectAtLeastOneRequirement ??
          "Please select at least one requirement"
      );
      return;
    }

    setAwaitingPlanConfirmation(false);
    setProcessRecords((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], status: "generating" };
      return next;
    });
    generate(projectId, workflowPrompt, selectedModelId, confirmedRequirements);
  }, [workflowPrompt, workflowPlan, t, generate, projectId, selectedModelId]);

  // Refresh messages after generation
  useEffect(() => {
    if (status === "done") {
      setAwaitingPlanConfirmation(false);
      resetPlan();
      mutate().then((d) => {
        if (d?.project?.messages) setMessages(d.project.messages);
      });
    }
  }, [status, mutate, resetPlan]);

  useEffect(() => {
    const initialPrompt = searchParams.get("prompt")?.trim();
    const hasOngoingTask = status === "streaming" || isRacing || isPlanning;
    if (!initialPrompt || !project || messages.length > 0 || hasOngoingTask) return;
    handleSend(initialPrompt);
    router.replace(`/project/${projectId}`);
  }, [searchParams, project, messages.length, status, isRacing, isPlanning, handleSend, router, projectId]);

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
          <p className="font-medium">{t.publishedMsg}</p>
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
            label: t.copyLink,
            onClick: () => navigator.clipboard.writeText(json.url),
          },
        }
      );
      mutate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? t.apiError(e.message) : t.publishFailed);
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
      toast.success(t.remixedMsg);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? t.apiError(e.message) : t.remixFailed);
    }
  };

  const handleRestoreVersion = useCallback((version: { html: string; versionNum: number }) => {
    setActiveHtml(version.html);
    setActiveVersionNum(version.versionNum);
    setShowHistory(false);
    mutate().then((d) => {
      if (d?.project?.versions?.[0]) {
        setActiveVersionNum(d.project.versions[0].versionNum);
      }
    });
  }, [mutate]);

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
  const isBusy = isGenerating || isPlanning;

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-zinc-950 flex flex-col overflow-hidden relative">
      {/* Toolbar */}
      <header className="relative z-40 h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 gap-3 shrink-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
        <Link
          href="/dashboard"
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
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
              className="text-sm font-medium text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-0.5 focus:outline-none focus:border-purple-500 w-48"
            />
          ) : (
            <button
              onClick={() => { setTitleDraft(project.title); setIsEditingTitle(true); }}
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 transition-colors group"
            >
              {project.title}
              <Pencil className="w-3 h-3 text-zinc-500 dark:text-zinc-600 group-hover:text-purple-400 transition-colors" />
            </button>
          )}
          {activeVersionNum && (
            <span className="text-xs text-zinc-500 dark:text-zinc-600 font-mono">v{activeVersionNum}</span>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LangToggle />
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
              showHistory
                ? "bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            {t.history}
          </button>
<button
            onClick={handleRemix}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <GitFork className="w-3.5 h-3.5" />
            {t.remix}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !activeHtml}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
              project.isPublished
                ? "bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50"
                : "bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40"
            }`}
          >
            {project.isPublished ? (
              <><Check className="w-3.5 h-3.5" /> {t.published}</>
            ) : (
              <><Globe className="w-3.5 h-3.5" /> {publishing ? t.publishing : t.publish}</>
            )}
          </button>
        </div>
      </header>

      {/* Interrupted generation recovery banner */}
      {pendingTask && (
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs text-amber-800 dark:text-amber-200 truncate">
              A generation was interrupted: &ldquo;{pendingTask.prompt.slice(0, 80)}{pendingTask.prompt.length > 80 ? "…" : ""}&rdquo;
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRestartFromTask}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-500 text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Restart
            </button>
            <button
              onClick={handleDismissPendingTask}
              className="p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded transition-colors"
              title="Dismiss"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main split pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[42%_1fr] overflow-hidden">
        {/* Left: Chat */}
        <div className="flex flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-800 min-h-0">
          <ChatPanel
            messages={messages}
            isStreaming={isGenerating}
            isPlanning={isPlanning}
            error={error}
            planningError={planError}
            streamReasoning={reasoningBuffer}
            onSend={handleSend}
            onCancel={() => { cancel(); resetRace(); resetPlan(); setAwaitingPlanConfirmation(false); }}
            mode={mode}
            onModeChange={handleModeChange}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            modelDisabled={isBusy}
            workflowPlan={workflowPlan}
            awaitingPlanConfirmation={awaitingPlanConfirmation}
            onTogglePlanItem={handleTogglePlanItem}
            onConfirmPlan={handleConfirmPlan}
            isGeneratingStep={status === "streaming"}
            isRacing={isRacing}
            raceSlots={slots}
            processRecords={processRecords}
            isInterrupted={status === "interrupted"}
            onResume={resume}
            onDiscard={discard}
          />
        </div>

        {/* Right: Preview */}
        <div className="flex flex-col overflow-hidden min-h-0">
          {mode === "race" && (slots[0].status !== "idle" || slots[1].status !== "idle" || isRacing) ? (
            <RaceMode
              slots={slots}
              isRacing={isRacing}
              onPickWinner={(slot) => pickWinner(projectId, slot)}
            />
          ) : (
            <>
              {/* Preview tabs */}
              <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3 bg-white dark:bg-zinc-950 shrink-0">
                {(["preview", "code", "workspace"] as PreviewTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      previewTab === tab
                        ? "border-purple-500 text-zinc-900 dark:text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                    }`}
                  >
                    {tab === "preview" ? (
                      <><Monitor className="w-3.5 h-3.5" /> {t.preview}</>
                    ) : tab === "code" ? (
                      <><Code2 className="w-3.5 h-3.5" /> {t.code}</>
                    ) : (
                      <><FolderOpen className="w-3.5 h-3.5" /> {t.workspaceFiles}</>
                    )}
                  </button>
                ))}
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-950">
                {previewTab === "preview" ? (
                  <AppViewer
                    html={activeHtml}
                    streaming={isGenerating && !activeHtml}
                  />
                ) : previewTab === "code" ? (
                  <CodeViewer
                    html={activeHtml}
                    projectId={projectId}
                    onApply={(html) => setActiveHtml(html)}
                    onVersionSaved={(html, versionNum) => {
                      setActiveHtml(html);
                      setActiveVersionNum(versionNum);
                      mutate();
                    }}
                  />
                ) : (
                  <WorkspaceFilesPanel projectId={projectId} />
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

// ---------------------------------------------------------------------------
// Workspace Files Panel (inline tab)
// ---------------------------------------------------------------------------

interface WorkspaceVersionFiles {
  version: string;
  files: string[];
}

function WorkspaceFilesPanel({ projectId }: { projectId: string }) {
  const t = useT();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useSWR<{ files: WorkspaceVersionFiles[]; diskPath: string | null }>(
    `/api/workspaces/files?projectId=${projectId}`,
    (url: string) => fetch(url).then((r) => r.json())
  );

  const files = data?.files ?? [];
  const diskPath = data?.diskPath;

  const toggle = (version: string) =>
    setExpanded((prev) => ({ ...prev, [version]: !prev[version] }));

  useEffect(() => {
    if (files.length > 0 && Object.keys(expanded).length === 0) {
      setExpanded({ [files[files.length - 1].version]: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]);

  return (
    <div className="flex flex-col h-full">
      {diskPath && (
        <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <p className="text-[10px] text-zinc-400 font-mono truncate" title={diskPath}>{diskPath}</p>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FolderOpen className="w-8 h-8 text-zinc-400 mb-2" />
            <p className="text-sm text-zinc-500">{t.noWorkspaceFiles}</p>
            <p className="text-xs text-zinc-400 mt-1">{t.workspaceFilesDesc}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {[...files].reverse().map((vf) => (
              <div key={vf.version}>
                <button
                  onClick={() => toggle(vf.version)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  {expanded[vf.version] ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{vf.version}/</span>
                  <span className="ml-auto text-xs text-zinc-400">{vf.files.length}</span>
                </button>
                {expanded[vf.version] && (
                  <div className="ml-6 space-y-0.5 mt-0.5">
                    {vf.files.map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-600 dark:text-zinc-400"
                      >
                        <FileText className="w-3 h-3 shrink-0 text-zinc-400" />
                        <span className="font-mono">{file}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
