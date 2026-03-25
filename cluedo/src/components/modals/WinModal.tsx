"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw } from "lucide-react";
import { CHARACTER_META, WEAPON_ICONS, ROOM_ICONS } from "@/types/game";
import type { GameState } from "@/types/game";

interface WinModalProps {
  gameState: GameState;
  playerId: string;
  onPlayAgain: () => void;
}

export default function WinModal({ gameState, playerId, onPlayAgain }: WinModalProps) {
  const winner    = gameState.winner ? gameState.players.find((p) => p.id === gameState.winner) : null;
  const isWinner  = gameState.winner === playerId;
  const solution  = gameState.solution;
  const meta      = winner ? CHARACTER_META[winner.character] : null;

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="modal-panel text-center max-w-md"
        style={{ borderColor: isWinner ? "rgba(245,158,11,0.5)" : "rgba(220,38,38,0.3)" }}
      >
        {/* Trophy / Skull */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-6xl mb-4"
        >
          {winner ? (isWinner ? "🏆" : "💀") : "🎭"}
        </motion.div>

        {/* Headline */}
        <h2 className="font-serif text-3xl font-black text-manor-100 mb-2">
          {isWinner ? "You Solved It!" : winner ? `${winner.name} Wins!` : "Game Over"}
        </h2>

        {winner && meta && (
          <p className="text-obsidian-400 text-sm mb-5 italic">
            {winner.character} cracked the case at Blackwood Manor
          </p>
        )}

        {/* Solution reveal */}
        <div className="bg-obsidian-800/60 border border-manor-600/20 rounded-xl p-5 mb-6">
          <p className="text-gold-400/70 text-xs uppercase tracking-widest font-serif font-bold mb-4">
            The Solution Was
          </p>
          <div className="flex justify-around gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">{CHARACTER_META[solution.suspect].icon}</span>
              <span className="text-[10px] text-obsidian-500 uppercase tracking-wider">Suspect</span>
              <span className="font-serif font-bold text-manor-200 text-sm text-center">{solution.suspect}</span>
            </div>
            <div className="text-obsidian-600 self-center font-serif text-lg">+</div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">{WEAPON_ICONS[solution.weapon]}</span>
              <span className="text-[10px] text-obsidian-500 uppercase tracking-wider">Weapon</span>
              <span className="font-serif font-bold text-manor-200 text-sm text-center">{solution.weapon}</span>
            </div>
            <div className="text-obsidian-600 self-center font-serif text-lg">+</div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">{ROOM_ICONS[solution.room]}</span>
              <span className="text-[10px] text-obsidian-500 uppercase tracking-wider">Room</span>
              <span className="font-serif font-bold text-manor-200 text-sm text-center">{solution.room}</span>
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="mb-6 text-left">
          <p className="text-obsidian-500 text-xs uppercase tracking-widest font-serif mb-2">Players</p>
          <div className="space-y-1.5">
            {gameState.players.map((p) => {
              const pm = CHARACTER_META[p.character];
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span>{pm.icon}</span>
                  <span className={p.hasWon ? "text-gold-400 font-bold font-serif" : p.isActive ? "text-manor-300" : "text-obsidian-600 line-through"}>
                    {p.name}
                  </span>
                  {p.hasWon    && <span className="ml-auto text-gold-400 text-xs">🏆 Winner</span>}
                  {!p.isActive && !p.hasWon && <span className="ml-auto text-crimson-500 text-xs">Eliminated</span>}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={onPlayAgain} className="manor-btn-primary w-full py-3">
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
      </motion.div>
    </div>
  );
}
