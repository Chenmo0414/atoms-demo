"use client";

import { useState, useRef, useCallback } from "react";

export interface GenerateState {
  status: "idle" | "streaming" | "done" | "error" | "interrupted";
  streamBuffer: string;
  reasoningBuffer: string;
  currentHtml: string;
  currentVersionId: string | null;
  currentVersionNum: number | null;
  error: string | null;
  interruptedBuffer: string | null;
}

export function useGenerate(
  onComplete?: (html: string, versionId: string, versionNum: number) => void,
  messages?: { generationFailed: string; connectionError: string }
) {
  const [state, setState] = useState<GenerateState>({
    status: "idle",
    streamBuffer: "",
    reasoningBuffer: "",
    currentHtml: "",
    currentVersionId: null,
    currentVersionNum: null,
    error: null,
    interruptedBuffer: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef("");
  const interruptedBufferRef = useRef<string | null>(null);
  const lastProjectIdRef = useRef("");
  const lastPromptRef = useRef("");
  const lastModelIdRef = useRef<string | undefined>(undefined);
  const lastConfirmedRef = useRef<string[] | undefined>(undefined);

  const generate = useCallback(
    async (
      projectId: string,
      prompt: string,
      modelId?: string,
      confirmedRequirements?: string[],
      resumeFrom?: string
    ) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      abortRef.current = new AbortController();
      bufferRef.current = "";
      lastProjectIdRef.current = projectId;
      lastPromptRef.current = prompt;
      lastModelIdRef.current = modelId;
      lastConfirmedRef.current = confirmedRequirements;

      setState({
        status: "streaming",
        streamBuffer: "",
        reasoningBuffer: "",
        currentHtml: "",
        currentVersionId: null,
        currentVersionNum: null,
        error: null,
        interruptedBuffer: null,
      });

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, prompt, modelId, confirmedRequirements, resumeFrom }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => ({}));
          setState((s) => ({
            ...s,
            status: "error",
            error: json.error || messages?.generationFailed || "Generation failed",
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "delta") {
                bufferRef.current += event.content;
                setState((s) => ({
                  ...s,
                  streamBuffer: bufferRef.current,
                }));
              } else if (event.type === "reasoning") {
                setState((s) => ({
                  ...s,
                  reasoningBuffer: s.reasoningBuffer + event.content,
                }));
              } else if (event.type === "done") {
                setState((s) => ({
                  ...s,
                  status: "done",
                  currentHtml: event.html,
                  currentVersionId: event.versionId,
                  currentVersionNum: event.versionNum,
                  streamBuffer: bufferRef.current,
                }));
                onComplete?.(event.html, event.versionId, event.versionNum);
              } else if (event.type === "error") {
                setState((s) => ({
                  ...s,
                  status: "error",
                  error: messages?.generationFailed || event.message,
                }));
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        setState((s) => ({
          ...s,
          status: "error",
          error: messages?.connectionError || "Connection error",
        }));
      }
    },
    [messages?.connectionError, messages?.generationFailed, onComplete]
  );

  // Interrupt: abort but save partial content for resume
  const cancel = useCallback(() => {
    const partial = bufferRef.current;
    abortRef.current?.abort();
    if (partial && partial.length > 200) {
      interruptedBufferRef.current = partial;
      setState((s) => ({
        ...s,
        status: "interrupted",
        streamBuffer: "",
        reasoningBuffer: "",
        interruptedBuffer: partial,
      }));
    } else {
      interruptedBufferRef.current = null;
      setState((s) => ({
        ...s,
        status: "idle",
        streamBuffer: "",
        reasoningBuffer: "",
        interruptedBuffer: null,
      }));
    }
  }, []);

  // Resume from interrupted state
  const resume = useCallback(async () => {
    const partial = interruptedBufferRef.current;
    const projectId = lastProjectIdRef.current;
    const prompt = lastPromptRef.current;
    if (!projectId || !prompt) return;
    interruptedBufferRef.current = null;
    await generate(
      projectId,
      prompt,
      lastModelIdRef.current,
      lastConfirmedRef.current,
      partial ?? undefined
    );
  }, [generate]);

  // Discard interrupted state
  const discard = useCallback(() => {
    interruptedBufferRef.current = null;
    setState((s) => ({
      ...s,
      status: "idle",
      streamBuffer: "",
      reasoningBuffer: "",
      interruptedBuffer: null,
    }));
  }, []);

  const reset = useCallback(() => {
    interruptedBufferRef.current = null;
    setState({
      status: "idle",
      streamBuffer: "",
      reasoningBuffer: "",
      currentHtml: "",
      currentVersionId: null,
      currentVersionNum: null,
      error: null,
      interruptedBuffer: null,
    });
  }, []);

  return { ...state, generate, cancel, resume, discard, reset };
}
