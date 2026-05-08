import { useCallback, useState } from "react";
import { FlappyGame } from "./games/flappy/FlappyGame";
import { Leaderboard } from "./scoreboard/Leaderboard";
import { localScoreboard } from "./scoreboard/local-impl";

const SCOREBOARD = localScoreboard;
const PLAYER_KEY = "leaderboard-playground:player";

export function App() {
  const [player, setPlayer] = useState(() => localStorage.getItem(PLAYER_KEY) ?? "");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const onPlayerChange = (value: string) => {
    setPlayer(value);
    localStorage.setItem(PLAYER_KEY, value);
  };

  const onGameEnd = useCallback(
    async (score: number) => {
      setLastScore(score);
      const name = player.trim();
      if (!name) return;
      await SCOREBOARD.submitScore(name, score);
      setRefreshKey((k) => k + 1);
    },
    [player],
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1>Leaderboard Playground</h1>
        <p className="tagline">A starter template — swap the game, keep the scoreboard.</p>
      </header>

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
        {!player.trim() && (
          <span className="player-hint">Set a name to save your scores.</span>
        )}
      </div>

      <div className="layout">
        <section className="game-col">
          <FlappyGame onGameEnd={onGameEnd} />
          {lastScore !== null && (
            <p className="last-score">
              Last score: <strong>{lastScore}</strong>
              {!player.trim() && " (not saved — add a name)"}
            </p>
          )}
        </section>

        <section className="board-col">
          <Leaderboard api={SCOREBOARD} refreshKey={refreshKey} highlightPlayer={player.trim()} />
        </section>
      </div>

      <footer className="page-footer">
        <p>
          Built as a Polkadot Playground starter template. See{" "}
          <code>README.md</code> for how to swap the game or move scores on-chain.
        </p>
      </footer>
    </div>
  );
}
