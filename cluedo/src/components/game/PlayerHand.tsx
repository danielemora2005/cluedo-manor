"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { CHARACTER_META, WEAPON_ICONS, ROOM_ICONS, SUSPECTS, WEAPONS } from "@/types/game";
import type { Player, Card } from "@/types/game";

interface PlayerHandProps {
  player: Player;
}

// Determine the type and visual data for a card
function getCardVisual(card: Card): { icon: string; label: string; type: "suspect" | "weapon" | "room"; color: string } {
  if (SUSPECTS.includes(card as any)) {
    const meta = CHARACTER_META[card as keyof typeof CHARACTER_META];
    return { icon: meta.icon, label: card, type: "suspect", color: meta.color };
  }
  if (WEAPONS.includes(card as any)) {
    return { icon: WEAPON_ICONS[card as keyof typeof WEAPON_ICONS], label: card, type: "weapon", color: "#7c3aed" };
  }
  return { icon: ROOM_ICONS[card as keyof typeof ROOM_ICONS] ?? "🚪", label: card, type: "room", color: "#1d4ed8" };
}

const TYPE_LABEL: Record<string, string> = {
  suspect: "Suspect",
  weapon:  "Weapon",
  room:    "Room",
};

const TYPE_STYLE: Record<string, string> = {
  suspect: "border-crimson-700/50 bg-crimson-950/30",
  weapon:  "border-purple-700/50 bg-purple-950/30",
  room:    "border-blue-700/50 bg-blue-950/30",
};

export default function PlayerHand({ player }: PlayerHandProps) {
  const [revealed, setRevealed] = useState(true);

  return (
    <div className="manor-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title text-sm">🃏 Your Cards</h3>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="text-obsidian-400 hover:text-manor-300 transition-colors p-1"
          title={revealed ? "Hide cards" : "Show cards"}
        >
          {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {player.cards.length === 0 && (
        <p className="text-obsidian-500 text-sm italic text-center py-2">No cards dealt yet.</p>
      )}

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {player.cards.map((card, i) => {
              const { icon, label, type, color } = getCardVisual(card);
              return (
                <motion.div
                  key={card}
                  initial={{ opacity: 0, y: -20, rotate: -5 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`game-card flex flex-col items-center gap-1 w-24 py-3 px-2 border-2
                    ${TYPE_STYLE[type]}`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono"
                    style={{ color }}>
                    {TYPE_LABEL[type]}
                  </span>
                  <span className="font-serif text-xs font-bold text-manor-200 text-center leading-tight">
                    {label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!revealed && (
        <div className="flex gap-2">
          {player.cards.map((_, i) => (
            <div key={i} className="w-16 h-24 rounded-lg bg-obsidian-800 border border-manor-600/20
                                    flex items-center justify-center">
              <span className="text-obsidian-600 text-2xl">🂠</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-obsidian-500 text-xs mt-2 italic">
        {player.cards.length} card{player.cards.length !== 1 ? "s" : ""} — visible only to you
      </p>
    </div>
  );
}
