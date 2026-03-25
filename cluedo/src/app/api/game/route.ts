// ============================================================
// CLUEDO — Game API Routes
// POST /api/game  → create a new game
// GET  /api/game?id=XXXX → fetch game state
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initGame } from "@/lib/gameEngine";
import { v4 as uuid } from "uuid";
import type { Player } from "@/types/game";

// Server-side Supabase client (uses service role for writes)
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

// GET /api/game?id=GAME_ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("id");

  if (!gameId) {
    return NextResponse.json({ error: "Missing game id" }, { status: 400 });
  }

  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("games")
      .select("state")
      .eq("id", gameId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ state: data.state });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/game  → { gameId, players, hostId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, players, hostId } = body as {
      gameId: string;
      players: Omit<Player, "cards" | "currentRoom" | "isActive" | "hasWon">[];
      hostId: string;
    };

    if (!gameId || !players || !hostId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (players.length < 2 || players.length > 6) {
      return NextResponse.json({ error: "Requires 2–6 players" }, { status: 400 });
    }

    const state = initGame(gameId, players, hostId);
    const supabase = getServerClient();

    const { error } = await supabase.from("games").upsert({
      id: gameId,
      state,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, gameId, status: state.status });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
