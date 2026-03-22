"use client";

import { Trophy, Zap } from "lucide-react";
import { AppViewer } from "./AppViewer";
import { RaceSlot } from "@/hooks/useRace";
import { LoadingDots } from "@/components/shared/LoadingDots";

interface RaceModeProps {
  slots: [RaceSlot, RaceSlot];
  isRacing: boolean;
  onPickWinner: (slot: 0 | 1) => void;
}

function SlotPanel({
  slot,
  index,
  isRacing,
  onPickWinner,
}: {
  slot: RaceSlot;
  index: 0 | 1;
  isRacing: boolean;
  onPickWinner: (slot: 0 | 1) => void;
}) {
  const label = index === 0 ? "Agent A" : "Agent B";
  const color = index === 0 ? "purple" : "blue";

  return (
    <div className="flex flex-col h-full border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800`}>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              slot.status === "streaming"
                ? "bg-yellow-400 animate-pulse"
                : slot.status === "done"
                ? "bg-green-400"
                : slot.status === "error"
                ? "bg-red-400"
                : "bg-zinc-600"
            }`}
          />
          <span className="text-xs font-medium text-zinc-300">{label}</span>
          {slot.status === "streaming" && <LoadingDots />}
        </div>
        {slot.status === "done" && slot.html && (
          <button
            onClick={() => onPickWinner(index)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              color === "purple"
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            <Trophy className="w-3 h-3" />
            Pick Winner
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 bg-zinc-950">
        <AppViewer
          html={slot.html || ""}
          streaming={slot.status === "streaming"}
        />
      </div>
    </div>
  );
}

export function RaceMode({ slots, isRacing, onPickWinner }: RaceModeProps) {
  const bothDone = slots[0].status === "done" && slots[1].status === "done";

  return (
    <div className="flex flex-col h-full">
      {/* Race header */}
      <div className="flex items-center justify-center gap-2 py-2 border-b border-zinc-800 bg-zinc-950">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium text-white">Race Mode</span>
        {isRacing && (
          <span className="text-xs text-zinc-500">
            — two agents competing simultaneously
          </span>
        )}
        {bothDone && (
          <span className="text-xs text-green-400">— pick the winner!</span>
        )}
      </div>

      {/* Slots side by side */}
      <div className="flex-1 grid grid-cols-2 gap-3 p-3">
        <SlotPanel slot={slots[0]} index={0} isRacing={isRacing} onPickWinner={onPickWinner} />
        <SlotPanel slot={slots[1]} index={1} isRacing={isRacing} onPickWinner={onPickWinner} />
      </div>
    </div>
  );
}
