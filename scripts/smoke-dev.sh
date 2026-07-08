#!/usr/bin/env bash
set -euo pipefail

PORT=3000
URL="http://127.0.0.1:${PORT}"
LOG="$(mktemp)"
PID=""

kill_port_listeners() {
  local pids
  pids=$(netstat -ano | grep ":${PORT}" | grep LISTENING | awk '{print $5}' | sort -u || true)
  for p in $pids; do
    taskkill //F //PID "$p" >/dev/null 2>&1 || true
  done
}

cleanup() {
  if [[ -n "$PID" ]]; then
    kill "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi
  kill_port_listeners
  rm -f "$LOG"
}
trap cleanup EXIT

echo "Starting dev server..."
npm run dev >"$LOG" 2>&1 &
PID=$!

for _ in $(seq 1 60); do
  if curl -fs --max-time 2 "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fs --max-time 2 "$URL" >/dev/null 2>&1; then
  echo "Dev server failed to start on $URL" >&2
  tail -n 50 "$LOG" >&2
  exit 1
fi

RESPONSE=$(curl -fs --max-time 5 "$URL")
if ! grep -q "FinCal DB OK" <<<"$RESPONSE"; then
  echo "Seeded DB value not found in page response:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

echo "$RESPONSE"
echo "smoke-dev OK"
