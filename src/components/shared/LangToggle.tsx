"use client";

import { useLang } from "@/contexts/LangContext";

export function LangToggle({ className }: { className?: string }) {
  const { t, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      className={`text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-transparent text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors ${className ?? ""}`}
    >
      {t.langToggle}
    </button>
  );
}
