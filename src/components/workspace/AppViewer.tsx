"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { LoadingDots } from "@/components/shared/LoadingDots";

interface AppViewerProps {
  html: string;
  streaming?: boolean;
  label?: string;
}

export function AppViewer({ html, streaming, label }: AppViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      iframeRef.current.srcdoc = html;
    }
  }, [html]);

  if (!html && !streaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
        <Sparkles className="w-10 h-10" />
        <p className="text-sm">Your app will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {label && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-zinc-900/80 backdrop-blur rounded text-xs text-zinc-400 border border-zinc-700">
          {label}
        </div>
      )}
      {streaming && !html && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur z-10">
          <div className="flex flex-col items-center gap-3">
            <LoadingDots />
            <p className="text-xs text-zinc-500">Generating...</p>
          </div>
        </div>
      )}
      {html && (
        <iframe
          ref={iframeRef}
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          className="w-full h-full border-0"
          title={label || "app-preview"}
        />
      )}
    </div>
  );
}
