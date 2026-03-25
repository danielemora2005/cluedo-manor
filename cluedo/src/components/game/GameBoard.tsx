"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BOARD_ROOMS, getReachableRooms } from "@/lib/board";
import { CHARACTER_META } from "@/types/game";
import type { GameState, Room, RoomNode } from "@/types/game";

interface GameBoardProps {
  gameState: GameState;
  playerId: string;
  onMove: (room: Room) => void;
  isMyTurn: boolean;
}

// Board uses a fixed 3×3 CSS grid; Study occupies the center cell (col=1, row=1)
const GRID_COLS = 3;
const GRID_ROWS = 3;

// Map col/row → grid position (1-indexed for CSS grid)
function gridPos(col: number, row: number) {
  return { gridColumn: col + 1, gridRow: row + 1 };
}

export default function GameBoard({ gameState, playerId, onMove, isMyTurn }: GameBoardProps) {
  const me = gameState.players.find((p) => p.id === playerId);

  // Rooms reachable by the current player this turn
  const reachable = useMemo<Room[]>(() => {
    if (!isMyTurn || gameState.turnPhase !== "move" || !me?.isActive) return [];
    return getReachableRooms(me.currentRoom);
  }, [isMyTurn, gameState.turnPhase, me]);

  // Group players by room for token display
  const playersByRoom = useMemo(() => {
    const map: Record<Room, typeof gameState.players> = {} as any;
    BOARD_ROOMS.forEach((r) => { map[r.id] = []; });
    gameState.players.forEach((p) => {
      if (map[p.currentRoom]) map[p.currentRoom].push(p);
    });
    return map;
  }, [gameState.players]);

  function handleRoomClick(room: Room) {
    if (!isMyTurn || gameState.turnPhase !== "move" || !me?.isActive) return;
    if (!reachable.includes(room)) return;
    onMove(room);
  }

  return (
    <div className="manor-card p-3 md:p-5">
      {/* Board header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">🏚 Blackwood Manor</h2>
        {me && (
          <span className="text-obsidian-400 text-xs italic">
            You are in: <span className="text-gold-400 font-semibold">{me.currentRoom}</span>
          </span>
        )}
      </div>

      {/* 3×3 Grid */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows:    `repeat(${GRID_ROWS}, auto)`,
        }}
      >
        {BOARD_ROOMS.map((room) => (
          <RoomTile
            key={room.id}
            room={room}
            players={playersByRoom[room.id] ?? []}
            isCurrentRoom={me?.currentRoom === room.id}
            isReachable={reachable.includes(room.id)}
            isMyTurn={isMyTurn && gameState.turnPhase === "move"}
            canMove={me?.isActive ?? false}
            onClick={() => handleRoomClick(room.id)}
            style={gridPos(room.col, room.row)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-obsidian-500">
        {isMyTurn && gameState.turnPhase === "move" && me?.isActive && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-gold-400 inline-block" />
              Reachable rooms
            </span>
            {BOARD_ROOMS.find((r) => r.id === me.currentRoom)?.secretPassage && (
              <span className="flex items-center gap-1.5">
                <span className="text-purple-400">✦</span>
                Secret passage available
              </span>
            )}
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gold-500 inline-block" />
          Your position
        </span>
      </div>
    </div>
  );
}

// ── Room Tile ─────────────────────────────────────────────────

interface RoomTileProps {
  room: RoomNode;
  players: GameState["players"];
  isCurrentRoom: boolean;
  isReachable: boolean;
  isMyTurn: boolean;
  canMove: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}

function RoomTile({
  room, players, isCurrentRoom, isReachable, isMyTurn, canMove, onClick, style,
}: RoomTileProps) {
  const clickable = isMyTurn && canMove && isReachable;

  const hasSecretPassage = !!room.secretPassage;

  return (
    <motion.div
      style={style}
      whileHover={clickable ? { scale: 1.03 } : {}}
      whileTap={clickable ? { scale: 0.97 } : {}}
      onClick={onClick}
      className={cn(
        "room-tile min-h-[72px] md:min-h-[90px]",
        room.colorClass,
        isCurrentRoom && "current ring-2 ring-gold-400/50",
        isReachable   && "reachable cursor-pointer",
        !clickable    && "cursor-default",
      )}
    >
      {/* Secret passage indicator */}
      {hasSecretPassage && (
        <span className="absolute top-1 right-1 text-purple-400 text-xs" title={`Secret passage to ${room.secretPassage}`}>
          ✦
        </span>
      )}

      {/* Room icon + name */}
      <span className="text-xl md:text-2xl mb-1 animate-flicker">{room.icon}</span>
      <span className="font-serif text-xs font-bold text-manor-200 text-center leading-tight px-1">
        {room.shortLabel}
      </span>

      {/* Reachable pulse ring */}
      {isReachable && (
        <span className="absolute inset-0 rounded-lg border-2 border-gold-400 animate-pulse opacity-60 pointer-events-none" />
      )}

      {/* Player tokens */}
      {players.length > 0 && (
        <div className="absolute bottom-1 left-1 flex flex-wrap gap-0.5 max-w-full">
          {players.slice(0, 4).map((p) => {
            const meta = CHARACTER_META[p.character];
            return (
              <div
                key={p.id}
                className="player-token"
                style={{ backgroundColor: meta.color, borderColor: "rgba(255,255,255,0.5)" }}
                title={`${p.name} (${p.character})`}
              >
                <span className="text-xs">{meta.icon}</span>
              </div>
            );
          })}
          {players.length > 4 && (
            <div className="player-token bg-obsidian-700">
              <span className="text-[9px]">+{players.length - 4}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
