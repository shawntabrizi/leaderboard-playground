---
name: swap-the-backend
description: Guide an AI pair-programmer through replacing the localStorage scoreboard with a contract or Bulletin-backed implementation.
---

# Swap the backend

The scoreboard layer is defined by `ScoreboardAPI` in `src/scoreboard/api.ts`:

```ts
export interface ScoreboardAPI {
  submitScore(player: string, score: number): Promise<void>;
  getTopScores(limit?: number): Promise<ScoreEntry[]>;
  getPlayerBest(player: string): Promise<number | null>;
}
```

Any object satisfying this interface is a valid backend. The shipped
`localScoreboard` (in `src/scoreboard/local-impl.ts`) is one. A
contract-backed or Bulletin-backed scoreboard is another.

## Recipe — contract backend

1. Add a leaderboard contract under `contracts/leaderboard/lib.rs` (PVM, with
   `cdm = "@example/leaderboard"`).
2. Storage suggestion: `Mapping<Address, u128>` for best score per player,
   plus a counter + `Mapping<u32, Address>` for paginated enumeration.
3. Methods: `submit_score(score: u128)`, `get_player_best(player: Address) -> u128`,
   `get_top_at(index: u32) -> (Address, u128)`, `get_player_count() -> u32`.
4. Build + deploy:
   ```bash
   cdm build
   cdm deploy -n paseo
   cdm install @example/leaderboard -n paseo
   ```
5. Add `src/scoreboard/contract-impl.ts` that wraps the cdm-generated handle
   and implements `ScoreboardAPI`.
6. Swap the constant at the top of `src/App.tsx`:
   ```ts
   import { contractScoreboard } from "./scoreboard/contract-impl";
   const SCOREBOARD = contractScoreboard;
   ```

The game, the `Leaderboard` component, and the player input are unchanged.

## Recipe — Bulletin-backed history (alongside contract)

Use the contract for the hot index (player → best score) and Bulletin for
match history:

1. After `submit_score`, upload the round-by-round history JSON to Bulletin.
2. Store the returned CID alongside the contract submission so a leaderboard
   row can link to its replay.
3. `getTopScores` returns rows enriched with their CID.

## Things to keep stable

- The `ScoreEntry` shape on the public API. Internal contract types can be
  whatever — but the value `getTopScores` resolves to should still be
  `{ player, score, timestamp }` so the existing `Leaderboard.tsx` keeps
  working.
- `submitScore` must be `async` and resolve only after the score is durably
  persisted. The UI refreshes the leaderboard on resolve.
