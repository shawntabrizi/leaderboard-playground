#!/usr/bin/env bash
# Playground starter setup — runs after `dot mod` clones the repo.
# Safe to re-run. Should finish in under 1 minute on a clean box.

set -euo pipefail

echo "[setup] Leaderboard Playground"

if [ -f "package.json" ]; then
    if command -v pnpm >/dev/null 2>&1; then
        echo "[setup] pnpm detected — installing dependencies..."
        pnpm install
    elif command -v npm >/dev/null 2>&1; then
        echo "[setup] npm detected — installing dependencies..."
        npm install --no-audit --no-fund
    else
        echo "[setup] ERROR: no npm or pnpm on PATH. Install Node.js (>= 20) and try again." >&2
        exit 1
    fi
fi

cat <<'EOF'

[setup] Done.

Next steps:
  npm run dev              # start the dev server (or pnpm dev)
  open http://localhost:5173

To swap the game:
  See README.md → "Swap the game" and src/games/types.ts.

To move the leaderboard on-chain:
  See quests.json → "on-chain-leaderboard".
EOF
