"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Users, Copy, Check, Play, Bot, Sword } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useGameStore } from "@/store/gameStore";
import { fetchGame, createGame, saveGame, subscribeToGame } from "@/lib/supabase";
import { CHARACTER_META, SUSPECTS } from "@/types/game";
import type { GameState, Player, Suspect } from "@/types/game";
import { initGame } from "@/lib/gameEngine";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

// ── AI bot names ─────────────────────────────────────────────
const AI_NAMES = ["Watson", "Poirot", "Marple", "Holmes"];

export default function LobbyPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const gameId       = params.gameId as string;
  const isHost       = searchParams.get("host") === "1";

  const { playerId, setPlayerId, playerName, setPlayerName, loadGame } = useGameStore();

  const [lobby, setLobby] = useState<{
    players: { id: string; name: string; character: Suspect; isAI: boolean }[];
    status: "waiting" | "starting";
  }>({ players: [], status: "waiting" });

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    const pid  = sessionStorage.getItem("cluedo_pid")  || searchParams.get("pid") || uuid();
    const name = sessionStorage.getItem("cluedo_name") || "Detective";
    const char = (sessionStorage.getItem("cluedo_char") || SUSPECTS[0]) as Suspect;

    setPlayerId(pid);
    setPlayerName(name);

    // Register this player in the lobby
    joinLobby(pid, name, char);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // ── Supabase realtime lobby sync ──────────────────────────────
  useEffect(() => {
    const unsub = subscribeToGame(gameId, (state: GameState) => {
      if (state.status === "playing") {
        loadGame(state);
        router.push(`/game/${gameId}`);
        return;
      }
      // Reconstruct lobby from state
      setLobby({
        players: state.players.map((p) => ({
          id: p.id, name: p.name, character: p.character, isAI: p.isAI,
        })),
        status: "waiting",
      });
    });
    return unsub;
  }, [gameId, loadGame, router]);

  // ── Join lobby ────────────────────────────────────────────────
  async function joinLobby(pid: string, name: string, character: Suspect) {
    // Fetch existing lobby state (or create if host)
    let existing = await fetchGame(gameId);

    if (!existing) {
      if (!isHost) {
        toast.error("Room not found. Check the code and try again.");
        router.push("/");
        return;
      }
      // Host: create the lobby skeleton
      existing = {
        id: gameId,
        status: "lobby" as any,
        hostId: pid,
        players: [],
        currentPlayerId: "",
        currentTurnIndex: 0,
        turnPhase: "move",
        solution: { suspect: "Miss Scarlett", weapon: "Knife", room: "Kitchen" },
        suggestions: [],
        accusations: [],
        log: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await createGame(gameId, existing);
    }

    // Add player if not already present
    const alreadyIn = existing.players.some((p) => p.id === pid);
    if (!alreadyIn) {
      const newPlayer: Player = {
        id: pid, name, character, cards: [], currentRoom: "Hall",
        isAI: false, isActive: true, hasWon: false,
      };

      // Check character not taken
      const takenChars = existing.players.map((p) => p.character);
      if (takenChars.includes(character)) {
        const free = SUSPECTS.find((s) => !takenChars.includes(s));
        if (free) newPlayer.character = free;
      }

      existing.players.push(newPlayer);
      await saveGame(gameId, existing);
    }

    setLobby({
      players: existing.players.map((p) => ({
        id: p.id, name: p.name, character: p.character, isAI: p.isAI,
      })),
      status: "waiting",
    });
  }

  // ── Add AI player ─────────────────────────────────────────────
  async function addAI() {
    const current = await fetchGame(gameId);
    if (!current) return;

    if (current.players.length >= MAX_PLAYERS) {
      toast.error("Room is full!");
      return;
    }

    const takenChars = current.players.map((p) => p.character);
    const freeChar   = SUSPECTS.find((s) => !takenChars.includes(s));
    if (!freeChar) { toast.error("No characters left!"); return; }

    const aiName = AI_NAMES[current.players.filter((p) => p.isAI).length % AI_NAMES.length];
    const aiPlayer: Player = {
      id: uuid(), name: `${aiName} (AI)`, character: freeChar,
      cards: [], currentRoom: "Hall",
      isAI: true, isActive: true, hasWon: false,
    };

    current.players.push(aiPlayer);
    await saveGame(gameId, current);
    toast.success(`${aiPlayer.name} joined the game.`);
  }

  // ── Start game ────────────────────────────────────────────────
  async function startGame() {
    if (lobby.players.length < MIN_PLAYERS) {
      toast.error(`Need at least ${MIN_PLAYERS} players to start.`);
      return;
    }
    setLoading(true);

    const current = await fetchGame(gameId);
    if (!current) { setLoading(false); return; }

    const playerDefs = current.players.map((p) => ({
      id: p.id, name: p.name, character: p.character, isAI: p.isAI,
    }));

    const gameState = initGame(gameId, playerDefs, playerId);
    await saveGame(gameId, gameState);

    loadGame(gameState);
    router.push(`/game/${gameId}`);
  }

  // ── Copy room code ────────────────────────────────────────────
  function copyCode() {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Room code copied!");
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px]
                        bg-gold-600/5 blur-3xl rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sword className="w-5 h-5 text-gold-400" />
            <span className="font-serif text-gold-400 text-sm tracking-widest uppercase">
              Waiting Room
            </span>
            <Sword className="w-5 h-5 text-gold-400" />
          </div>
          <h1 className="font-serif text-4xl font-black text-manor-100">Blackwood Manor</h1>
          <p className="text-obsidian-400 mt-1 italic">
            Gather your suspects before the clock strikes midnight…
          </p>
        </div>

        {/* Room Code */}
        <div className="manor-card p-5 mb-5 text-center">
          <p className="text-obsidian-400 text-sm mb-2">Share this room code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-4xl font-black text-gold-400 tracking-widest">
              {gameId}
            </span>
            <button onClick={copyCode} className="manor-btn-secondary p-2">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="manor-card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Users className="inline w-4 h-4 mr-2" />
              Players ({lobby.players.length}/{MAX_PLAYERS})
            </h2>
            {isHost && lobby.players.length < MAX_PLAYERS && (
              <button onClick={addAI} className="manor-btn-secondary text-xs py-1.5 px-3 gap-1.5">
                <Bot className="w-3.5 h-3.5" /> Add AI
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {lobby.players.map((p, i) => {
                const meta = CHARACTER_META[p.character];
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-obsidian-900/60
                               border border-obsidian-700/40"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg
                                 border-2 flex-shrink-0"
                      style={{ backgroundColor: meta.color + "33", borderColor: meta.color }}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-manor-100 truncate">
                          {p.name}
                        </span>
                        {p.id === playerId && (
                          <span className="text-xs bg-gold-600/20 text-gold-400 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                        {p.isAI && (
                          <span className="text-xs bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Bot className="w-3 h-3" /> AI
                          </span>
                        )}
                      </div>
                      <span className="text-obsidian-400 text-xs">{p.character}</span>
                    </div>
                    <span className="text-xl">{meta.icon}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {lobby.players.length === 0 && (
              <p className="text-center text-obsidian-500 py-4 italic">
                Waiting for players to arrive…
              </p>
            )}
          </div>

          {lobby.players.length < MIN_PLAYERS && (
            <p className="text-center text-obsidian-500 text-xs mt-3 italic">
              Need at least {MIN_PLAYERS} players to start
            </p>
          )}
        </div>

        {/* Start button (host only) */}
        {isHost && (
          <button
            onClick={startGame}
            disabled={lobby.players.length < MIN_PLAYERS || loading}
            className="manor-btn-primary w-full py-4 text-lg"
          >
            <Play className="w-5 h-5" />
            {loading ? "Starting…" : "Start Game"}
          </button>
        )}

        {!isHost && (
          <div className="text-center text-obsidian-500 italic text-sm">
            Waiting for the host to start the game…
          </div>
        )}
      </motion.div>
    </main>
  );
}
