"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { LoadingDots } from "@/components/shared/LoadingDots";
import { useT } from "@/contexts/LangContext";
import { extractHTML } from "@/lib/extractCode";

interface AppViewerProps {
  html: string;
  streaming?: boolean;
  label?: string;
}

export function AppViewer({ html, streaming, label }: AppViewerProps) {
  const t = useT();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameKey, setFrameKey] = useState(0);
  const cleanHtml = useMemo(() => extractHTML(html), [html]);

  useEffect(() => {
    if (iframeRef.current && cleanHtml) {
      iframeRef.current.srcdoc = cleanHtml;
      setFrameKey((k) => k + 1);
    }
  }, [cleanHtml]);

  if (!cleanHtml && !streaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
        <Sparkles className="w-10 h-10" />
        <p className="text-sm">{t.appWillAppear}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {label && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur rounded text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
          {label}
        </div>
      )}
      {streaming && !cleanHtml && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur z-10">
          <div className="flex flex-col items-center gap-3">
            <LoadingDots />
            <p className="text-xs text-zinc-500">{t.generating}</p>
          </div>
        </div>
      )}
      {cleanHtml && (
        <iframe
          key={frameKey}
          ref={iframeRef}
          srcDoc={cleanHtml}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          className="w-full h-full border-0 animate-preview-in"
          title={label || "app-preview"}
        />
      )}
    </div>
  );
}
