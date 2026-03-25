"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";
import type { GameLogEntry, LogType } from "@/types/game";

interface GameLogProps {
  entries: GameLogEntry[];
}

const TYPE_STYLES: Record<LogType, { dot: string; text: string }> = {
  move:     { dot: "bg-blue-400",    text: "text-manor-300"   },
  suggest:  { dot: "bg-gold-400",    text: "text-gold-300"    },
  disprove: { dot: "bg-green-400",   text: "text-green-300"   },
  accuse:   { dot: "bg-crimson-400", text: "text-crimson-300" },
  system:   { dot: "bg-obsidian-500",text: "text-obsidian-400"},
  win:      { dot: "bg-gold-400",    text: "text-gold-400"    },
};

export default function GameLog({ entries }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-manor-600/20 flex-shrink-0">
        <span className="text-sm">📜</span>
        <h3 className="section-title text-xs">Game Log</h3>
        <span className="ml-auto text-xs text-obsidian-600">{entries.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        <AnimatePresence initial={false}>
          {entries.map((entry) => {
            const style = TYPE_STYLES[entry.type];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 text-xs"
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${style.dot}`} />
                <span className={`flex-1 leading-snug ${style.text}`}>
                  {entry.type === "win" ? (
                    <span className="font-serif font-bold text-gold-400">{entry.message}</span>
                  ) : (
                    entry.message
                  )}
                </span>
                <span className="text-obsidian-600 flex-shrink-0 font-mono">
                  {formatTime(entry.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
