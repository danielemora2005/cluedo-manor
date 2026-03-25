// ============================================================
// CLUEDO — Game Action API
// POST /api/game/action → apply a game action server-side
// Useful for server-authoritative validation
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  movePlayer, makeSuggestion, disproveSuggestion,
  markSuggestionUndisproved, makeAccusation,
  skipSuggestion, endTurn,
} from "@/lib/gameEngine";
import type { GameState, Room, Suspect, Weapon, Card } from "@/types/game";

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

type ActionPayload =
  | { type: "move";       playerId: string; room: Room }
  | { type: "suggest";    playerId: string; suspect: Suspect; weapon: Weapon }
  | { type: "disprove";   playerId: string; card: Card }
  | { type: "undisproved" }
  | { type: "accuse";     playerId: string; suspect: Suspect; weapon: Weapon; room: Room }
  | { type: "skip_suggest"; playerId: string }
  | { type: "end_turn";   playerId: string };

export async function POST(req: NextRequest) {
  try {
    const { gameId, action } = await req.json() as {
      gameId: string;
      action: ActionPayload;
    };

    if (!gameId || !action) {
      return NextResponse.json({ error: "Missing gameId or action" }, { status: 400 });
    }

    const supabase = getServerClient();

    // Fetch current state
    const { data, error: fetchError } = await supabase
      .from("games")
      .select("state")
      .eq("id", gameId)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    let state: GameState = data.state;

    // Apply action
    switch (action.type) {
      case "move":
        state = movePlayer(state, action.playerId, action.room);
        break;
      case "suggest":
        state = makeSuggestion(state, action.playerId, action.suspect, action.weapon);
        break;
      case "disprove":
        state = disproveSuggestion(state, action.playerId, action.card);
        break;
      case "undisproved":
        state = markSuggestionUndisproved(state);
        break;
      case "accuse":
        state = makeAccusation(state, action.playerId, action.suspect, action.weapon, action.room);
        break;
      case "skip_suggest":
        state = skipSuggestion(state, action.playerId);
        break;
      case "end_turn":
        state = endTurn(state, action.playerId);
        break;
      default:
        return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
    }

    // Persist updated state
    const { error: saveError } = await supabase
      .from("games")
      .update({ state, updated_at: new Date().toISOString() })
      .eq("id", gameId);

    if (saveError) throw new Error(saveError.message);

    return NextResponse.json({ ok: true, state });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
