"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Bot } from "lucide-react";
import { MODELS, groupModelsByVendor, type ModelInfo } from "@/lib/models";

// Capability badge colors
const capBadge: Record<string, string> = {
  "文本生成": "bg-zinc-700 text-zinc-300",
  "深度思考": "bg-purple-900/60 text-purple-300",
  "视觉理解": "bg-blue-900/60 text-blue-300",
};

// Provider accent colors
const vendorColor: Record<string, string> = {
  Anthropic: "text-orange-400",
  OpenAI: "text-green-400",
  千问: "text-cyan-400",
  智谱: "text-violet-400",
  Kimi: "text-pink-400",
  MiniMax: "text-yellow-400",
};

interface ModelSelectorProps {
  value: string; // modelId e.g. "bailian:qwen3.5-plus"
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const groups = groupModelsByVendor();

  const current = MODELS.find((m) => m.id === value) ?? MODELS[0];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (m: ModelInfo) => {
    onChange(m.id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors max-w-[160px] ${
          open
            ? "border-purple-600 bg-zinc-800 text-white"
            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title={`${current.vendor} · ${current.displayName}`}
      >
        <Bot className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">
          <span className={`${vendorColor[current.vendor] ?? "text-zinc-400"} mr-0.5`}>
            {current.vendor}
          </span>
          <span className="text-zinc-300">{current.displayName}</span>
        </span>
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto">
            {Object.entries(groups).map(([vendor, models]) => (
              <div key={vendor}>
                <div className="px-3 py-2 text-xs font-semibold text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-900">
                  <span className={vendorColor[vendor] ?? "text-zinc-400"}>{vendor}</span>
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => select(m)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-zinc-800 transition-colors ${
                      m.id === value ? "bg-zinc-800/80" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${m.id === value ? "text-purple-300" : "text-white"}`}>
                          {m.displayName}
                        </span>
                        {m.id === value && (
                          <span className="text-[10px] text-purple-400">✓</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${capBadge[cap] ?? "bg-zinc-700 text-zinc-400"}`}
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
