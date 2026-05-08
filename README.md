# Leaderboard Playground

A Polkadot Playground starter template. A single-player game with a leaderboard — designed so the **game** and the **scoreboard backend** are independent. Swap either one without touching the other.

Ships with Flappy Bird and a localStorage leaderboard. Documented paths for moving the leaderboard on-chain or to Bulletin.

## Run

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Architecture

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│ src/games/flappy/           │     │ src/scoreboard/             │
│   FlappyGame.tsx            │     │   api.ts          (interface)│
│                             │     │   local-impl.ts   (one impl) │
│ Knows nothing about chain,  │     │   Leaderboard.tsx (UI)       │
│ storage, or the player.     │     │                             │
│ Calls onGameEnd(score) once.│     │ Knows nothing about WHICH    │
└──────────────┬──────────────┘     │ game. Just numeric scores.  │
               │                    └──────────────┬──────────────┘
               │ onGameEnd(score)                  │ submitScore / getTopScores
               ▼                                   ▼
                  ┌─────────────────────────────────────┐
                  │ src/App.tsx                         │
                  │   The only file that knows about    │
                  │   both. Wires one specific game to  │
                  │   one specific scoreboard impl.     │
                  └─────────────────────────────────────┘
```

The seam is `GameComponentProps` (in [`src/games/types.ts`](src/games/types.ts)) on one side and `ScoreboardAPI` (in [`src/scoreboard/api.ts`](src/scoreboard/api.ts)) on the other. Anything implementing one of those is a drop-in.

## Swap the game

A game is a React component that calls `onGameEnd(score)` exactly once when the match ends.

```tsx
import type { GameComponentProps } from "../types";

export function MyGame({ onGameEnd }: GameComponentProps) {
  // render your game; when it ends:
  onGameEnd(finalScore);
}
```

Then in [`src/App.tsx`](src/App.tsx), change the one import + one JSX line:

```diff
- import { FlappyGame } from "./games/flappy/FlappyGame";
+ import { MyGame } from "./games/my-game/MyGame";
...
- <FlappyGame onGameEnd={onGameEnd} />
+ <MyGame onGameEnd={onGameEnd} />
```

That's it. The leaderboard, player input, and storage layer are unchanged.

See [`.claude/skills/swap-the-game.md`](.claude/skills/swap-the-game.md) for AI pair-programmer context.

## Swap the backend

The scoreboard backend is whatever satisfies `ScoreboardAPI`:

```ts
interface ScoreboardAPI {
  submitScore(player: string, score: number): Promise<void>;
  getTopScores(limit?: number): Promise<ScoreEntry[]>;
  getPlayerBest(player: string): Promise<number | null>;
}
```

The default `localScoreboard` writes to `localStorage`. To move scores on-chain:

1. Ship a leaderboard PVM contract (e.g. `@example/leaderboard`).
2. Write `src/scoreboard/contract-impl.ts` that wraps the cdm handle and implements the interface.
3. Change one constant in [`src/App.tsx`](src/App.tsx):
   ```diff
   - import { localScoreboard } from "./scoreboard/local-impl";
   - const SCOREBOARD = localScoreboard;
   + import { contractScoreboard } from "./scoreboard/contract-impl";
   + const SCOREBOARD = contractScoreboard;
   ```

The game and `Leaderboard` component never change. See [`.claude/skills/swap-the-backend.md`](.claude/skills/swap-the-backend.md) for the full recipe.

## Layout

```
src/
├── App.tsx                      # composition — wires one game to one backend
├── App.css
├── main.tsx
├── games/
│   ├── types.ts                 # GameComponentProps — the game contract
│   └── flappy/
│       ├── FlappyGame.tsx       # the shipped game
│       └── flappy.css
└── scoreboard/
    ├── api.ts                   # ScoreboardAPI — the backend contract
    ├── local-impl.ts            # localStorage implementation
    └── Leaderboard.tsx          # UI — backend-agnostic
```

Convention files for the playground registry: [`template.json`](template.json), [`quests.json`](quests.json), [`setup.sh`](setup.sh).

## Mod ideas

See [`quests.json`](quests.json) for a fuller list. Short version:

- **Swap the game** — anything producing a numeric score (2048, Snake, reaction-time, clicker) plugs in.
- **Move the leaderboard on-chain** — ship a PVM contract; replace `local-impl.ts` with a contract-backed one.
- **Persist match history on Bulletin** — store full replay data off-chain, content-addressed; contract holds the index.
- **Cross-game scoring** — add `game_id` to the API; multiple games share one leaderboard.

## Why this shape

A common failure mode for "starter" templates is to ship a complete demo that's hard to mod because the game logic, the chain logic, and the UI are tangled. This template makes the seams explicit:

- The game produces a number.
- The scoreboard stores numbers.
- `App.tsx` is the only file that knows about both.

Mod the game without learning Polkadot. Mod the backend without touching the game. Both at once if you want — but the surfaces are independent.
