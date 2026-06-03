#!/usr/bin/env bash
# serve.sh - start the Soup House website + Keystatic editor.
#
#   ./serve.sh
#
# Handles the Node version, installs dependencies the first time, and starts
# the server over HTTPS so the Keystatic editor works from other machines on
# the network too. Press Ctrl+C to stop.

set -euo pipefail

# Always run from the repo root (this script's own folder).
cd "$(dirname "$0")"

PORT=4321

# --- Node 22 (Astro 6 needs it). Use nvm if it's installed. ---
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use 22 >/dev/null 2>&1 || nvm install 22
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed. Install Node 22 from https://nodejs.org and run this again."
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "This needs Node 22 or newer (found $(node -v))."
  echo "Install Node 22 (https://nodejs.org) or, if you have nvm: nvm install 22"
  exit 1
fi

# --- Install dependencies on the first run. ---
if [ ! -d node_modules ]; then
  echo "First run: installing dependencies (this takes a minute)..."
  npm install
fi

# --- Print the addresses and write them to logs/server.log. ---
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')" || true
mkdir -p logs

{
  echo "Soup House site - addresses:"
  echo "  Local site:     https://localhost:${PORT}/"
  echo "  Local editor:   https://localhost:${PORT}/keystatic"
  if [ -n "${LAN_IP:-}" ]; then
    echo "  Network site:   https://${LAN_IP}:${PORT}/"
    echo "  Network editor: https://${LAN_IP}:${PORT}/keystatic"
  fi
  echo
  echo "  The browser warns about a self-signed certificate the first time -"
  echo "  that's expected for local use. Click 'Advanced' then 'Proceed'."
  echo "  (If port ${PORT} is busy, Astro uses the next one - see the URL below.)"
  echo
  echo "  Press Ctrl+C to stop the server."
  echo
} | tee logs/server.log

# Run the server; mirror its output into the same log so the addresses
# and server messages are all captured in logs/server.log.
npm run dev -- --host 0.0.0.0 2>&1 | tee -a logs/server.log
