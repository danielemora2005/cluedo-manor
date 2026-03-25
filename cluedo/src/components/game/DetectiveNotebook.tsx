"use client";

import { SUSPECTS, WEAPONS, ROOMS, CHARACTER_META, WEAPON_ICONS, ROOM_ICONS } from "@/types/game";
import type { Card, NoteStatus, Notebook } from "@/types/game";

interface DetectiveNotebookProps {
  notebook: Notebook;
  onUpdate: (card: Card, status: NoteStatus) => void;
}

const STATUS_OPTIONS: { value: NoteStatus; label: string; color: string }[] = [
  { value: "unknown",  label: "?",  color: "text-obsidian-400" },
  { value: "innocent", label: "✓",  color: "text-green-400"    },
  { value: "guilty",   label: "✗",  color: "text-crimson-400"  },
  { value: "mine",     label: "★",  color: "text-gold-400"     },
];

function cycleStatus(current: NoteStatus): NoteStatus {
  const order: NoteStatus[] = ["unknown", "innocent", "guilty", "mine"];
  return order[(order.indexOf(current) + 1) % order.length];
}

// ── Section component ─────────────────────────────────────────
interface SectionProps {
  title: string;
  entries: { card: Card; icon: string; color?: string }[];
  notebook: Notebook;
  onUpdate: (card: Card, status: NoteStatus) => void;
}

function NotebookSection({ title, entries, notebook, onUpdate }: SectionProps) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-serif font-bold text-gold-400/80 uppercase tracking-widest mb-2 px-1">
        {title}
      </h4>
      <div className="space-y-1">
        {entries.map(({ card, icon, color }) => {
          const status = notebook[card] ?? "unknown";
          const statusDef = STATUS_OPTIONS.find((s) => s.value === status)!;
          return (
            <div
              key={card}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-obsidian-800/50 group"
            >
              <span className="text-base w-6 flex-shrink-0">{icon}</span>
              <span className="flex-1 text-sm text-manor-300 truncate font-body">{card}</span>

              {/* Status toggle */}
              <button
                onClick={() => onUpdate(card, cycleStatus(status))}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                  border transition-all duration-150 flex-shrink-0
                  ${status === "unknown"  ? "border-obsidian-600 bg-obsidian-800"   : ""}
                  ${status === "innocent" ? "border-green-700/60 bg-green-950/40"   : ""}
                  ${status === "guilty"   ? "border-crimson-700/60 bg-crimson-950/40" : ""}
                  ${status === "mine"     ? "border-gold-600/60 bg-gold-950/40"     : ""}
                  hover:scale-110 group-hover:border-opacity-80`}
                title="Click to cycle: ? → ✓ → ✗ → ★"
              >
                <span className={statusDef.color}>{statusDef.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Notebook ─────────────────────────────────────────────
export default function DetectiveNotebook({ notebook, onUpdate }: DetectiveNotebookProps) {
  const suspectEntries = SUSPECTS.map((s) => ({
    card: s as Card,
    icon: CHARACTER_META[s].icon,
    color: CHARACTER_META[s].color,
  }));

  const weaponEntries = WEAPONS.map((w) => ({
    card: w as Card,
    icon: WEAPON_ICONS[w],
  }));

  const roomEntries = ROOMS.map((r) => ({
    card: r as Card,
    icon: ROOM_ICONS[r],
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-manor-600/20">
        <span className="text-xl">📓</span>
        <div>
          <h3 className="section-title text-sm leading-none">Detective's Notebook</h3>
          <p className="text-obsidian-500 text-xs mt-0.5">Click any symbol to cycle status</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4 text-xs flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <span key={s.value} className="flex items-center gap-1 text-obsidian-400">
            <span className={`font-bold ${s.color}`}>{s.label}</span>
            <span className="capitalize">{s.value}</span>
          </span>
        ))}
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto pr-1">
        <NotebookSection
          title="🔴 Suspects"
          entries={suspectEntries}
          notebook={notebook}
          onUpdate={onUpdate}
        />
        <NotebookSection
          title="⚔️ Weapons"
          entries={weaponEntries}
          notebook={notebook}
          onUpdate={onUpdate}
        />
        <NotebookSection
          title="🏠 Rooms"
          entries={roomEntries}
          notebook={notebook}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}
