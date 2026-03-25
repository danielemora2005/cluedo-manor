"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { SUSPECTS, WEAPONS, ROOMS, CHARACTER_META, WEAPON_ICONS, ROOM_ICONS } from "@/types/game";
import type { Suspect, Weapon, Room } from "@/types/game";

interface AccusationModalProps {
  onConfirm: (suspect: Suspect, weapon: Weapon, room: Room) => void;
  onClose: () => void;
}

export default function AccusationModal({ onConfirm, onClose }: AccusationModalProps) {
  const [suspect, setSuspect] = useState<Suspect | "">("");
  const [weapon,  setWeapon]  = useState<Weapon  | "">("");
  const [room,    setRoom]    = useState<Room    | "">("");
  const [confirm, setConfirm] = useState(false);

  function handleSubmit() {
    if (!suspect || !weapon || !room) return;
    if (!confirm) { setConfirm(true); return; }
    onConfirm(suspect as Suspect, weapon as Weapon, room as Room);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal-panel border-crimson-700/40"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-crimson-400" />
              <h2 className="font-serif text-2xl font-bold text-manor-100">Final Accusation</h2>
            </div>
            <p className="text-crimson-400/70 text-xs italic">
              ⚠ A wrong accusation will eliminate you from the game
            </p>
          </div>
          <button onClick={onClose} className="text-obsidian-500 hover:text-manor-300 transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suspects */}
        <div className="mb-4">
          <h3 className="text-xs font-serif font-bold text-crimson-400/70 uppercase tracking-widest mb-2">Suspect</h3>
          <div className="grid grid-cols-3 gap-2">
            {SUSPECTS.map((s) => {
              const meta = CHARACTER_META[s];
              return (
                <button key={s} onClick={() => setSuspect(s)}
                  className={["game-card flex flex-col items-center gap-1 py-2.5", suspect === s ? "selected" : ""].join(" ")}>
                  <span className="text-xl">{meta.icon}</span>
                  <span className="font-serif text-[10px] font-bold text-manor-200 text-center leading-tight">{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weapons */}
        <div className="mb-4">
          <h3 className="text-xs font-serif font-bold text-crimson-400/70 uppercase tracking-widest mb-2">Weapon</h3>
          <div className="grid grid-cols-3 gap-2">
            {WEAPONS.map((w) => (
              <button key={w} onClick={() => setWeapon(w)}
                className={["game-card flex flex-col items-center gap-1 py-2.5", weapon === w ? "selected" : ""].join(" ")}>
                <span className="text-xl">{WEAPON_ICONS[w]}</span>
                <span className="font-serif text-[10px] font-bold text-manor-200 text-center leading-tight">{w}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rooms */}
        <div className="mb-5">
          <h3 className="text-xs font-serif font-bold text-crimson-400/70 uppercase tracking-widest mb-2">Room</h3>
          <div className="grid grid-cols-3 gap-2">
            {ROOMS.map((r) => (
              <button key={r} onClick={() => setRoom(r)}
                className={["game-card flex flex-col items-center gap-1 py-2.5", room === r ? "selected" : ""].join(" ")}>
                <span className="text-xl">{ROOM_ICONS[r]}</span>
                <span className="font-serif text-[10px] font-bold text-manor-200 text-center leading-tight">{r}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Confirmation warning */}
        {confirm && suspect && weapon && room && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 rounded-lg bg-crimson-950/40 border border-crimson-700/50 text-center"
          >
            <p className="text-crimson-300 font-serif font-bold mb-1">Are you absolutely certain?</p>
            <p className="text-crimson-400/70 text-xs italic">
              "{suspect} with the {weapon} in the {room}"
            </p>
          </motion.div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="manor-btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!suspect || !weapon || !room}
            className="manor-btn-danger flex-[2]"
          >
            {confirm ? "⚖️ CONFIRM ACCUSATION" : "⚖️ Accuse"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
