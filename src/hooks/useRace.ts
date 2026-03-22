"use client";

import { useState, useRef, useCallback } from "react";

export interface RaceSlot {
  status: "idle" | "streaming" | "done" | "error";
  buffer: string;
  html: string | null;
}

export interface RaceState {
  isRacing: boolean;
  slots: [RaceSlot, RaceSlot];
}

const initialSlot = (): RaceSlot => ({
  status: "idle",
  buffer: "",
  html: null,
});

export function useRace(
  onWinnerPicked?: (html: string, prompt: string) => void,
  messages?: { raceWinnerLabel: (agent: string) => string }
) {
  const [state, setState] = useState<RaceState>({
    isRacing: false,
    slots: [initialSlot(), initialSlot()],
  });

  const abortRef = useRef<AbortController | null>(null);
  const promptRef = useRef("");

  const race = useCallback(async (projectId: string, prompt: string, modelId?: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    promptRef.current = prompt;

    setState({
      isRacing: true,
      slots: [
        { status: "streaming", buffer: "", html: null },
        { status: "streaming", buffer: "", html: null },
      ],
    });

    try {
      const res = await fetch("/api/race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, prompt, modelId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setState((s) => ({
          ...s,
          isRacing: false,
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const buffers = ["", ""];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            const slot = event.slot as 0 | 1;

            if (event.type === "delta") {
              buffers[slot] += event.content;
              const b = buffers[slot];
              setState((s) => {
                const slots = [...s.slots] as [RaceSlot, RaceSlot];
                slots[slot] = { ...slots[slot], buffer: b };
                return { ...s, slots };
              });
            } else if (event.type === "done") {
              setState((s) => {
                const slots = [...s.slots] as [RaceSlot, RaceSlot];
                slots[slot] = { status: "done", buffer: buffers[slot], html: event.html };
                return { ...s, slots };
              });
            } else if (event.type === "error") {
              setState((s) => {
                const slots = [...s.slots] as [RaceSlot, RaceSlot];
                slots[slot] = { ...slots[slot], status: "error" };
                return { ...s, slots };
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      setState((s) => ({ ...s, isRacing: false }));
    }
  }, []);

  const pickWinner = useCallback(
    async (projectId: string, slot: 0 | 1) => {
      const html = state.slots[slot].html;
      if (!html) return;

      await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          prompt: promptRef.current,
          label: messages?.raceWinnerLabel(slot === 0 ? "A" : "B") ?? `Race winner (Agent ${slot === 0 ? "A" : "B"})`,
        }),
      });

      onWinnerPicked?.(html, promptRef.current);
      setState({ isRacing: false, slots: [initialSlot(), initialSlot()] });
    },
    [state.slots, onWinnerPicked]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ isRacing: false, slots: [initialSlot(), initialSlot()] });
  }, []);

  return { ...state, race, pickWinner, reset };
}
