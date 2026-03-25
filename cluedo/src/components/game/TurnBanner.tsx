"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CHARACTER_META } from "@/types/game";
import type { GameState } from "@/types/game";

interface TurnBannerProps {
  gameState: GameState;
  playerId: string;
}

const PHASE_LABELS: Record<string, string> = {
  move:     "Move to a room",
  suggest:  "Make a suggestion (optional)",
  disprove: "Waiting for someone to disprove…",
  accuse:   "Make an accusation?",
  end_turn: "End your turn",
};

export default function TurnBanner({ gameState, playerId }: TurnBannerProps) {
  if (gameState.status !== "playing") return null;

  const currentPlayer = gameState.players[gameState.currentTurnIndex];
  if (!currentPlayer) return null;

  const isMe   = currentPlayer.id === playerId;
  const meta   = CHARACTER_META[currentPlayer.character];
  const phase  = PHASE_LABELS[gameState.turnPhase] ?? gameState.turnPhase;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPlayer.id + gameState.turnPhase}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className={`px-4 py-2 flex items-center gap-3 text-sm border-b
          ${isMe
            ? "bg-gold-600/10 border-gold-600/30"
            : "bg-obsidian-900/60 border-manor-600/20"}`}
      >
        <span className="text-lg">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <span className={`font-serif font-bold ${isMe ? "text-gold-400" : "text-manor-300"}`}>
            {isMe ? "Your turn" : `${currentPlayer.name}'s turn`}
          </span>
          <span className="text-obsidian-400 ml-2 text-xs italic">{phase}</span>
        </div>
        {isMe && (
          <span className="text-xs bg-gold-600/20 text-gold-400 px-2 py-0.5 rounded font-serif font-bold
                           animate-pulse">
            ● ACTIVE
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
