"use client";

import { CHARACTER_META } from "@/types/game";
import type { GameState } from "@/types/game";

interface PlayerListProps {
  gameState: GameState;
  currentPlayerId: string;
}

export default function PlayerList({ gameState, currentPlayerId }: PlayerListProps) {
  return (
    <div>
      <h3 className="section-title text-xs mb-3">Players</h3>
      <div className="space-y-2">
        {gameState.players.map((player) => {
          const meta       = CHARACTER_META[player.character];
          const isCurrent  = player.id === gameState.currentPlayerId;
          const isMe       = player.id === currentPlayerId;
          const eliminated = !player.isActive;
          const won        = player.hasWon;

          return (
            <div
              key={player.id}
              className={[
                "p-2.5 rounded-lg border transition-all duration-200",
                isCurrent  ? "border-gold-500/50 bg-gold-500/5"   : "",
                eliminated ? "border-obsidian-700/30 opacity-50"  : "border-obsidian-700/30",
                won        ? "border-gold-400/60 bg-gold-400/5"   : "",
                !isCurrent && !eliminated && !won ? "bg-obsidian-900/40" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2"
                    style={{
                      backgroundColor: meta.color + "33",
                      borderColor: eliminated ? "#374151" : meta.color,
                    }}
                  >
                    {won ? "👑" : eliminated ? "💀" : meta.icon}
                  </div>
                  {isCurrent && !eliminated && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={[
                      "font-serif font-bold text-xs leading-none truncate",
                      eliminated ? "text-obsidian-600 line-through" : "text-manor-200",
                    ].join(" ")}>
                      {player.name}
                    </span>
                    {isMe && (
                      <span className="text-[9px] bg-gold-600/20 text-gold-400 px-1 rounded leading-none py-0.5">You</span>
                    )}
                  </div>
                  <span className="text-[10px] text-obsidian-500 truncate block mt-0.5">
                    {player.character}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 text-[10px] text-obsidian-500 truncate">
                📍 {player.currentRoom}
              </div>
              {isMe && (
                <div className="mt-1 text-[10px] text-obsidian-600">
                  🃏 {player.cards.length} cards
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
