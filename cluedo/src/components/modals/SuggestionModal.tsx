"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search } from "lucide-react";
import { SUSPECTS, WEAPONS, CHARACTER_META, WEAPON_ICONS } from "@/types/game";
import type { Room, Suspect, Weapon } from "@/types/game";

interface SuggestionModalProps {
  currentRoom: Room;
  onConfirm: (suspect: Suspect, weapon: Weapon) => void;
  onClose: () => void;
}

export default function SuggestionModal({ currentRoom, onConfirm, onClose }: SuggestionModalProps) {
  const [suspect, setSuspect] = useState<Suspect | "">("");
  const [weapon,  setWeapon]  = useState<Weapon  | "">("");

  function handleSubmit() {
    if (!suspect || !weapon) return;
    onConfirm(suspect as Suspect, weapon as Weapon);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal-panel"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-gold-400" />
              <h2 className="font-serif text-2xl font-bold text-manor-100">Make a Suggestion</h2>
            </div>
            <p className="text-obsidian-400 text-sm italic">
              Room: <span className="text-gold-400 font-semibold">{currentRoom}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-obsidian-500 hover:text-manor-300 transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suspects */}
        <div className="mb-5">
          <h3 className="text-xs font-serif font-bold text-gold-400/80 uppercase tracking-widest mb-3">
            Suspect
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {SUSPECTS.map((s) => {
              const meta = CHARACTER_META[s];
              return (
                <button
                  key={s}
                  onClick={() => setSuspect(s)}
                  className={[
                    "game-card flex flex-col items-center gap-1.5 py-3 transition-all",
                    suspect === s ? "selected" : "",
                  ].join(" ")}
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="font-serif text-[10px] font-bold text-manor-200 text-center leading-tight">{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weapons */}
        <div className="mb-6">
          <h3 className="text-xs font-serif font-bold text-gold-400/80 uppercase tracking-widest mb-3">
            Weapon
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {WEAPONS.map((w) => (
              <button
                key={w}
                onClick={() => setWeapon(w)}
                className={["game-card flex flex-col items-center gap-1.5 py-3", weapon === w ? "selected" : ""].join(" ")}
              >
                <span className="text-2xl">{WEAPON_ICONS[w]}</span>
                <span className="font-serif text-[10px] font-bold text-manor-200 text-center leading-tight">{w}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {suspect && weapon && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-lg bg-gold-950/30 border border-gold-600/30 text-sm text-center"
          >
            <span className="text-gold-300 font-serif italic">
              "{suspect} with the {weapon} in the {currentRoom}"
            </span>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="manor-btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!suspect || !weapon}
            className="manor-btn-primary flex-[2]"
          >
            🔍 Suggest
          </button>
        </div>
      </motion.div>
    </div>
  );
}
