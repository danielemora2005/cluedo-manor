// ============================================================
// CLUEDO — Supabase Client
// Single instance of the Supabase client for the browser.
// Realtime subscriptions are set up in useRealtime hook.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { GameState } from "@/types/game";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Singleton client — safe to import from any client component
export const supabase = createClient(supabaseUrl, supabaseAnon, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ── Database helpers ─────────────────────────────────────────

/** Fetch a game by id */
export async function fetchGame(gameId: string): Promise<GameState | null> {
  const { data, error } = await supabase
    .from("games")
    .select("state")
    .eq("id", gameId)
    .single();

  if (error || !data) return null;
  return data.state as GameState;
}

/** Persist the full game state */
export async function saveGame(gameId: string, state: GameState): Promise<void> {
  const { error } = await supabase
    .from("games")
    .upsert({ id: gameId, state, updated_at: new Date().toISOString() });

  if (error) throw new Error(`Failed to save game: ${error.message}`);
}

/** Create a brand-new game row */
export async function createGame(gameId: string, state: GameState): Promise<void> {
  const { error } = await supabase.from("games").insert({
    id: gameId,
    state,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to create game: ${error.message}`);
}

/** Subscribe to realtime changes for a game room */
export function subscribeToGame(
  gameId: string,
  onUpdate: (state: GameState) => void
) {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      },
      (payload) => {
        const newState = (payload.new as { state: GameState }).state;
        onUpdate(newState);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** List available (lobby) games to join */
export async function listOpenGames(): Promise<
  { id: string; playerCount: number; status: string }[]
> {
  const { data, error } = await supabase
    .from("games")
    .select("id, state")
    .eq("state->status", "lobby")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    playerCount: (row.state as GameState).players.length,
    status: (row.state as GameState).status,
  }));
}
