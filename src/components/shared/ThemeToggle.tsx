"use client";

import { Monitor, Sun, Moon } from "lucide-react";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { useT } from "@/contexts/LangContext";

const CYCLE: ThemeMode[] = ["system", "light", "dark"];

const ICON_MAP: Record<ThemeMode, React.ReactNode> = {
  system: <Monitor className="w-3.5 h-3.5" />,
  light: <Sun className="w-3.5 h-3.5" />,
  dark: <Moon className="w-3.5 h-3.5" />,
};

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();
  const t = useT();

  const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];

  const labels: Record<ThemeMode, string> = {
    system: t.themeSystem,
    light: t.themeLight,
    dark: t.themeDark,
  };

  return (
    <button
      onClick={() => setMode(next)}
      title={labels[mode]}
      className={`flex items-center justify-center px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-transparent text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-all duration-200 hover:-translate-y-[1px] active:scale-95 ${className ?? ""}`}
    >
      <span key={mode} className="animate-preview-in">
        {ICON_MAP[mode]}
      </span>
    </button>
  );
}
