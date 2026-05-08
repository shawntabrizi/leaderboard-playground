import { useEffect, useState } from "react";
import type { ScoreboardAPI, ScoreEntry } from "./api";

interface Props {
  api: ScoreboardAPI;
  refreshKey: number;
  highlightPlayer?: string;
  limit?: number;
}

export function Leaderboard({ api, refreshKey, highlightPlayer, limit = 10 }: Props) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getTopScores(limit).then((s) => {
      if (cancelled) return;
      setScores(s);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [api, refreshKey, limit]);

  return (
    <div className="leaderboard">
      <h2>Top {limit}</h2>
      {loading ? (
        <p className="leaderboard-empty">Loading…</p>
      ) : scores.length === 0 ? (
        <p className="leaderboard-empty">No scores yet. Be the first.</p>
      ) : (
        <ol className="leaderboard-list">
          {scores.map((entry, i) => {
            const isYou = highlightPlayer && entry.player === highlightPlayer;
            return (
              <li key={`${entry.player}-${entry.timestamp}`} className={isYou ? "is-you" : ""}>
                <span className="rank">#{i + 1}</span>
                <span className="player">{entry.player}</span>
                <span className="score">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
