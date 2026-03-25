# 🕯️ Cluedo: Manor of Shadows

A full-stack multiplayer mystery deduction game built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase** — deployable to Vercel with zero configuration.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Multiplayer** | 2–6 players via Supabase Realtime (Postgres CDC) |
| **Characters** | All 6 classic suspects with unique colours & icons |
| **Game Board** | 3×3 grid with secret passages and adjacency rules |
| **Suggestions** | Make suggestions in any room; opponents can disprove |
| **Accusations** | Final accusations win or eliminate the player |
| **AI Players** | Add 1–4 AI bots with randomised logical play |
| **Notebook** | Per-player detective notebook with cycle-status clues |
| **Game Log** | Live scrolling timeline of all game events |
| **Dark UI** | Gothic manor aesthetic with Playfair Display typography |
| **Responsive** | Full desktop + mobile layout with tab switching |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites

- Node.js ≥ 18
- npm or yarn
- A free [Supabase](https://supabase.com) project

### 2. Clone & Install

```bash
git clone https://github.com/your-username/cluedo-mystery.git
cd cluedo-mystery
npm install
```

### 3. Configure Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
2. Once created, open **SQL Editor** and paste the contents of `supabase/schema.sql`
3. Click **Run** to create the `games` table with RLS and Realtime enabled

### 4. Set Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # optional, for API routes
```

Find these under **Project Settings → API** in your Supabase dashboard.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/cluedo-mystery)

### Manual Deploy

```bash
npm install -g vercel
vercel --prod
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

> **Zero config**: Next.js is auto-detected by Vercel. No `vercel.json` needed.

---

## 🗂 Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home / lobby creation
│   ├── lobby/[gameId]/page.tsx # Waiting room
│   ├── game/[gameId]/page.tsx  # Main game view
│   └── api/
│       └── game/
│           ├── route.ts        # GET/POST game state
│           └── action/route.ts # Server-side action validation
│
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx       # 3×3 room grid with player tokens
│   │   ├── PlayerHand.tsx      # Cards dealt to local player
│   │   ├── DetectiveNotebook.tsx # Clue tracking checklist
│   │   ├── GameLog.tsx         # Scrollable event timeline
│   │   ├── TurnBanner.tsx      # Current turn / phase indicator
│   │   └── PlayerList.tsx      # Sidebar player roster
│   ├── modals/
│   │   ├── SuggestionModal.tsx # Make a suggestion
│   │   ├── AccusationModal.tsx # Final accusation (with confirm step)
│   │   ├── DisproveModal.tsx   # Show a card to disprove
│   │   └── WinModal.tsx        # Game over / solution reveal
│   └── ui/
│       └── LoadingScreen.tsx   # Animated loading state
│
├── lib/
│   ├── gameEngine.ts           # Pure game-rule functions (no UI)
│   ├── board.ts                # Room definitions, adjacency graph
│   ├── supabase.ts             # Supabase client + helpers
│   └── utils.ts                # cn(), formatTime(), etc.
│
├── store/
│   └── gameStore.ts            # Zustand store with Supabase sync
│
├── hooks/
│   └── useRealtime.ts          # Supabase Realtime subscription
│
└── types/
    └── game.ts                 # All TypeScript types & constants
```

---

## 🎮 How to Play

1. **Create a game** — Enter your name, choose a character, get a 6-character room code
2. **Share the code** — Friends join at the same URL with the room code
3. **Add AI bots** — The host can add up to 4 AI players to fill empty slots
4. **Start** — Host clicks "Start Game" once 2+ players are ready
5. **Take turns**:
   - **Move** to an adjacent room (or use a secret passage)
   - **Suggest** a suspect + weapon in your current room (optional)
   - Opponents can **disprove** your suggestion by showing a matching card
   - Use your **Detective Notebook** to track what you've ruled out
   - When confident, make a **Final Accusation** — correct = win, wrong = eliminated!

---

## 🏗 Architecture Notes

### Game Engine (`src/lib/gameEngine.ts`)
Pure functions only — no React, no Supabase. Takes state in, returns new state out. Fully testable in isolation.

### State Management (`src/store/gameStore.ts`)
Zustand store wraps the game engine. Every action calls the engine, updates local state, then persists to Supabase. Realtime updates from other players flow in via `useRealtime`.

### Realtime Sync (`src/hooks/useRealtime.ts`)
Subscribes to Postgres CDC (Change Data Capture) on the `games` table. When any player writes a new state, all other connected clients receive the update instantly via WebSocket.

### API Routes (`src/app/api/game/`)
Optional server-side validation layer. Clients can call these instead of writing to Supabase directly for stricter rule enforcement.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSocket) |
| Animations | Framer Motion |
| UI Icons | Lucide React |
| Toasts | React Hot Toast |
| Fonts | Playfair Display + Lora (Google Fonts) |
| Deployment | Vercel (zero config) |

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Service role key for API routes |

---

## 🔐 Security Notes

- The **anon key** is safe to expose in the browser — Supabase Row Level Security policies control data access
- The **service role key** should only be used server-side (API routes) and never exposed to the browser
- In production, consider adding player authentication via Supabase Auth for stricter game access control

---

## 📜 License

MIT — free to use, modify and deploy.
