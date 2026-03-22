"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import { Copy, Check, Download, Play, Save, FileCode, FileType, FileJson } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/contexts/LangContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  parseHtmlToFiles,
  mergeFilesToHtml,
  getLanguage,
  type FileRecord,
} from "@/lib/parseHtmlFiles";

interface CodeViewerProps {
  html: string;
  projectId?: string;
  onApply?: (html: string) => void;
  onVersionSaved?: (html: string, versionNum: number) => void;
}

function FileIcon({ filename }: { filename: string }) {
  if (filename.endsWith(".css")) return <FileType className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (filename.endsWith(".js")) return <FileJson className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
  return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
}

export function CodeViewer({ html, projectId, onApply, onVersionSaved }: CodeViewerProps) {
  const t = useT();
  const { resolvedTheme } = useTheme();

  // filesRef is the source of truth; fileList + activeFile drive rendering
  const filesRef = useRef<FileRecord>({});
  const [fileList, setFileList] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState("index.html");
  /** Bumped to force Monaco remount on new html or file switch */
  const [editorKey, setEditorKey] = useState(0);

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // Re-parse whenever a new HTML version loads
  useEffect(() => {
    if (!html) return;
    const parsed = parseHtmlToFiles(html);
    filesRef.current = parsed;
    setFileList(Object.keys(parsed));
    setActiveFile("index.html");
    setEditorKey((k) => k + 1);
  }, [html]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  /** Flush the active editor value into filesRef before doing anything else. */
  const flushEditor = useCallback(() => {
    if (editorRef.current) {
      filesRef.current[activeFile] = editorRef.current.getValue();
    }
  }, [activeFile]);

  const handleFileSelect = (filename: string) => {
    if (filename === activeFile) return;
    flushEditor();
    setActiveFile(filename);
    setEditorKey((k) => k + 1);
  };

  const getMergedHtml = (): string => {
    flushEditor();
    return mergeFilesToHtml(filesRef.current);
  };

  const handleCopy = async () => {
    const value = editorRef.current?.getValue() ?? filesRef.current[activeFile] ?? "";
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(t.copiedToClipboard);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getMergedHtml()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    onApply?.(getMergedHtml());
  };

  const handleSaveVersion = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const merged = getMergedHtml();
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveHtml: merged }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(t.versionSaved(json.version.versionNum));
      onVersionSaved?.(merged, json.version.versionNum);
    } catch {
      toast.error(t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        {t.generateToViewCode}
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── File Tree ─────────────────────────────────────────── */}
      <div className="w-40 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 select-none">
          Files
        </div>
        <div className="flex-1 overflow-auto py-1">
          {fileList.map((filename) => (
            <button
              key={filename}
              onClick={() => handleFileSelect(filename)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                activeFile === filename
                  ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileIcon filename={filename} />
              <span className="font-mono truncate">{filename}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor Pane ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{activeFile}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-1.5 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">{t.download}</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-1.5 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copied ? t.copied : t.copy}</span>
            </button>
            {onApply && (
              <button
                onClick={handleApply}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
              >
                <Play className="w-3 h-3" />
                {t.applyToPreview}
              </button>
            )}
            {projectId && (
              <button
                onClick={handleSaveVersion}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded transition-colors"
              >
                <Save className="w-3 h-3" />
                {saving ? "..." : t.saveAsVersion}
              </button>
            )}
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            key={editorKey}
            defaultValue={filesRef.current[activeFile] ?? ""}
            language={getLanguage(activeFile)}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            onMount={handleMount}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              renderWhitespace: "none",
              overviewRulerLanes: 0,
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
