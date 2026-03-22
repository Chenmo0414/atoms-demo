"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import {
  Send,
  Square,
  Sparkles,
  User,
  Bot,
  AlertCircle,
  Brain,
  CheckCircle2,
  CircleDot,
  Loader2,
  Hammer,
  Trophy,
  Cpu,
  ClipboardList,
  RotateCcw,
  X,
} from "lucide-react";
import { LoadingDots } from "@/components/shared/LoadingDots";
import { Message, ProcessRecord } from "@/types";
import { useT } from "@/contexts/LangContext";
import { parseAssistantMessage } from "@/lib/assistantMessage";
import { ModelSelector } from "@/components/workspace/ModelSelector";
import { RaceSlot } from "@/hooks/useRace";

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  isPlanning?: boolean;
  error: string | null;
  planningError?: string | null;
  streamReasoning?: string;
  onSend: (prompt: string) => void;
  onCancel: () => void;
  mode: "workflow" | "race";
  onModeChange: (mode: "workflow" | "race") => void;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  modelDisabled?: boolean;
  workflowPlan: {
    summary: string;
    items: Array<{ id: string; label: string; description: string; checked: boolean }>;
  } | null;
  awaitingPlanConfirmation?: boolean;
  onTogglePlanItem?: (id: string) => void;
  onConfirmPlan?: () => void;
  isGeneratingStep: boolean;
  isRacing: boolean;
  raceSlots: [RaceSlot, RaceSlot];
  processRecords: ProcessRecord[];
  isInterrupted?: boolean;
  onResume?: () => void;
  onDiscard?: () => void;
}

function MessageBubble({
  message,
  streaming = false,
  streamReasoning = "",
}: {
  message: Message;
  streaming?: boolean;
  streamReasoning?: string;
}) {
  const t = useT();
  const isUser = message.role === "user";
  const assistantContent = isUser
    ? null
    : streaming
      ? { reasoning: streamReasoning, response: "" }
      : parseAssistantMessage(message.content);

  return (
    <div className={`flex gap-3 animate-message-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-purple-600" : "bg-zinc-200 dark:bg-zinc-700"
        }`}
      >
        {isUser ? (
          <User className="w-3 h-3 text-white" />
        ) : (
          <Bot className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
          isUser
            ? "bg-purple-600 text-white"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="space-y-2">
            {!!assistantContent?.reasoning && (
              <details open={streaming} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  <Brain className="w-3.5 h-3.5" />
                  {(t as typeof t & { thinkingProcess?: string }).thinkingProcess ?? "Thinking process"}
                </summary>
                <div className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 px-3 py-2 text-xs leading-6 text-zinc-600 dark:text-zinc-300">
                  {assistantContent.reasoning}
                </div>
              </details>
            )}
            <span className="italic text-zinc-500 dark:text-zinc-400">
              {streaming
                ? ((t as typeof t & { generatingWithThinking?: string }).generatingWithThinking ??
                  "Thinking and generating the app...")
                : t.appGenerated}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function statusIcon(status: "todo" | "active" | "done") {
  if (status === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === "active") return <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />;
  return <CircleDot className="w-3.5 h-3.5 text-zinc-500" />;
}

function WorkflowInChat({
  record,
  isActiveRace,
  raceSlots,
}: {
  record: ProcessRecord;
  isActiveRace: boolean;
  raceSlots: [RaceSlot, RaceSlot];
}) {
  const planStatus: "todo" | "active" | "done" =
    record.status === "planning" ? "active" : record.plan ? "done" : "todo";
  const appStatus: "todo" | "active" | "done" =
    record.status === "generating" ? "active" : record.status === "done" ? "done" : "todo";

  const stageLabel =
    record.status === "done"
      ? record.versionNum ? `v${record.versionNum}` : "Done"
      : record.status === "generating"
        ? record.isRace ? "Racing" : "Building"
        : record.status === "confirming"
          ? "Confirming"
          : record.status === "planning"
            ? "Planning"
            : "Done";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Process Record</p>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">{stageLabel}</span>
      </div>

      {record.isRace ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 px-2.5 py-2 text-[11px] text-yellow-800 dark:text-yellow-100">
            <span className="font-medium">Race mode:</span> two agents build in parallel.
          </div>
          {isActiveRace && [raceSlots[0], raceSlots[1]].map((slot, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 flex items-center justify-between"
            >
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300">Agent {idx === 0 ? "A" : "B"}</span>
              {statusIcon(slot.status === "streaming" ? "active" : slot.status === "done" ? "done" : "todo")}
            </div>
          ))}
          {record.status === "done" && record.versionNum && (
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Winner saved as v{record.versionNum}.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />Prompt</span>
              {statusIcon("done")}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{record.prompt}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1"><ClipboardList className="w-3 h-3" />Plan</span>
              {statusIcon(planStatus)}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              {record.plan?.summary || (record.status === "planning" ? "Planner is working..." : "Planner will decompose requirements before generation.")}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1"><Hammer className="w-3 h-3" />App</span>
              {statusIcon(appStatus)}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              {record.status === "done"
                ? record.versionNum ? `v${record.versionNum} generated.` : "App version generated."
                : "Builder agent generates your app from confirmed plan."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatPanel({
  messages,
  isStreaming,
  isPlanning = false,
  error,
  planningError,
  streamReasoning,
  onSend,
  onCancel,
  mode,
  onModeChange,
  selectedModelId,
  onModelChange,
  modelDisabled = false,
  workflowPlan,
  awaitingPlanConfirmation = false,
  onTogglePlanItem,
  onConfirmPlan,
  isGeneratingStep,
  isRacing,
  raceSlots,
  processRecords,
  isInterrupted = false,
  onResume,
  onDiscard,
}: ChatPanelProps) {
  const t = useT();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamReasoning, isPlanning]);

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || isStreaming || isPlanning) return;
    setInput("");
    onSend(prompt);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const suggestions = [t.suggestionTodo, t.suggestionWeather, t.suggestionPomodoro];
  const checkedPlanCount = workflowPlan?.items.filter((item) => item.checked).length ?? 0;

  // Pre-compute user-message index for each message (used to match processRecords)
  let _userIdx = 0;
  const messagesWithRecordIdx = messages.map((m) => ({
    msg: m,
    recordIdx: m.role === "user" ? _userIdx++ : -1,
  }));
  const currentRecordIdx = processRecords.length - 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center pt-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{t.whatToBuild}</p>
              <p className="text-xs text-zinc-500 mt-1">{t.describeApp}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full mt-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                  className="text-xs text-left px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messagesWithRecordIdx.map(({ msg: m, recordIdx }) => {
              const record = recordIdx >= 0 ? processRecords[recordIdx] : undefined;
              return (
                <Fragment key={m.id}>
                  <MessageBubble message={m} />
                  {record && (
                    <div className="ml-9 animate-workflow-in">
                      <WorkflowInChat
                        record={record}
                        isActiveRace={isRacing && recordIdx === currentRecordIdx}
                        raceSlots={raceSlots}
                      />
                    </div>
                  )}
                </Fragment>
              );
            })}
            {isStreaming && (
              <div className="space-y-2">
                <MessageBubble
                  message={{
                    id: "streaming-assistant",
                    projectId: "",
                    role: "assistant",
                    content: "",
                    createdAt: new Date().toISOString(),
                  }}
                  streaming
                  streamReasoning={streamReasoning}
                />
                <div className="ml-9">
                  <LoadingDots />
                </div>
              </div>
            )}
          </>
        )}
        {(error || planningError) && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error || planningError}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
        {mode === "workflow" && (isPlanning || workflowPlan) && (
          <div className="mb-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {(t as typeof t & { planReviewTitle?: string }).planReviewTitle ?? "Plan Review"}
              </p>
              {isPlanning ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-sky-500 dark:text-sky-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {(t as typeof t & { planningNow?: string }).planningNow ?? "Planning..."}
                </span>
              ) : (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {checkedPlanCount}/{workflowPlan?.items.length ?? 0}{" "}
                  {(t as typeof t & { selectedLabel?: string }).selectedLabel ?? "selected"}
                </span>
              )}
            </div>
            {workflowPlan?.summary && (
              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">{workflowPlan.summary}</p>
            )}
            {workflowPlan?.items?.length ? (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5">
                {workflowPlan.items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      disabled={isGeneratingStep || isPlanning || !onTogglePlanItem}
                      onChange={() => onTogglePlanItem?.(item.id)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100">{item.label}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : isPlanning ? (
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                {(t as typeof t & { planningRealtimeHint?: string }).planningRealtimeHint ??
                  "Planner is decomposing your request in real time..."}
              </p>
            ) : null}
            {awaitingPlanConfirmation && workflowPlan?.items?.length ? (
              <button
                onClick={onConfirmPlan}
                disabled={isPlanning || isGeneratingStep || checkedPlanCount === 0}
                className="mt-2 w-full rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-xs font-medium text-white transition-colors"
              >
                {(t as typeof t & { confirmAndBuild?: string }).confirmAndBuild ?? "Confirm & Build"}
              </button>
            ) : null}
          </div>
        )}

        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => onModeChange("workflow")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all duration-200 ${
                mode === "workflow"
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:-translate-y-[1px]"
              }`}
            >
              <Cpu className="w-3 h-3" />
              Workflow
            </button>
            <button
              onClick={() => onModeChange("race")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all duration-200 ${
                mode === "race"
                  ? "bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700/50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:-translate-y-[1px]"
              }`}
            >
              <Trophy className="w-3 h-3" />
              {t.race}
            </button>
          </div>
          <div className="ml-auto">
            <ModelSelector
              value={selectedModelId}
              onChange={onModelChange}
              disabled={modelDisabled}
            />
          </div>
        </div>

        {mode === "race" && (
          <div className="mb-2 text-xs text-center text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-2 py-1">
            {t.raceModeBadge}
          </div>
        )}

        {isInterrupted && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-900/20 px-3 py-2">
            <span className="text-xs text-orange-700 dark:text-orange-300">Generation interrupted — resume or discard?</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onResume}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-orange-600 hover:bg-orange-500 text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Resume
              </button>
              <button
                onClick={onDiscard}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
              >
                <X className="w-3 h-3" />
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={messages.length > 0 ? t.iteratePlaceholder : t.describeAppPlaceholder}
            rows={1}
            className="flex-1 resize-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[42px] max-h-[120px]"
          />
          {isStreaming ? (
            <button
              onClick={onCancel}
              className="shrink-0 w-10 h-10 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-xl flex items-center justify-center transition-colors"
              title={t.cancelTitle}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPlanning}
              className="shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
              title={t.sendTitle}
            >
              {isPlanning ? <LoadingDots /> : <Send className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
