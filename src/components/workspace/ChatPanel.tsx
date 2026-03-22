"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, Sparkles, User, Bot, AlertCircle } from "lucide-react";
import { LoadingDots } from "@/components/shared/LoadingDots";
import { Message } from "@/types";

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  onSend: (prompt: string) => void;
  onCancel: () => void;
  mode: "engineer" | "race";
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-purple-600" : "bg-zinc-700"
        }`}
      >
        {isUser ? (
          <User className="w-3 h-3 text-white" />
        ) : (
          <Bot className="w-3 h-3 text-zinc-300" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
          isUser
            ? "bg-purple-600 text-white"
            : "bg-zinc-800 text-zinc-300"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          // For assistant messages, show a summary instead of the full HTML
          <span className="italic text-zinc-400">
            ✓ App generated — see preview on the right
          </span>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  messages,
  isStreaming,
  error,
  onSend,
  onCancel,
  mode,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || isStreaming) return;
    setInput("");
    onSend(prompt);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">What do you want to build?</p>
              <p className="text-xs text-zinc-500 mt-1">
                Describe your app and Atoms will build it
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full mt-2">
              {["Build a todo app with dark mode", "Create a weather dashboard", "Make a Pomodoro timer"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="text-xs text-left px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors border border-zinc-700 hover:border-zinc-600"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isStreaming && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-zinc-300" />
                </div>
                <div className="bg-zinc-800 rounded-xl px-3 py-2">
                  <LoadingDots />
                </div>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3">
        {mode === "race" && (
          <div className="mb-2 text-xs text-center text-amber-400 bg-amber-900/20 border border-amber-800/50 rounded-lg px-2 py-1">
            ⚡ Race Mode — two agents will compete
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              messages.length > 0
                ? 'Iterate: "make the button blue", "add a dark mode toggle"...'
                : "Describe your app..."
            }
            rows={1}
            className="flex-1 resize-none bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[42px] max-h-[120px]"
          />
          {isStreaming ? (
            <button
              onClick={onCancel}
              className="shrink-0 w-10 h-10 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl flex items-center justify-center transition-colors"
              title="Cancel"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
