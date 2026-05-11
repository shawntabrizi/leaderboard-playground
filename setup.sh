#!/usr/bin/env bash
# Playground starter setup — runs after `dot mod` clones the repo.
# Safe to re-run. The npm install completes in well under a minute;
# the contract deploy is a separate step (see README.md).

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

echo
echo "[setup] Checking optional contract toolchain..."
if ! command -v cargo >/dev/null 2>&1; then
    echo "[setup] WARNING: cargo not found. Install via https://rustup.rs to build the contract."
fi
if ! command -v cdm >/dev/null 2>&1; then
    echo "[setup] WARNING: cdm CLI not found. Install it before deploying — see README.md."
fi

cat <<'EOF'

[setup] Done.

To run with the on-chain leaderboard (the default):
  cdm init -n paseo                  # generate keypair (one-time)
  # fund the printed address at https://faucet.polkadot.io
  cdm account map -n paseo           # one-time Revive H160 mapping
  cdm build && cdm deploy -n paseo
  cdm install @example/leaderboard-playground -n paseo
  npm run dev

To run without deploying (localStorage fallback):
  See docs/modding.md → "Swap the backend → drop back to localStorage".

To swap the game:
  See docs/modding.md → "Swap the game" and src/games/types.ts.
EOF
