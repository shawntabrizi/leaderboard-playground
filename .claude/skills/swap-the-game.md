---
name: swap-the-game
description: Guide an AI pair-programmer through replacing Flappy Bird with a new game while keeping the scoreboard intact.
---

# Swap the game

This template separates the **game** from the **scoreboard**. Swapping the
game means writing one new component and changing one line in `App.tsx`.

## The contract

Every game in `src/games/` must export a component matching `GameComponentProps`
from `src/games/types.ts`:

```ts
export interface GameComponentProps {
  onGameEnd: (score: number) => void;
}
```

The game must:

1. Be a self-contained React component.
2. Render its own UI (canvas, DOM, whatever).
3. Call `onGameEnd(score)` **exactly once** when the game ends.
4. Know nothing about the scoreboard, the player, or persistence.

## Recipe

1. Create `src/games/<your-game>/<YourGame>.tsx`.
2. Implement `GameComponentProps`.
3. In `src/App.tsx`, replace:
   ```tsx
   import { FlappyGame } from "./games/flappy/FlappyGame";
   ...
   <FlappyGame onGameEnd={onGameEnd} />
   ```
   with your component.
4. Done. The leaderboard, player name input, and storage layer are unchanged.

## What NOT to do

- Don't import anything from `src/scoreboard/` inside a game. The whole point
  of the separation is that the game is storage-agnostic.
- Don't read or write `localStorage` from inside the game for score data.
- Don't make the game multi-instance (no `useEffect`-driven mounts/unmounts
  that could fire `onGameEnd` more than once). The scoreboard expects exactly
  one final score per match.

## Game ideas that fit this template

- 2048 — score = sum of merged tiles
- Snake — score = food eaten
- Clicker — score = clicks per round (timed)
- Memory match — score = inverse of moves taken
- Reaction time — score = (1000 − ms) clamped to ≥ 0

Anything that produces a single integer at end-of-match is a fit.
