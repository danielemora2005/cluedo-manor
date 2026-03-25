"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useGameStore, selectIsMyTurn, selectMe, selectPendingSuggestion } from "@/store/gameStore";
import { useRealtime } from "@/hooks/useRealtime";
import { fetchGame } from "@/lib/supabase";
import { computeAITurn, findDisprover, getDisproveOptions } from "@/lib/gameEngine";
import { sleep } from "@/lib/utils";
import GameBoard from "@/components/game/GameBoard";
import PlayerHand from "@/components/game/PlayerHand";
import DetectiveNotebook from "@/components/game/DetectiveNotebook";
import GameLog from "@/components/game/GameLog";
import TurnBanner from "@/components/game/TurnBanner";
import PlayerList from "@/components/game/PlayerList";
import SuggestionModal from "@/components/modals/SuggestionModal";
import AccusationModal from "@/components/modals/AccusationModal";
import DisproveModal from "@/components/modals/DisproveModal";
import WinModal from "@/components/modals/WinModal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { Room, Suspect, Weapon, Card } from "@/types/game";

type ActivePanel = "board" | "notebook" | "log";

export default function GamePage() {
  const params  = useParams();
  const router  = useRouter();
  const gameId  = params.gameId as string;

  const store     = useGameStore();
  const isMyTurn  = useGameStore(selectIsMyTurn);
  const me        = useGameStore(selectMe);
  const pending   = useGameStore(selectPendingSuggestion);

  const [initialized,       setInitialized]       = useState(false);
  const [activePanel,       setActivePanel]        = useState<ActivePanel>("board");
  const [showSuggestion,    setShowSuggestion]     = useState(false);
  const [showAccusation,    setShowAccusation]     = useState(false);
  const [showDisprove,      setShowDisprove]       = useState(false);
  const [processingAI,      setProcessingAI]       = useState(false);

  // ── Realtime sync ──────────────────────────────────────────
  useRealtime(gameId);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    const pid = sessionStorage.getItem("cluedo_pid");
    if (pid) store.setPlayerId(pid);

    fetchGame(gameId).then((state) => {
      if (!state) { router.push("/"); return; }
      store.loadGame(state);
      setInitialized(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // ── Disprove modal trigger ─────────────────────────────────
  useEffect(() => {
    if (!store.gameState || !pending) return;
    if (store.gameState.turnPhase !== "disprove") return;

    const state = store.gameState;
    const myId  = store.playerId;

    // Is it my turn to disprove?
    const disprover = findDisprover(state, pending.playerId, pending.suspect, pending.weapon, pending.room);
    if (disprover?.id === myId) {
      setShowDisprove(true);
    }
  }, [store.gameState?.turnPhase, pending, store.playerId]);

  // ── Auto-advance disprove if no one can ───────────────────
  useEffect(() => {
    if (!store.gameState || !pending) return;
    if (store.gameState.turnPhase !== "disprove") return;
    if (!isMyTurn) return;

    const state    = store.gameState;
    const disprover = findDisprover(state, pending.playerId, pending.suspect, pending.weapon, pending.room);

    if (!disprover) {
      // Nobody can disprove — auto-mark after a brief pause
      setTimeout(() => store.cannotDisprove(), 1000);
    }
  }, [store.gameState?.turnPhase, pending, isMyTurn]);

  // ── AI turn logic ──────────────────────────────────────────
  useEffect(() => {
    if (!store.gameState) return;
    if (store.gameState.status !== "playing") return;

    const currentPlayer = store.gameState.players[store.gameState.currentTurnIndex];
    if (!currentPlayer?.isAI) return;
    if (processingAI) return;

    runAITurn(currentPlayer.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.gameState?.currentPlayerId, store.gameState?.turnPhase]);

  async function runAITurn(aiId: string) {
    if (!store.gameState) return;
    setProcessingAI(true);

    const state  = store.gameState;
    const phase  = state.turnPhase;

    await sleep(1200); // Simulate thinking

    try {
      if (phase === "move") {
        const { move } = computeAITurn(state, aiId);
        if (move) await store.move(move);
        return;
      }

      if (phase === "suggest") {
        const { suggestion } = computeAITurn(state, aiId);
        if (suggestion) {
          await store.suggest(suggestion.suspect, suggestion.weapon);
        } else {
          await store.skipSuggest();
        }
        return;
      }

      if (phase === "disprove") {
        if (!pending) return;
        const ai = state.players.find((p) => p.id === aiId);
        if (!ai) return;
        const opts = getDisproveOptions(ai, pending.suspect, pending.weapon, pending.room);
        if (opts.length > 0) {
          const card = opts[Math.floor(Math.random() * opts.length)];
          await store.disprove(card);
        }
        return;
      }

      if (phase === "end_turn") {
        await store.finishTurn();
        return;
      }
    } catch (e) {
      // Ignore AI errors silently
    } finally {
      setProcessingAI(false);
    }
  }

  // ── Handlers ───────────────────────────────────────────────
  const handleMove = useCallback(async (room: Room) => {
    try { await store.move(room); toast.success(`Moved to ${room}`); }
    catch (e) { toast.error((e as Error).message); }
  }, [store]);

  const handleSuggest = useCallback(async (suspect: Suspect, weapon: Weapon) => {
    try {
      await store.suggest(suspect, weapon);
      setShowSuggestion(false);
    } catch (e) { toast.error((e as Error).message); }
  }, [store]);

  const handleAccuse = useCallback(async (suspect: Suspect, weapon: Weapon, room: Room) => {
    try {
      await store.accuse(suspect, weapon, room);
      setShowAccusation(false);
    } catch (e) { toast.error((e as Error).message); }
  }, [store]);

  const handleDisprove = useCallback(async (card: Card) => {
    try {
      await store.disprove(card);
      setShowDisprove(false);
    } catch (e) { toast.error((e as Error).message); }
  }, [store]);

  const handleSkipSuggest = useCallback(async () => {
    try { await store.skipSuggest(); setShowSuggestion(false); }
    catch (e) { toast.error((e as Error).message); }
  }, [store]);

  const handleEndTurn = useCallback(async () => {
    try { await store.finishTurn(); }
    catch (e) { toast.error((e as Error).message); }
  }, [store]);

  // ── Loading ────────────────────────────────────────────────
  if (!initialized || !store.gameState) return <LoadingScreen />;

  const gs      = store.gameState;
  const winner  = gs.winner ? gs.players.find((p) => p.id === gs.winner) : null;
  const phase   = gs.turnPhase;

  const canSuggest  = isMyTurn && phase === "suggest" && me?.isActive;
  const canAccuse   = isMyTurn && (phase === "suggest" || phase === "end_turn") && me?.isActive;
  const canEndTurn  = isMyTurn && phase === "end_turn" && me?.isActive;

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-manor-600/20 bg-obsidian-900/80 backdrop-blur-sm px-4 py-3
                         flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="font-serif text-gold-400 font-black text-xl hidden sm:block">
            CLUEDO
          </span>
          <span className="text-obsidian-600 hidden sm:block">·</span>
          <span className="font-mono text-obsidian-400 text-sm tracking-widest">{gameId}</span>
        </div>

        {/* Panel tabs (mobile) */}
        <div className="flex gap-1 lg:hidden">
          {(["board", "notebook", "log"] as ActivePanel[]).map((p) => (
            <button
              key={p}
              onClick={() => setActivePanel(p)}
              className={`px-3 py-1.5 rounded text-xs font-serif font-bold capitalize transition-colors
                ${activePanel === p
                  ? "bg-gold-600 text-obsidian-950"
                  : "text-obsidian-400 hover:text-manor-300"}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Turn phase indicator */}
        <div className="flex items-center gap-2">
          {store.isSyncing && (
            <span className="text-xs text-obsidian-500 animate-pulse">Syncing…</span>
          )}
          <span className={`text-xs px-2 py-1 rounded font-mono uppercase tracking-wider
            ${gs.status === "ended"
              ? "bg-crimson-700/30 text-crimson-400"
              : "bg-gold-600/20 text-gold-400"}`}>
            {gs.status === "ended" ? "GAME OVER" : phase.replace("_", " ")}
          </span>
        </div>
      </header>

      {/* Turn Banner */}
      <TurnBanner gameState={gs} playerId={store.playerId} />

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Player list (desktop) ─── */}
        <aside className="hidden xl:flex flex-col w-56 border-r border-manor-600/20
                          bg-obsidian-900/40 p-3 gap-3 overflow-y-auto">
          <PlayerList gameState={gs} currentPlayerId={store.playerId} />
        </aside>

        {/* ── CENTER: Board ───────────────── */}
        <main className={`flex-1 overflow-y-auto p-3 md:p-5
          ${activePanel !== "board" ? "hidden lg:block" : ""}`}>
          <GameBoard
            gameState={gs}
            playerId={store.playerId}
            onMove={handleMove}
            isMyTurn={isMyTurn}
          />

          {/* Player hand */}
          {me && (
            <div className="mt-4">
              <PlayerHand player={me} />
            </div>
          )}

          {/* Action buttons */}
          {me?.isActive && (
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {canSuggest && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="manor-btn-primary"
                  onClick={() => setShowSuggestion(true)}
                >
                  🔍 Make Suggestion
                </motion.button>
              )}
              {canSuggest && (
                <button className="manor-btn-secondary" onClick={handleSkipSuggest}>
                  Skip Suggestion
                </button>
              )}
              {canAccuse && (
                <button
                  className="manor-btn-danger"
                  onClick={() => setShowAccusation(true)}
                >
                  ⚖️ Make Accusation
                </button>
              )}
              {canEndTurn && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="manor-btn-primary"
                  onClick={handleEndTurn}
                >
                  End Turn →
                </motion.button>
              )}
            </div>
          )}

          {!me?.isActive && gs.status === "playing" && (
            <div className="mt-4 text-center p-4 manor-card border-crimson-700/30">
              <p className="text-crimson-400 font-serif italic">
                You have been eliminated. Watch as others solve the mystery…
              </p>
            </div>
          )}
        </main>

        {/* ── RIGHT: Notebook + Log ─────── */}
        <aside className={`w-full lg:w-80 xl:w-96 border-l border-manor-600/20
                           bg-obsidian-900/40 flex flex-col overflow-hidden
                           ${activePanel === "board" ? "hidden lg:flex" : ""}`}>
          {/* Notebook panel */}
          <div className={`flex-1 overflow-y-auto p-3
            ${activePanel === "log" ? "hidden lg:block" : ""}`}>
            {activePanel !== "log" && (
              <DetectiveNotebook
                notebook={store.notebook}
                onUpdate={store.updateNotebook}
              />
            )}
          </div>

          {/* Game log */}
          <div className={`border-t border-manor-600/20 flex-shrink-0
            ${activePanel === "notebook" ? "hidden lg:block" : ""}`}
            style={{ height: activePanel === "log" ? "100%" : "240px" }}
          >
            <GameLog entries={gs.log} />
          </div>
        </aside>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuggestion && me && (
          <SuggestionModal
            currentRoom={me.currentRoom}
            onConfirm={handleSuggest}
            onClose={() => setShowSuggestion(false)}
          />
        )}
        {showAccusation && (
          <AccusationModal
            onConfirm={handleAccuse}
            onClose={() => setShowAccusation(false)}
          />
        )}
        {showDisprove && pending && me && (
          <DisproveModal
            suggestion={pending}
            player={me}
            onDisprove={handleDisprove}
            onClose={() => setShowDisprove(false)}
          />
        )}
        {gs.status === "ended" && (
          <WinModal
            gameState={gs}
            playerId={store.playerId}
            onPlayAgain={() => router.push("/")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
