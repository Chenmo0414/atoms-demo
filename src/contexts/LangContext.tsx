"use client";

import { createContext, useContext, useState } from "react";
import { zh } from "@/locales/zh";
import { en } from "@/locales/en";
import type { Translations } from "@/locales/zh";

export type Lang = "zh" | "en";

interface LangContextValue {
  lang: Lang;
  toggle: () => void;
  t: Translations;
}

const LangContext = createContext<LangContextValue>({
  lang: "zh",
  toggle: () => {},
  t: zh,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");
  const toggle = () => setLang((l) => (l === "zh" ? "en" : "zh"));
  const t = lang === "zh" ? zh : en;

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  return useContext(LangContext).t;
}
