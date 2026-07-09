#!/usr/bin/env bash
set -euo pipefail

IMAGE=fincal
CONTAINER=fincal-smoke
VOLUME=fincal-smoke-data
PORT=3000
URL="http://127.0.0.1:${PORT}"
BUILD_LOG="$(mktemp)"
RUN_LOG="$(mktemp)"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker volume rm "$VOLUME" >/dev/null 2>&1 || true
  rm -f "$BUILD_LOG" "$RUN_LOG"
}
trap cleanup EXIT

echo "Building Docker image..."
docker build -t "$IMAGE" . >"$BUILD_LOG" 2>&1

echo "Running container..."
docker volume create "$VOLUME" >/dev/null
docker run -d \
  --name "$CONTAINER" \
  -p "$PORT:3000" \
  -e DATABASE_URL="file:/data/fincal.db" \
  -e AUTH_SECRET="smoke-secret" \
  -e AUTH_TRUST_HOST="true" \
  -e OPENAI_API_KEY="" \
  -e OPENAI_MODEL="gpt-4o-mini" \
  -v "$VOLUME:/data" \
  "$IMAGE" >"$RUN_LOG" 2>&1

for _ in $(seq 1 90); do
  if curl -fs --max-time 2 "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fs --max-time 2 "$URL" >/dev/null 2>&1; then
  echo "Container failed to respond on $URL" >&2
  docker logs "$CONTAINER" >&2 || true
  exit 1
fi

RESPONSE=$(curl -fs --max-time 5 "$URL")
if ! grep -q "FinCal DB OK" <<<"$RESPONSE"; then
  echo "Seeded DB value not found in page response:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

docker logs "$CONTAINER" > docker-smoke.log 2>&1 || true
echo "$RESPONSE"
echo "smoke-docker OK"
