// ============================================================
// CLUEDO — API Route: POST /api/game/create
// Creates a new game row in Supabase and returns the game id.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initGame } from "@/lib/gameEngine";
import { generateRoomCode } from "@/lib/utils";
import type { Player } from "@/types/game";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  const body = await req.json() as {
    gameId?: string;
    hostId: string;
    players: Omit<Player, "cards" | "currentRoom" | "isActive" | "hasWon">[];
  };

  const gameId = body.gameId ?? generateRoomCode();

  let state;
  try {
    state = initGame(gameId, body.players, body.hostId);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }

  const { error } = await supabase.from("games").insert({
    id: gameId,
    state,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gameId, state }, { status: 201 });
}
