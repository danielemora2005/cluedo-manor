// ============================================================
// CLUEDO — API Route: /api/game/[gameId]
// GET  → fetch game state
// POST → apply a game action and save
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  movePlayer, makeSuggestion, disproveSuggestion,
  markSuggestionUndisproved, makeAccusation,
  skipSuggestion, endTurn, initGame,
} from "@/lib/gameEngine";
import type { GameState } from "@/types/game";

// Server-side Supabase client (uses service role for writes)
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ── GET ───────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("games")
    .select("state")
    .eq("id", params.gameId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  return NextResponse.json({ state: data.state });
}

// ── POST ──────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const supabase = getServerSupabase();
  const body     = await req.json() as {
    action: string;
    playerId: string;
    payload?: Record<string, any>;
  };

  // Fetch current state
  const { data, error: fetchErr } = await supabase
    .from("games")
    .select("state")
    .eq("id", params.gameId)
    .single();

  if (fetchErr || !data) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  let state: GameState = data.state;

  // Apply action
  try {
    switch (body.action) {
      case "move":
        state = movePlayer(state, body.playerId, body.payload?.room);
        break;
      case "suggest":
        state = makeSuggestion(state, body.playerId, body.payload?.suspect, body.payload?.weapon);
        break;
      case "disprove":
        state = disproveSuggestion(state, body.playerId, body.payload?.card);
        break;
      case "cannot_disprove":
        state = markSuggestionUndisproved(state);
        break;
      case "accuse":
        state = makeAccusation(state, body.playerId, body.payload?.suspect, body.payload?.weapon, body.payload?.room);
        break;
      case "skip_suggest":
        state = skipSuggestion(state, body.playerId);
        break;
      case "end_turn":
        state = endTurn(state, body.playerId);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }

  // Persist updated state
  const { error: saveErr } = await supabase
    .from("games")
    .update({ state, updated_at: new Date().toISOString() })
    .eq("id", params.gameId);

  if (saveErr) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ state });
}
