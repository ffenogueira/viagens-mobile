#!/usr/bin/env bash
set -euo pipefail

SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
EMULATOR="$SDK_DIR/emulator/emulator"
AVD="${ANDROID_AVD:-Pixel}"

export PATH="$SDK_DIR/platform-tools:$SDK_DIR/emulator:$PATH"

if [[ ! -x "$EMULATOR" ]]; then
  echo "Emulador não encontrado em $EMULATOR"
  exit 1
fi

if "$EMULATOR" -list-avds | grep -qx "$AVD"; then
  echo "→ Iniciando emulador: $AVD"
  exec "$EMULATOR" -avd "$AVD"
fi

FIRST_AVD="$("$EMULATOR" -list-avds | head -n 1)"
if [[ -z "$FIRST_AVD" ]]; then
  echo "Nenhum AVD encontrado. Crie um em Android Studio → Device Manager → Create Device"
  exit 1
fi

echo "→ AVD '$AVD' não existe. Usando: $FIRST_AVD"
exec "$EMULATOR" -avd "$FIRST_AVD"
