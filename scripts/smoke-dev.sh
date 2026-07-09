#!/usr/bin/env bash
set -euo pipefail

PORT=3000
URL="http://127.0.0.1:${PORT}"
LOG="$(mktemp)"
PID=""

is_windows_shell() {
  local uname
  uname=$(uname -s)
  [[ "$uname" == MINGW* || "$uname" == MSYS* || "$uname" == CYGWIN* ]]
}

kill_port_listeners() {
  if ! command -v netstat >/dev/null 2>&1; then
    return 0
  fi
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

# Use npm.cmd on Windows Git Bash to avoid the npm shell script's WSL
# detection, which can fail with "WSL 1 is not supported" in sanitized PATHs.
if is_windows_shell && command -v npm.cmd >/dev/null 2>&1; then
  DEV_CMD="npm.cmd run dev"
else
  DEV_CMD="npm run dev"
fi

echo "Starting dev server with: $DEV_CMD"
$DEV_CMD >"$LOG" 2>&1 &
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
