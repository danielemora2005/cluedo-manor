// ============================================================
// CLUEDO — Zustand Game Store
// Centralised client-side state. Syncs with Supabase on change.
// ============================================================

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type {
  GameState, Player, Card, Suspect, Weapon, Room,
  Notebook, NoteStatus,
} from "@/types/game";
import {
  initGame, movePlayer, makeSuggestion, disproveSuggestion,
  markSuggestionUndisproved, makeAccusation, skipSuggestion,
  endTurn, buildBlankNotebook, markOwnCards, findDisprover,
  getDisproveOptions,
} from "@/lib/gameEngine";
import { saveGame, createGame } from "@/lib/supabase";

// ── Store shape ───────────────────────────────────────────────

export interface GameStore {
  // ── Game state (synced to Supabase) ─────────────────────────
  gameState: GameState | null;

  // ── Local client identity ────────────────────────────────────
  playerId: string;
  playerName: string;
  notebook: Notebook;

  // ── UI flags ─────────────────────────────────────────────────
  isSyncing: boolean;
  error: string | null;

  // ── Setup actions ─────────────────────────────────────────────
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;

  // ── Game lifecycle ────────────────────────────────────────────
  createNewGame: (
    gameId: string,
    players: Omit<Player, "cards" | "currentRoom" | "isActive" | "hasWon">[]
  ) => Promise<void>;
  loadGame: (state: GameState) => void;
  setGameState: (state: GameState) => void;

  // ── Game actions (all persist to Supabase) ────────────────────
  move: (targetRoom: Room) => Promise<void>;
  suggest: (suspect: Suspect, weapon: Weapon) => Promise<void>;
  disprove: (card: Card) => Promise<void>;
  cannotDisprove: () => Promise<void>;
  accuse: (suspect: Suspect, weapon: Weapon, room: Room) => Promise<void>;
  skipSuggest: () => Promise<void>;
  finishTurn: () => Promise<void>;

  // ── Notebook ──────────────────────────────────────────────────
  updateNotebook: (card: Card, status: NoteStatus) => void;

  // ── Misc ──────────────────────────────────────────────────────
  clearError: () => void;
}

// ── Helpers ───────────────────────────────────────────────────

/** Persist state and handle errors */
async function persist(
  state: GameState,
  set: (fn: (s: GameStore) => Partial<GameStore>) => void
): Promise<void> {
  set((s) => ({ ...s, isSyncing: true, error: null }));
  try {
    await saveGame(state.id, state);
  } catch (err) {
    set((s) => ({
      ...s,
      isSyncing: false,
      error: (err as Error).message,
    }));
    return;
  }
  set((s) => ({ ...s, isSyncing: false }));
}

// ── Store ──────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  gameState:   null,
  playerId:    "",
  playerName:  "",
  notebook:    buildBlankNotebook(),
  isSyncing:   false,
  error:       null,

  setPlayerId:   (id)   => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),

  // ── Create / Load ─────────────────────────────────────────────

  async createNewGame(gameId, players) {
    const state = initGame(gameId, players, players[0].id);
    const me = players.find((p) => p.id === get().playerId);
    const fullMe = state.players.find((p) => p.id === get().playerId);

    // Build notebook with own cards marked
    let notebook = buildBlankNotebook();
    if (fullMe) notebook = markOwnCards(notebook, fullMe.cards);

    set({ gameState: state, notebook, isSyncing: true, error: null });
    try {
      await createGame(gameId, state);
    } catch (err) {
      set({ isSyncing: false, error: (err as Error).message });
      return;
    }
    set({ isSyncing: false });
  },

  loadGame(state) {
    const me = state.players.find((p) => p.id === get().playerId);
    let notebook = buildBlankNotebook();
    if (me) notebook = markOwnCards(notebook, me.cards);
    set({ gameState: state, notebook });
  },

  setGameState(state) {
    set({ gameState: state });
  },

  // ── Actions ───────────────────────────────────────────────────

  async move(targetRoom) {
    const { gameState, playerId } = get();
    if (!gameState) return;
    try {
      const next = movePlayer(gameState, playerId, targetRoom);
      set({ gameState: next });
      await persist(next, set);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async suggest(suspect, weapon) {
    const { gameState, playerId } = get();
    if (!gameState) return;
    try {
      const next = makeSuggestion(gameState, playerId, suspect, weapon);
      set({ gameState: next });
      await persist(next, set);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async disprove(card) {
    const { gameState, playerId } = get();
    if (!gameState) return;
    try {
      const next = disproveSuggestion(gameState, playerId, card);
      set({ gameState: next });
      await persist(next, set);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async cannotDisprove() {
    const { gameState } = get();
    if (!gameState) return;
    try {
      const next = markSuggestionUndisproved(gameState);
      set({ gameState: next });
      await persist(next, set);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async accuse(suspect, weapon, room) {
    const { gameState, playerId } = get();
    if (!gameState) return;
    try {
      const next = makeAccusation(gameState, playerId, suspect, weapon, room);
      set({ gameState: next });
      await persist(next, set);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async skipSuggest() {
    const { gameState, playerId } = get();
    if (!gameState) return;
    try {
      const next = skipSuggestion(gameState, playerId);
      set({ gameState: next });
      await persist(next, set);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async finishTurn() {
    const { gameState, playerId } = get();
    if (!gameState) return;
    try {
      const next = endTurn(gameState, playerId);
      set({ gameState: next });
      await persist(next, set);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  // ── Notebook ──────────────────────────────────────────────────

  updateNotebook(card, status) {
    set((s) => ({
      notebook: { ...s.notebook, [card]: status },
    }));
  },

  clearError: () => set({ error: null }),
}));

// ── Selector helpers ──────────────────────────────────────────

/** Is it currently this player's turn? */
export function selectIsMyTurn(store: GameStore): boolean {
  return store.gameState?.currentPlayerId === store.playerId;
}

/** Get the local player object */
export function selectMe(store: GameStore): Player | undefined {
  return store.gameState?.players.find((p) => p.id === store.playerId);
}

/** Get the latest pending suggestion */
export function selectPendingSuggestion(store: GameStore) {
  if (!store.gameState) return null;
  const s = [...store.gameState.suggestions]
    .reverse()
    .find((s) => !s.disproverId && !s.undisproved);
  return s ?? null;
}

/** Cards this player can show to disprove the latest suggestion */
export function selectDisproveOptions(store: GameStore): Card[] {
  const pending = selectPendingSuggestion(store);
  const me = selectMe(store);
  if (!pending || !me) return [];
  return getDisproveOptions(me, pending.suspect, pending.weapon, pending.room);
}
