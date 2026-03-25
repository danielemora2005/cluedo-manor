// ============================================================
// CLUEDO — useRealtime hook
// Subscribes to Supabase realtime updates for the game room.
// ============================================================

"use client";

import { useEffect } from "react";
import { subscribeToGame } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import type { GameState } from "@/types/game";

/**
 * Subscribe to realtime game updates from Supabase.
 * When another player makes a move, their update is broadcast
 * via Postgres CDC and we update the local store.
 */
export function useRealtime(gameId: string | null) {
  const setGameState = useGameStore((s) => s.setGameState);
  const playerId     = useGameStore((s) => s.playerId);

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = subscribeToGame(gameId, (newState: GameState) => {
      // Update local state — but preserve the local player's notebook
      setGameState(newState);
    });

    return unsubscribe;
  }, [gameId, setGameState]);
}
