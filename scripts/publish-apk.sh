#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
APK_NAME="${APK_NAME:-viagens-by-up-your-idea-public-preview.apk}"
APK_PATH="$ROOT_DIR/$APK_NAME"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  . "$ENV_FILE"
  set +a
fi

: "${APK_SSH_HOST:?Defina APK_SSH_HOST no .env.local}"
: "${APK_SSH_USER:?Defina APK_SSH_USER no .env.local}"
: "${APK_REMOTE_PATH:?Defina APK_REMOTE_PATH no .env.local}"

APK_SSH_PORT="${APK_SSH_PORT:-22}"
APK_PUBLIC_URL="${APK_PUBLIC_URL:-}"

if [[ ! -f "$APK_PATH" ]]; then
  echo "APK nao encontrado: $APK_PATH"
  echo "Rode antes: npm run build-apk"
  exit 1
fi

echo "→ Publicando APK pronto..."
echo "Origem: $APK_PATH"
echo "Destino: $APK_SSH_USER@$APK_SSH_HOST:$APK_REMOTE_PATH/"

ssh -p "$APK_SSH_PORT" "$APK_SSH_USER@$APK_SSH_HOST" "mkdir -p '$APK_REMOTE_PATH'"

scp -P "$APK_SSH_PORT" \
  "$APK_PATH" \
  "$APK_SSH_USER@$APK_SSH_HOST:$APK_REMOTE_PATH/"

echo ""
echo "✅ APK publicado."

if [[ -n "$APK_PUBLIC_URL" ]]; then
  echo "Download:"
  echo "$APK_PUBLIC_URL"
fi
