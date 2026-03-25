"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Skull, Sword, Search, Users, Sparkles } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { generateRoomCode } from "@/lib/utils";
import { SUSPECTS, CHARACTER_META } from "@/types/game";
import type { Suspect } from "@/types/game";

// ── Feature cards shown on the home page ─────────────────────
const FEATURES = [
  { icon: <Users className="w-6 h-6" />, label: "2–6 Players",    desc: "Online or local multiplayer" },
  { icon: <Skull className="w-6 h-6" />, label: "6 Suspects",     desc: "Each with dark secrets"      },
  { icon: <Sword className="w-6 h-6" />, label: "6 Weapons",      desc: "Hidden across the manor"     },
  { icon: <Search className="w-6 h-6"/>, label: "Detective Notebook", desc: "Track every clue"        },
];

export default function HomePage() {
  const router = useRouter();
  const { setPlayerId, setPlayerName } = useGameStore();

  const [step, setStep]             = useState<"home" | "setup">("home");
  const [mode, setMode]             = useState<"create" | "join">("create");
  const [name, setName]             = useState("");
  const [character, setCharacter]   = useState<Suspect | "">("");
  const [joinCode, setJoinCode]     = useState("");
  const [loading, setLoading]       = useState(false);

  // ── Handlers ────────────────────────────────────────────────

  function handleBegin(m: "create" | "join") {
    setMode(m);
    setStep("setup");
  }

  async function handleCreate() {
    if (!name.trim())     return toast.error("Please enter your name.");
    if (!character)       return toast.error("Please choose a character.");

    setLoading(true);
    const pid    = uuid();
    const gameId = generateRoomCode();

    setPlayerId(pid);
    setPlayerName(name.trim());

    // Store in session so other tabs / the game page can read it
    sessionStorage.setItem("cluedo_pid",  pid);
    sessionStorage.setItem("cluedo_name", name.trim());
    sessionStorage.setItem("cluedo_char", character);

    router.push(`/lobby/${gameId}?pid=${pid}&host=1`);
  }

  async function handleJoin() {
    if (!name.trim())     return toast.error("Please enter your name.");
    if (!character)       return toast.error("Please choose a character.");
    if (!joinCode.trim()) return toast.error("Please enter a room code.");

    setLoading(true);
    const pid = uuid();
    setPlayerId(pid);
    setPlayerName(name.trim());

    sessionStorage.setItem("cluedo_pid",  pid);
    sessionStorage.setItem("cluedo_name", name.trim());
    sessionStorage.setItem("cluedo_char", character);

    router.push(`/lobby/${joinCode.toUpperCase().trim()}?pid=${pid}`);
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-obsidian-900 via-obsidian-950 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                        bg-gold-600/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px]
                        bg-crimson-700/5 blur-3xl rounded-full" />
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {step === "home" ? (
        <HomeScreen onCreate={() => handleBegin("create")} onJoin={() => handleBegin("join")} />
      ) : (
        <SetupScreen
          mode={mode}
          name={name} setName={setName}
          character={character as Suspect | ""} setCharacter={setCharacter}
          joinCode={joinCode} setJoinCode={setJoinCode}
          loading={loading}
          onBack={() => setStep("home")}
          onCreate={handleCreate}
          onJoin={handleJoin}
        />
      )}
    </main>
  );
}

// ── Home Screen ───────────────────────────────────────────────

function HomeScreen({
  onCreate, onJoin,
}: { onCreate: () => void; onJoin: () => void }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Skull className="w-8 h-8 text-gold-400 animate-flicker" />
          <span className="font-serif text-gold-400 text-sm tracking-[0.4em] uppercase">
            A Murder Mystery
          </span>
          <Skull className="w-8 h-8 text-gold-400 animate-flicker" />
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-black text-manor-100 leading-none mb-3">
          CLUEDO
        </h1>
        <p className="font-serif text-xl md:text-2xl text-gold-400/80 italic">
          Manor of Shadows
        </p>
        <p className="mt-4 text-manor-400 max-w-md mx-auto leading-relaxed">
          A murder has been committed at Blackwood Manor. Six suspects,
          six weapons, nine rooms — only one detective will unmask the truth.
        </p>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 mb-14"
      >
        <button onClick={onCreate} className="manor-btn-primary text-lg px-8 py-3 group">
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Create New Game
        </button>
        <button onClick={onJoin} className="manor-btn-secondary text-lg px-8 py-3">
          <Users className="w-5 h-5" />
          Join Existing Game
        </button>
      </motion.div>

      {/* Feature grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full"
      >
        {FEATURES.map((f, i) => (
          <div key={i} className="manor-card p-4 text-center">
            <div className="text-gold-400 flex justify-center mb-2">{f.icon}</div>
            <p className="font-serif font-bold text-manor-200 text-sm">{f.label}</p>
            <p className="text-obsidian-400 text-xs mt-1">{f.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Setup Screen ──────────────────────────────────────────────

function SetupScreen({
  mode, name, setName, character, setCharacter,
  joinCode, setJoinCode, loading, onBack, onCreate, onJoin,
}: {
  mode: "create" | "join";
  name: string; setName: (v: string) => void;
  character: Suspect | ""; setCharacter: (v: Suspect) => void;
  joinCode: string; setJoinCode: (v: string) => void;
  loading: boolean;
  onBack: () => void;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="manor-card w-full max-w-2xl p-8"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-manor-100 mb-1">
            {mode === "create" ? "Create a New Game" : "Join a Game"}
          </h2>
          <p className="text-obsidian-400 text-sm italic">
            Choose your identity, detective.
          </p>
        </div>

        {/* Name input */}
        <div className="mb-6">
          <label className="block text-gold-400 text-sm font-serif font-bold mb-2 tracking-wide">
            Your Detective Name
          </label>
          <input
            className="manor-input"
            placeholder="e.g. Inspector Graves"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />
        </div>

        {/* Join code (join mode only) */}
        {mode === "join" && (
          <div className="mb-6">
            <label className="block text-gold-400 text-sm font-serif font-bold mb-2 tracking-wide">
              Room Code
            </label>
            <input
              className="manor-input uppercase tracking-widest text-lg font-mono"
              placeholder="ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>
        )}

        {/* Character selection */}
        <div className="mb-8">
          <label className="block text-gold-400 text-sm font-serif font-bold mb-3 tracking-wide">
            Choose Your Suspect
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUSPECTS.map((s) => {
              const meta = CHARACTER_META[s];
              const isSelected = character === s;
              return (
                <button
                  key={s}
                  onClick={() => setCharacter(s)}
                  className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200
                    ${isSelected
                      ? "border-gold-400 bg-obsidian-800"
                      : "border-obsidian-700 bg-obsidian-900 hover:border-obsidian-500"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{meta.icon}</span>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                  </div>
                  <p className="font-serif font-bold text-xs text-manor-200 leading-tight">
                    {s}
                  </p>
                  <p className="text-obsidian-400 text-xs mt-0.5 leading-tight line-clamp-2">
                    {meta.description}
                  </p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-gold-500 rounded-full
                                    flex items-center justify-center">
                      <span className="text-obsidian-950 text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onBack} className="manor-btn-secondary flex-1" disabled={loading}>
            ← Back
          </button>
          <button
            onClick={mode === "create" ? onCreate : onJoin}
            className="manor-btn-primary flex-[2]"
            disabled={loading}
          >
            {loading
              ? "Loading…"
              : mode === "create"
              ? "Create Room →"
              : "Join Game →"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
