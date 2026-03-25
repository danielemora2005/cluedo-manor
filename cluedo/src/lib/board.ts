// ============================================================
// CLUEDO — Board Layout
// Defines the 3×3 grid of rooms, adjacency graph, and secret
// passages following the classic Cluedo board rules.
// ============================================================

import type { Room, RoomNode } from "@/types/game";

/**
 * Classic Cluedo 3×3 room layout:
 *
 *  [Kitchen]       [Ballroom]    [Conservatory]
 *  [Dining Room]   [  CENTER ]   [Billiard Room]
 *  [Lounge]        [Hall]        [Library]
 *
 * Secret passages:
 *  Kitchen  ↔ Study      (diagonally opposite, but Study replaces Lounge below)
 *  Actually classic: Study ↔ Kitchen  and  Lounge ↔ Conservatory
 *  We place Study in the bottom-left corner position.
 *
 * Adjusted layout:
 *  row 0: Kitchen     | Ballroom      | Conservatory
 *  row 1: Dining Room | [center-void] | Billiard Room
 *  row 2: Study       | Hall          | Library / Lounge
 *
 * For simplicity we use all 9 rooms in the grid.
 */

export const BOARD_ROOMS: RoomNode[] = [
  // Row 0
  {
    id: "Kitchen",
    label: "Kitchen",
    shortLabel: "Kitchen",
    col: 0, row: 0,
    adjacent: ["Ballroom", "Dining Room"],
    secretPassage: "Study",
    colorClass: "bg-amber-900/60",
    icon: "🍳",
  },
  {
    id: "Ballroom",
    label: "Ballroom",
    shortLabel: "Ballroom",
    col: 1, row: 0,
    adjacent: ["Kitchen", "Conservatory", "Hall"],
    colorClass: "bg-purple-900/60",
    icon: "🎭",
  },
  {
    id: "Conservatory",
    label: "Conservatory",
    shortLabel: "Conserv.",
    col: 2, row: 0,
    adjacent: ["Ballroom", "Billiard Room"],
    secretPassage: "Lounge",
    colorClass: "bg-green-900/60",
    icon: "🌿",
  },
  // Row 1
  {
    id: "Dining Room",
    label: "Dining Room",
    shortLabel: "Dining",
    col: 0, row: 1,
    adjacent: ["Kitchen", "Lounge", "Hall"],
    colorClass: "bg-red-900/60",
    icon: "🍽️",
  },
  {
    id: "Billiard Room",
    label: "Billiard Room",
    shortLabel: "Billiard",
    col: 2, row: 1,
    adjacent: ["Conservatory", "Library"],
    colorClass: "bg-teal-900/60",
    icon: "🎱",
  },
  // Row 2
  {
    id: "Lounge",
    label: "Lounge",
    shortLabel: "Lounge",
    col: 0, row: 2,
    adjacent: ["Dining Room", "Hall"],
    secretPassage: "Conservatory",
    colorClass: "bg-orange-900/60",
    icon: "🛋️",
  },
  {
    id: "Hall",
    label: "Hall",
    shortLabel: "Hall",
    col: 1, row: 2,
    adjacent: ["Lounge", "Study", "Ballroom", "Dining Room"],
    colorClass: "bg-slate-700/60",
    icon: "🚪",
  },
  {
    id: "Library",
    label: "Library",
    shortLabel: "Library",
    col: 2, row: 2,
    adjacent: ["Billiard Room", "Study"],
    colorClass: "bg-indigo-900/60",
    icon: "📚",
  },
  {
    id: "Study",
    label: "Study",
    shortLabel: "Study",
    col: 1, row: 1,  // center tile
    adjacent: ["Hall", "Library"],
    secretPassage: "Kitchen",
    colorClass: "bg-yellow-900/60",
    icon: "🕯️",
  },
];

/** Map room id → RoomNode for O(1) lookup */
export const ROOM_MAP: Record<Room, RoomNode> = Object.fromEntries(
  BOARD_ROOMS.map((r) => [r.id, r])
) as Record<Room, RoomNode>;

/** Returns all rooms adjacent to the given room (including secret passage) */
export function getReachableRooms(from: Room): Room[] {
  const node = ROOM_MAP[from];
  if (!node) return [];
  const reachable = [...node.adjacent];
  if (node.secretPassage) reachable.push(node.secretPassage);
  return reachable;
}

/** Returns true if a player can move from `from` to `to` in one turn */
export function canMoveTo(from: Room, to: Room): boolean {
  return getReachableRooms(from).includes(to);
}
