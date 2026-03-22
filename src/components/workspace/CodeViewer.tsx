"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { codeToHtml } from "shiki";

interface CodeViewerProps {
  html: string;
}

export function CodeViewer({ html }: CodeViewerProps) {
  const [highlighted, setHighlighted] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!html) return;
    codeToHtml(html, {
      lang: "html",
      theme: "github-dark",
    })
      .then(setHighlighted)
      .catch(() => setHighlighted(`<pre style="color:#e1e4e8;background:#0d1117;padding:1rem;overflow:auto;white-space:pre-wrap;">${html.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`));
  }, [html]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Generate an app to view its code
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 shrink-0">
        <span className="text-xs text-zinc-500 font-mono">app.html</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {highlighted ? (
          <div
            className="text-xs [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:m-0 [&>pre]:overflow-auto"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <pre className="p-4 text-xs text-zinc-400 overflow-auto whitespace-pre-wrap">
            {html}
          </pre>
        )}
      </div>
    </div>
  );
}
