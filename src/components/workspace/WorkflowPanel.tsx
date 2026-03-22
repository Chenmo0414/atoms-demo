"use client";

import { Brain, CheckCircle2, CircleDot, ClipboardList, Hammer, Loader2, Sparkles, Users } from "lucide-react";
import { useT } from "@/contexts/LangContext";
import { RaceSlot } from "@/hooks/useRace";

interface PlanItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface WorkflowPanelProps {
  mode: "workflow" | "race";
  prompt: string;
  plan: { summary: string; items: PlanItem[] } | null;
  isPlanning: boolean;
  isGenerating: boolean;
  generationDone: boolean;
  isRacing: boolean;
  raceSlots: [RaceSlot, RaceSlot];
}

function statusBadge(status: "todo" | "active" | "done") {
  if (status === "done") {
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  }
  if (status === "active") {
    return <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />;
  }
  return <CircleDot className="w-4 h-4 text-zinc-500" />;
}

export function WorkflowPanel({
  mode,
  prompt,
  plan,
  isPlanning,
  isGenerating,
  generationDone,
  isRacing,
  raceSlots,
}: WorkflowPanelProps) {
  const t = useT();
  const hasPrompt = !!prompt.trim();

  const promptStatus: "todo" | "active" | "done" = hasPrompt ? "done" : "todo";
  const planStatus: "todo" | "active" | "done" = !hasPrompt
    ? "todo"
    : isPlanning
      ? "active"
      : !!plan
        ? "done"
        : "todo";
  const appStatus: "todo" | "active" | "done" = !hasPrompt
    ? "todo"
    : isGenerating
      ? "active"
      : generationDone
        ? "done"
        : "todo";
  const workflowStage =
    mode === "race"
      ? isRacing
        ? "Racing"
        : "Race ready"
      : isGenerating
        ? "Building"
        : isPlanning
          ? "Planning"
          : generationDone
            ? "Completed"
            : hasPrompt
              ? "Recorded"
              : "Waiting";

  const workflowSteps = [
    {
      id: "prompt",
      title: (t as typeof t & { promptStep?: string }).promptStep ?? "Prompt",
      desc:
        prompt ||
        ((t as typeof t & { waitingPrompt?: string }).waitingPrompt ?? "Waiting for your product request"),
      status: promptStatus,
      icon: Sparkles,
    },
    {
      id: "plan",
      title: (t as typeof t & { planStep?: string }).planStep ?? "Plan",
      desc:
        plan?.summary ||
        ((t as typeof t & { planStepDesc?: string }).planStepDesc ?? "Planner agent breaks request into implementation steps"),
      status: planStatus,
      icon: ClipboardList,
    },
    {
      id: "app",
      title: (t as typeof t & { appStep?: string }).appStep ?? "App",
      desc:
        (generationDone
          ? (t as typeof t & { appReadyDesc?: string }).appReadyDesc
          : (t as typeof t & { appBuildingDesc?: string }).appBuildingDesc) ??
        (generationDone ? "App version is ready in preview" : "Builder agent is generating HTML/CSS/JS"),
      status: appStatus,
      icon: Hammer,
    },
  ];

  const raceStepLabel = (slot: number, status: RaceSlot["status"]) => {
    if (status === "done") return `Agent ${slot} done`;
    if (status === "streaming") return `Agent ${slot} building`;
    if (status === "error") return `Agent ${slot} failed`;
    return `Agent ${slot} waiting`;
  };

  return (
    <aside className="hidden lg:flex flex-col min-h-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {(t as typeof t & { workflowTitle?: string }).workflowTitle ?? "Process Record"}
        </h2>
        <span className="ml-auto text-[10px] uppercase text-zinc-500 dark:text-zinc-400">{workflowStage}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {mode === "race" ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/20 p-3">
              <p className="text-xs font-medium text-yellow-200">Race Mode</p>
              <p className="text-[11px] text-yellow-100/80 mt-1">
                Two builder agents generate different directions in parallel.
              </p>
            </div>
            {[raceSlots[0], raceSlots[1]].map((slot, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Agent {idx === 0 ? "A" : "B"}</p>
                  {statusBadge(slot.status === "streaming" ? "active" : slot.status === "done" ? "done" : "todo")}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{raceStepLabel(idx === 0 ? 1 : 2, slot.status)}</p>
              </div>
            ))}
            {isRacing && (
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 px-2.5 py-2 text-[11px] text-zinc-300">
                {(t as typeof t & { raceHint?: string }).raceHint ?? "Pick the winner to save the best version."}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{step.title}</p>
                      </div>
                      {statusBadge(step.status)}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-3">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-3.5 h-3.5 text-sky-400" />
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {(t as typeof t & { plannerChecklist?: string }).plannerChecklist ?? "Planner Checklist"}
                </p>
              </div>
              {plan?.items?.length ? (
                <div className="space-y-2">
                  {plan.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${item.checked ? "text-emerald-400" : "text-zinc-500"}`} />
                        <div>
                          <p className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100">{item.label}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {(t as typeof t & { waitingPlan?: string }).waitingPlan ?? "Plan steps will appear after your prompt."}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
