"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { CHARACTER_META, WEAPON_ICONS, ROOM_ICONS, SUSPECTS, WEAPONS } from "@/types/game";
import type { Player, Suggestion, Card } from "@/types/game";

interface DisproveModalProps {
  suggestion: Suggestion;
  player: Player;
  onDisprove: (card: Card) => void;
  onClose: () => void;
}

function getCardVisual(card: Card) {
  if (SUSPECTS.includes(card as any)) {
    const meta = CHARACTER_META[card as keyof typeof CHARACTER_META];
    return { icon: meta.icon, color: meta.color, type: "Suspect" };
  }
  if (WEAPONS.includes(card as any)) {
    return { icon: WEAPON_ICONS[card as keyof typeof WEAPON_ICONS], color: "#7c3aed", type: "Weapon" };
  }
  return { icon: ROOM_ICONS[card as keyof typeof ROOM_ICONS] ?? "🚪", color: "#1d4ed8", type: "Room" };
}

export default function DisproveModal({ suggestion, player, onDisprove, onClose }: DisproveModalProps) {
  const [selected, setSelected] = useState<Card | null>(null);

  // Cards the player can show
  const options = player.cards.filter(
    (c) => c === suggestion.suspect || c === suggestion.weapon || c === suggestion.room
  );

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal-panel border-green-700/30"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-green-400" />
          <h2 className="font-serif text-2xl font-bold text-manor-100">Disprove the Suggestion</h2>
        </div>

        <p className="text-obsidian-400 text-sm mb-1 italic">
          Someone suggested:
        </p>
        <p className="text-gold-300 font-serif text-sm mb-5 p-3 bg-gold-950/20 rounded border border-gold-700/20">
          "{suggestion.suspect} with the {suggestion.weapon} in the {suggestion.room}"
        </p>

        {options.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-obsidian-400 italic">You have no cards to show.</p>
            <p className="text-obsidian-600 text-xs mt-1">The suggester will be notified.</p>
          </div>
        ) : (
          <>
            <p className="text-manor-300 text-sm mb-3">
              Select a card to secretly show to the suggester:
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {options.map((card) => {
                const { icon, color, type } = getCardVisual(card);
                return (
                  <button
                    key={card}
                    onClick={() => setSelected(card)}
                    className={["game-card flex flex-col items-center gap-2 py-4 w-32", selected === card ? "selected" : ""].join(" ")}
                  >
                    <span className="text-3xl">{icon}</span>
                    <span className="text-[9px] uppercase tracking-wider font-mono" style={{ color }}>{type}</span>
                    <span className="font-serif text-xs font-bold text-manor-200 text-center leading-tight">{card}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="flex gap-3">
          {options.length > 0 ? (
            <button
              onClick={() => selected && onDisprove(selected)}
              disabled={!selected}
              className="manor-btn-primary w-full"
            >
              <Shield className="w-4 h-4" /> Show Card
            </button>
          ) : (
            <button onClick={() => onDisprove(player.cards[0])} className="manor-btn-secondary w-full">
              I cannot disprove this
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
