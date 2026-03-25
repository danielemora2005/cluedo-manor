// ============================================================
// CLUEDO — Game Engine
// Pure functions for all game-rule logic.
// No side effects, no UI concerns — just rules.
// ============================================================

import { v4 as uuid } from "uuid";
import type {
  GameState, Player, Card, Suspect, Weapon, Room,
  Solution, Suggestion, Accusation, GameLogEntry,
  TurnPhase, Notebook, NoteStatus,
} from "@/types/game";
import {
  SUSPECTS, WEAPONS, ROOMS, CHARACTER_START,
} from "@/types/game";
import { canMoveTo } from "@/lib/board";

// ── Helpers ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function log(
  message: string,
  type: GameLogEntry["type"] = "system"
): GameLogEntry {
  return { id: uuid(), message, timestamp: Date.now(), type };
}

// ── Game Initialization ───────────────────────────────────────

/**
 * Build the initial GameState for a new game.
 * @param gameId  – unique room/game id
 * @param players – array of players (already have name + character)
 * @param hostId  – id of the player who created the room
 */
export function initGame(
  gameId: string,
  players: Omit<Player, "cards" | "currentRoom" | "isActive" | "hasWon">[],
  hostId: string
): GameState {
  if (players.length < 2 || players.length > 6) {
    throw new Error("Cluedo requires 2–6 players.");
  }

  // 1. Draw the solution (one of each category)
  const solution: Solution = {
    suspect: SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)],
    weapon:  WEAPONS [Math.floor(Math.random() * WEAPONS .length)],
    room:    ROOMS   [Math.floor(Math.random() * ROOMS   .length)],
  };

  // 2. Build the remaining deck (everything except the solution)
  const deck: Card[] = shuffle([
    ...SUSPECTS.filter((s) => s !== solution.suspect),
    ...WEAPONS .filter((w) => w !== solution.weapon),
    ...ROOMS   .filter((r) => r !== solution.room),
  ]);

  // 3. Deal cards round-robin
  const hands: Card[][] = players.map(() => []);
  deck.forEach((card, i) => hands[i % players.length].push(card));

  // 4. Place players in their starting rooms
  const fullPlayers: Player[] = players.map((p, i) => ({
    ...p,
    cards: hands[i],
    currentRoom: CHARACTER_START[p.character],
    isActive: true,
    hasWon: false,
  }));

  // 5. Randomise turn order; Miss Scarlett traditionally goes first
  const scarlett = fullPlayers.find((p) => p.character === "Miss Scarlett");
  const others   = fullPlayers.filter((p) => p.character !== "Miss Scarlett");
  const turnOrder = scarlett ? [scarlett, ...shuffle(others)] : shuffle(fullPlayers);

  return {
    id: gameId,
    status: "playing",
    hostId,
    players: turnOrder,
    currentPlayerId: turnOrder[0].id,
    currentTurnIndex: 0,
    turnPhase: "move",
    solution,
    suggestions: [],
    accusations: [],
    log: [log(`Game started! It is ${turnOrder[0].name}'s turn.`, "system")],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Turn helpers ─────────────────────────────────────────────

/** Returns the Player object for the current turn */
export function currentPlayer(state: GameState): Player {
  return state.players[state.currentTurnIndex];
}

/** Advance to the next active player's turn */
export function nextTurn(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => p.isActive);
  if (activePlayers.length === 0) return state;

  let nextIndex = (state.currentTurnIndex + 1) % state.players.length;
  // skip eliminated players
  while (!state.players[nextIndex].isActive) {
    nextIndex = (nextIndex + 1) % state.players.length;
  }

  const next = state.players[nextIndex];
  return {
    ...state,
    currentPlayerId: next.id,
    currentTurnIndex: nextIndex,
    turnPhase: "move",
    updatedAt: Date.now(),
    log: [...state.log, log(`It is ${next.name}'s turn.`, "system")],
  };
}

// ── Move ─────────────────────────────────────────────────────

export function movePlayer(
  state: GameState,
  playerId: string,
  targetRoom: Room
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found.");
  if (state.currentPlayerId !== playerId) throw new Error("Not your turn.");
  if (state.turnPhase !== "move") throw new Error("Not in move phase.");

  if (!canMoveTo(player.currentRoom, targetRoom)) {
    throw new Error(`Cannot move from ${player.currentRoom} to ${targetRoom}.`);
  }

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, currentRoom: targetRoom } : p
  );

  return {
    ...state,
    players: updatedPlayers,
    turnPhase: "suggest",   // after moving they can suggest
    updatedAt: Date.now(),
    log: [
      ...state.log,
      log(`${player.name} moved to the ${targetRoom}.`, "move"),
    ],
  };
}

// ── Suggestion ───────────────────────────────────────────────

export function makeSuggestion(
  state: GameState,
  playerId: string,
  suspect: Suspect,
  weapon: Weapon
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found.");
  if (state.currentPlayerId !== playerId) throw new Error("Not your turn.");
  if (state.turnPhase !== "suggest") throw new Error("Not in suggest phase.");

  const room = player.currentRoom; // suggestion room = current room

  const suggestion: Suggestion = {
    id: uuid(),
    playerId,
    suspect,
    weapon,
    room,
    undisproved: false,
    timestamp: Date.now(),
  };

  // Move the suggested suspect to this room
  const movedSuspectPlayer = state.players.find(
    (p) => p.character === suspect && p.id !== playerId
  );
  let updatedPlayers = state.players.map((p) =>
    p.character === suspect && p.id !== playerId
      ? { ...p, currentRoom: room }
      : p
  );

  const logEntry = log(
    `${player.name} suggests: ${suspect} with the ${weapon} in the ${room}.`,
    "suggest"
  );

  return {
    ...state,
    players: updatedPlayers,
    turnPhase: "disprove",
    suggestions: [...state.suggestions, suggestion],
    updatedAt: Date.now(),
    log: [
      ...state.log,
      logEntry,
      ...(movedSuspectPlayer
        ? [log(`${suspect} was moved to the ${room}.`, "system")]
        : []),
    ],
  };
}

/**
 * A player disproves a suggestion by showing a card.
 * Only the suggesting player sees which card; others see "disproved".
 */
export function disproveSuggestion(
  state: GameState,
  disproverId: string,
  card: Card
): GameState {
  const latest = [...state.suggestions].reverse().find(
    (s) => !s.disproverId && !s.undisproved
  );
  if (!latest) throw new Error("No pending suggestion.");

  const disprover = state.players.find((p) => p.id === disproverId);
  if (!disprover) throw new Error("Disprover not found.");

  // Verify they actually hold this card
  if (!disprover.cards.includes(card)) {
    throw new Error("You do not hold that card.");
  }

  const updatedSuggestions = state.suggestions.map((s) =>
    s.id === latest.id
      ? { ...s, disproverId, disproveCard: card, undisproved: false }
      : s
  );

  const suggester = state.players.find((p) => p.id === latest.playerId);

  return {
    ...state,
    suggestions: updatedSuggestions,
    turnPhase: "end_turn",
    updatedAt: Date.now(),
    log: [
      ...state.log,
      log(
        `${disprover.name} showed a card to ${suggester?.name ?? "the suggester"}.`,
        "disprove"
      ),
    ],
  };
}

/**
 * Nobody could disprove the suggestion.
 */
export function markSuggestionUndisproved(state: GameState): GameState {
  const latest = [...state.suggestions].reverse().find(
    (s) => !s.disproverId && !s.undisproved
  );
  if (!latest) throw new Error("No pending suggestion.");

  const updatedSuggestions = state.suggestions.map((s) =>
    s.id === latest.id ? { ...s, undisproved: true } : s
  );

  return {
    ...state,
    suggestions: updatedSuggestions,
    turnPhase: "end_turn",
    updatedAt: Date.now(),
    log: [
      ...state.log,
      log("No one could disprove the suggestion!", "disprove"),
    ],
  };
}

// ── Accusation ───────────────────────────────────────────────

export function makeAccusation(
  state: GameState,
  playerId: string,
  suspect: Suspect,
  weapon: Weapon,
  room: Room
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found.");

  const correct =
    suspect === state.solution.suspect &&
    weapon  === state.solution.weapon  &&
    room    === state.solution.room;

  const accusation: Accusation = {
    id: uuid(),
    playerId,
    suspect,
    weapon,
    room,
    correct,
    timestamp: Date.now(),
  };

  let updatedPlayers = state.players;
  let newStatus = state.status;
  let winner: string | undefined = state.winner;
  const newLogs: GameLogEntry[] = [
    log(
      `${player.name} accuses: ${suspect} with the ${weapon} in the ${room}!`,
      "accuse"
    ),
  ];

  if (correct) {
    // ✅ Winner!
    updatedPlayers = state.players.map((p) =>
      p.id === playerId ? { ...p, hasWon: true } : p
    );
    newStatus = "ended";
    winner = playerId;
    newLogs.push(
      log(
        `🎉 ${player.name} solved the mystery! The answer was ${suspect} with the ${weapon} in the ${room}.`,
        "win"
      )
    );
  } else {
    // ❌ Wrong — player is eliminated
    updatedPlayers = state.players.map((p) =>
      p.id === playerId ? { ...p, isActive: false } : p
    );
    newLogs.push(
      log(
        `${player.name}'s accusation was WRONG and they are eliminated from making further accusations!`,
        "system"
      )
    );

    // If only one active player remains and they haven't accused, they win by default
    const remaining = updatedPlayers.filter((p) => p.isActive);
    if (remaining.length === 1) {
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === remaining[0].id ? { ...p, hasWon: true } : p
      );
      newStatus = "ended";
      winner = remaining[0].id;
      newLogs.push(log(`${remaining[0].name} wins by default!`, "win"));
    } else if (remaining.length === 0) {
      newStatus = "ended";
      newLogs.push(log("All players have been eliminated. Nobody wins.", "win"));
    }
  }

  const newState: GameState = {
    ...state,
    players: updatedPlayers,
    status: newStatus,
    winner,
    accusations: [...state.accusations, accusation],
    updatedAt: Date.now(),
    log: [...state.log, ...newLogs],
  };

  // If game still going and player was eliminated, move to next turn
  if (!correct && newStatus === "playing") {
    return nextTurn(newState);
  }
  return newState;
}

// ── Skipping phases ───────────────────────────────────────────

/** Player chooses not to make a suggestion (skip to end turn) */
export function skipSuggestion(state: GameState, playerId: string): GameState {
  if (state.currentPlayerId !== playerId) throw new Error("Not your turn.");
  if (state.turnPhase !== "suggest") throw new Error("Not in suggest phase.");

  const player = state.players.find((p) => p.id === playerId)!;
  return {
    ...state,
    turnPhase: "end_turn",
    updatedAt: Date.now(),
    log: [...state.log, log(`${player.name} chose not to make a suggestion.`, "system")],
  };
}

/** End the current player's turn and advance */
export function endTurn(state: GameState, playerId: string): GameState {
  if (state.currentPlayerId !== playerId) throw new Error("Not your turn.");
  return nextTurn(state);
}

// ── AI Logic ──────────────────────────────────────────────────

/**
 * Very simple AI: moves to the room with the most unknown cards and
 * suggests a random suspect/weapon it hasn't ruled out yet.
 */
export function computeAITurn(
  state: GameState,
  aiPlayerId: string
): Partial<{
  move: Room;
  suggestion: { suspect: Suspect; weapon: Weapon };
}> {
  const ai = state.players.find((p) => p.id === aiPlayerId);
  if (!ai) return {};

  // Pick a random adjacent room
  const { canMoveTo: _canMove, ROOM_MAP } =
    require("@/lib/board") as typeof import("@/lib/board");
  const { getReachableRooms } = require("@/lib/board") as typeof import("@/lib/board");

  const reachable = getReachableRooms(ai.currentRoom);
  const move = reachable[Math.floor(Math.random() * reachable.length)] as Room;

  // Random suspect/weapon the AI hasn't proven innocent
  const knownInnocent: Card[] = ai.cards; // AI knows its own cards
  const unknownSuspects = SUSPECTS.filter((s) => !knownInnocent.includes(s));
  const unknownWeapons  = WEAPONS .filter((w) => !knownInnocent.includes(w));

  const suspect =
    unknownSuspects[Math.floor(Math.random() * unknownSuspects.length)] ??
    SUSPECTS[0];
  const weapon =
    unknownWeapons[Math.floor(Math.random() * unknownWeapons.length)] ??
    WEAPONS[0];

  return { move, suggestion: { suspect, weapon } };
}

// ── Notebook helpers ──────────────────────────────────────────

/** Build a blank notebook (all cards unknown) */
export function buildBlankNotebook(): Notebook {
  const entries: Partial<Notebook> = {};
  [...SUSPECTS, ...WEAPONS, ...ROOMS].forEach((card) => {
    entries[card] = "unknown";
  });
  return entries as Notebook;
}

/**
 * Update notebook based on a disprove event:
 * if we're the suggester, we know which card was shown.
 */
export function updateNotebookFromDisprove(
  notebook: Notebook,
  card: Card
): Notebook {
  return { ...notebook, [card]: "innocent" as NoteStatus };
}

/** Mark all own cards in the notebook as "mine" */
export function markOwnCards(notebook: Notebook, cards: Card[]): Notebook {
  const updated = { ...notebook };
  cards.forEach((c) => { updated[c] = "mine"; });
  return updated;
}

/**
 * Find the player after `fromId` in the turn order who might be able to disprove.
 * Returns the first one whose cards contain any of suspect/weapon/room.
 */
export function findDisprover(
  state: GameState,
  fromPlayerId: string,
  suspect: Suspect,
  weapon: Weapon,
  room: Room
): Player | undefined {
  const fromIndex = state.players.findIndex((p) => p.id === fromPlayerId);
  const n = state.players.length;
  for (let offset = 1; offset < n; offset++) {
    const idx = (fromIndex + offset) % n;
    const p = state.players[idx];
    if (!p.isActive) continue;
    if (
      p.cards.includes(suspect) ||
      p.cards.includes(weapon) ||
      p.cards.includes(room)
    ) {
      return p;
    }
  }
  return undefined;
}

/**
 * Get all cards a player CAN show for a suggestion.
 */
export function getDisproveOptions(
  player: Player,
  suspect: Suspect,
  weapon: Weapon,
  room: Room
): Card[] {
  return player.cards.filter(
    (c) => c === suspect || c === weapon || c === room
  );
}
