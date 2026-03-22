"use client";

import { useCallback, useState } from "react";
import { PlanResult } from "@/types";

export function usePlan(messages?: { planFailed: string; connectionError: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPlan = useCallback(
    async (projectId: string, prompt: string, modelId?: string) => {
      setStatus("loading");
      setPlan(null);
      setError(null);

      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, prompt, modelId }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.plan) {
          setStatus("error");
          setError(json.error || messages?.planFailed || "Plan generation failed");
          return null;
        }

        setPlan(json.plan);
        setStatus("done");
        return json.plan as PlanResult;
      } catch {
        setStatus("error");
        setError(messages?.connectionError || "Connection error");
        return null;
      }
    },
    [messages]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setPlan(null);
    setError(null);
  }, []);

  return {
    status,
    plan,
    error,
    createPlan,
    reset,
  };
}

