export interface ScoreEntry {
  player: string;
  score: number;
  timestamp: number;
}

export interface ScoreboardAPI {
  submitScore(player: string, score: number): Promise<void>;
  getTopScores(limit?: number): Promise<ScoreEntry[]>;
  getPlayerBest(player: string): Promise<number | null>;
}
