// ============================================================
// CLUEDO — Core Type Definitions
// All game entities, state shapes, and event payloads live here.
// ============================================================

// ── Cards ────────────────────────────────────────────────────
export const SUSPECTS = [
  "Miss Scarlett",
  "Colonel Mustard",
  "Mrs. White",
  "Reverend Green",
  "Mrs. Peacock",
  "Professor Plum",
] as const;

export const WEAPONS = [
  "Candlestick",
  "Knife",
  "Lead Pipe",
  "Revolver",
  "Rope",
  "Wrench",
] as const;

export const ROOMS = [
  "Kitchen",
  "Ballroom",
  "Conservatory",
  "Billiard Room",
  "Library",
  "Study",
  "Hall",
  "Lounge",
  "Dining Room",
] as const;

export type Suspect = (typeof SUSPECTS)[number];
export type Weapon  = (typeof WEAPONS)[number];
export type Room    = (typeof ROOMS)[number];
export type Card    = Suspect | Weapon | Room;
export type CardType = "suspect" | "weapon" | "room";

// ── Board ────────────────────────────────────────────────────
export interface RoomNode {
  id: Room;
  label: string;
  shortLabel: string;
  /** column in the 3x3 grid (0-2) */
  col: number;
  /** row in the 3x3 grid (0-2) */
  row: number;
  /** rooms directly accessible */
  adjacent: Room[];
  /** secret passage destination, if any */
  secretPassage?: Room;
  /** Tailwind color class for the room tile */
  colorClass: string;
  /** emoji icon */
  icon: string;
}

// Starting positions for each character
export const CHARACTER_START: Record<Suspect, Room> = {
  "Miss Scarlett":   "Hall",
  "Colonel Mustard": "Lounge",
  "Mrs. White":      "Ballroom",
  "Reverend Green":  "Conservatory",
  "Mrs. Peacock":    "Library",
  "Professor Plum":  "Study",
};

// ── Player ───────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  character: Suspect;
  /** Cards dealt to this player — hidden from others */
  cards: Card[];
  currentRoom: Room;
  isAI: boolean;
  /** false = has been eliminated by wrong accusation */
  isActive: boolean;
  hasWon: boolean;
}

// ── Suggestion / Accusation ──────────────────────────────────
export interface Suggestion {
  id: string;
  playerId: string;
  suspect: Suspect;
  weapon: Weapon;
  room: Room;
  /** id of the player who disproved it */
  disproverId?: string;
  /** card shown (visible only to suggester) */
  disproveCard?: Card;
  /** nobody could disprove */
  undisproved: boolean;
  timestamp: number;
}

export interface Accusation {
  id: string;
  playerId: string;
  suspect: Suspect;
  weapon: Weapon;
  room: Room;
  correct: boolean;
  timestamp: number;
}

// ── Game Log ─────────────────────────────────────────────────
export type LogType = "move" | "suggest" | "disprove" | "accuse" | "system" | "win";

export interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: LogType;
}

// ── Game Solution (secret) ───────────────────────────────────
export interface Solution {
  suspect: Suspect;
  weapon: Weapon;
  room: Room;
}

// ── Turn phases ──────────────────────────────────────────────
export type TurnPhase =
  | "move"       // current player must move
  | "suggest"    // current player can suggest (if in a room)
  | "disprove"   // waiting for a player to disprove a suggestion
  | "accuse"     // current player can make final accusation
  | "end_turn";  // turn cleanup before advancing

// ── Full Game State ──────────────────────────────────────────
export interface GameState {
  id: string;
  status: "lobby" | "playing" | "ended";
  hostId: string;
  players: Player[];
  currentPlayerId: string;
  turnPhase: TurnPhase;
  /** Index of the player whose turn it is */
  currentTurnIndex: number;
  solution: Solution;
  suggestions: Suggestion[];
  accusations: Accusation[];
  log: GameLogEntry[];
  winner?: string;
  createdAt: number;
  updatedAt: number;
}

// ── Notebook entry for each player ───────────────────────────
export type NoteStatus = "unknown" | "innocent" | "guilty" | "mine";

export interface NotebookEntry {
  card: Card;
  status: NoteStatus;
}

export type Notebook = Record<Card, NoteStatus>;

// ── UI / Client-side state ───────────────────────────────────
export interface ClientState {
  playerId: string;
  playerName: string;
  notebook: Notebook;
}

// ── Supabase row shapes ───────────────────────────────────────
export interface GameRow {
  id: string;
  state: GameState;       // stored as JSONB
  created_at: string;
  updated_at: string;
}

// ── Character metadata for UI ─────────────────────────────────
export interface CharacterMeta {
  name: Suspect;
  color: string;       // CSS hex
  textColor: string;
  icon: string;        // emoji
  description: string;
}

export const CHARACTER_META: Record<Suspect, CharacterMeta> = {
  "Miss Scarlett": {
    name: "Miss Scarlett",
    color: "#dc2626",
    textColor: "#fff",
    icon: "🔴",
    description: "Bold, cunning, and always the prime suspect.",
  },
  "Colonel Mustard": {
    name: "Colonel Mustard",
    color: "#d97706",
    textColor: "#fff",
    icon: "🟡",
    description: "Distinguished military man with a fiery temper.",
  },
  "Mrs. White": {
    name: "Mrs. White",
    color: "#e5e7eb",
    textColor: "#111",
    icon: "⚪",
    description: "The housekeeper who knows every secret.",
  },
  "Reverend Green": {
    name: "Reverend Green",
    color: "#16a34a",
    textColor: "#fff",
    icon: "🟢",
    description: "Pious on the surface, ruthless beneath.",
  },
  "Mrs. Peacock": {
    name: "Mrs. Peacock",
    color: "#1d4ed8",
    textColor: "#fff",
    icon: "🔵",
    description: "Aristocratic and ice-cold in a crisis.",
  },
  "Professor Plum": {
    name: "Professor Plum",
    color: "#7c3aed",
    textColor: "#fff",
    icon: "🟣",
    description: "Brilliant academic with a dark past.",
  },
};

export const WEAPON_ICONS: Record<Weapon, string> = {
  Candlestick: "🕯️",
  Knife:       "🔪",
  "Lead Pipe": "🔧",
  Revolver:    "🔫",
  Rope:        "🪢",
  Wrench:      "🔩",
};

export const ROOM_ICONS: Record<Room, string> = {
  Kitchen:       "🍳",
  Ballroom:      "🎭",
  Conservatory:  "🌿",
  "Billiard Room": "🎱",
  Library:       "📚",
  Study:         "🕯️",
  Hall:          "🚪",
  Lounge:        "🛋️",
  "Dining Room": "🍽️",
};
