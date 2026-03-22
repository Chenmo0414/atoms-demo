"use client";

import { useState, useRef, useCallback } from "react";

export interface GenerateState {
  status: "idle" | "streaming" | "done" | "error";
  streamBuffer: string;
  currentHtml: string;
  currentVersionId: string | null;
  currentVersionNum: number | null;
  error: string | null;
}

export function useGenerate(
  onComplete?: (html: string, versionId: string, versionNum: number) => void
) {
  const [state, setState] = useState<GenerateState>({
    status: "idle",
    streamBuffer: "",
    currentHtml: "",
    currentVersionId: null,
    currentVersionNum: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef("");

  const generate = useCallback(
    async (projectId: string, prompt: string, modelId?: string) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      abortRef.current = new AbortController();
      bufferRef.current = "";

      setState({
        status: "streaming",
        streamBuffer: "",
        currentHtml: "",
        currentVersionId: null,
        currentVersionNum: null,
        error: null,
      });

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, prompt, modelId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => ({}));
          setState((s) => ({
            ...s,
            status: "error",
            error: json.error || "Generation failed",
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
                  error: event.message,
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
          error: "Connection error",
        }));
      }
    },
    [onComplete]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, status: "idle" }));
  }, []);

  const reset = useCallback(() => {
    setState({
      status: "idle",
      streamBuffer: "",
      currentHtml: "",
      currentVersionId: null,
      currentVersionNum: null,
      error: null,
    });
  }, []);

  return { ...state, generate, cancel, reset };
}
