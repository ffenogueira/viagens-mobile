#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"

echo "→ SDK Android: $SDK_DIR"

if [[ ! -d "$SDK_DIR" ]]; then
  echo "SDK não encontrado. Abra o Android Studio → Settings → Languages & Frameworks → Android SDK"
  exit 1
fi

mkdir -p "$ROOT_DIR/android"
cat > "$ROOT_DIR/android/local.properties" <<EOF
sdk.dir=$SDK_DIR
EOF

echo "→ local.properties atualizado"

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$SDK_DIR/platform-tools:$SDK_DIR/emulator:$PATH"

cd "$ROOT_DIR"
npm install
npx expo prebuild --platform android
bash "$ROOT_DIR/scripts/patch-android-node.sh"
bash "$ROOT_DIR/scripts/patch-expo-path-spaces.sh"

echo ""
echo "Pronto. Próximos passos:"
echo "  1. Abra um emulador: npm run android:emulator"
echo "  2. Rode o app:       npm run android"
echo "  3. Ou no Studio:     npm run android:studio  (depois clique Run ▶)"
