import { useCallback, useState } from "react";
import { FlappyGame } from "./games/flappy/FlappyGame";
import { Leaderboard } from "./scoreboard/Leaderboard";
import {
  contractScoreboard,
  isLeaderboardContractDeployed,
} from "./scoreboard/contract-impl";

const SCOREBOARD = contractScoreboard;
const PLAYER_KEY = "leaderboard-playground:player";
const CONTRACT_DEPLOYED = isLeaderboardContractDeployed();

export function App() {
  const [player, setPlayer] = useState(() => localStorage.getItem(PLAYER_KEY) ?? "");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onPlayerChange = (value: string) => {
    setPlayer(value);
    localStorage.setItem(PLAYER_KEY, value);
  };

  const onGameEnd = useCallback(
    async (score: number) => {
      setLastScore(score);
      const name = player.trim();
      if (!name || !CONTRACT_DEPLOYED) return;
      setSubmitState("submitting");
      setSubmitError(null);
      try {
        await SCOREBOARD.submitScore(name, score);
        setRefreshKey((k) => k + 1);
        setSubmitState("idle");
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
        setSubmitState("error");
      }
    },
    [player],
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1>Leaderboard Playground</h1>
        <p className="tagline">A starter template — swap the game, keep the on-chain scoreboard.</p>
      </header>

      {!CONTRACT_DEPLOYED && (
        <div className="banner banner-warn">
          <strong>Contract not deployed.</strong> Scores can&rsquo;t be saved yet. Run{" "}
          <code>cdm deploy -n paseo &amp;&amp; cdm install @example/leaderboard-playground -n paseo</code>,
          then restart the dev server. See <code>README.md</code> for the full first-run flow.
        </div>
      )}

      <div className="player-row">
        <label htmlFor="player">Your name</label>
        <input
          id="player"
          type="text"
          placeholder="alice"
          value={player}
          onChange={(e) => onPlayerChange(e.target.value)}
          maxLength={20}
        />
        {!player.trim() && <span className="player-hint">Set a name to save your scores.</span>}
      </div>

      <div className="layout">
        <section className="game-col">
          <FlappyGame onGameEnd={onGameEnd} />
          {lastScore !== null && (
            <p className="last-score">
              Last score: <strong>{lastScore}</strong>
              {submitState === "submitting" && " · submitting…"}
              {!player.trim() && " · add a name to save"}
              {!CONTRACT_DEPLOYED && player.trim() && " · contract not deployed"}
            </p>
          )}
          {submitError && <p className="submit-error">Submit failed: {submitError}</p>}
        </section>

        <section className="board-col">
          <Leaderboard api={SCOREBOARD} refreshKey={refreshKey} highlightPlayer={player.trim()} />
        </section>
      </div>

      <footer className="page-footer">
        <p>
          Polkadot Playground starter template. See <code>README.md</code> to deploy your contract,
          and <code>docs/modding.md</code> to swap the game or change the storage backend.
        </p>
      </footer>
    </div>
  );
}
