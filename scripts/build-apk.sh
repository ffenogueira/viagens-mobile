#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

APK_NAME="viagens-by-up-your-idea-public-preview.apk"

JAVA_21_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
JAVA_DEFAULT_HOME="/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home"

cd "$ROOT_DIR"

echo "→ Projeto: $ROOT_DIR"

if [[ -d "$JAVA_21_HOME" ]]; then
  export JAVA_HOME="$JAVA_21_HOME"
elif [[ -d "$JAVA_DEFAULT_HOME" ]]; then
  export JAVA_HOME="$JAVA_DEFAULT_HOME"
fi

if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  unset npm_config_prefix
  . "$NVM_DIR/nvm.sh"
  nvm use 22 >/dev/null
fi

export CI=1
export NODE_BINARY="${NODE_BINARY:-$(command -v node)}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

echo "→ Node: $NODE_BINARY"
node --version

echo "→ Java:"
java -version

echo ""
echo "→ Typecheck..."
npm run typecheck

echo ""
echo "→ Gerando/sincronizando projeto Android..."
npx expo prebuild --platform android

echo ""
echo "→ Aplicando patches locais Android..."
[[ -f "$ROOT_DIR/scripts/patch-android-node.sh" ]] && bash "$ROOT_DIR/scripts/patch-android-node.sh"
[[ -f "$ROOT_DIR/scripts/patch-expo-path-spaces.sh" ]] && bash "$ROOT_DIR/scripts/patch-expo-path-spaces.sh"

GRADLE_WRAPPER="$ROOT_DIR/android/gradle/wrapper/gradle-wrapper.properties"
if [[ -f "$GRADLE_WRAPPER" ]]; then
  sed -i '' 's|gradle-9\.[0-9.]*-bin\.zip|gradle-8.14.3-bin.zip|g' "$GRADLE_WRAPPER"
fi

echo ""
echo "→ Parando Gradle daemons antigos..."
(
  cd "$ROOT_DIR/android"
  ./gradlew --stop || true
)

echo ""
echo "→ Gerando APK release local..."
(
  cd "$ROOT_DIR/android"
  ./gradlew assembleRelease --no-daemon --stacktrace
)

echo ""
echo "→ Copiando APK..."
cp "$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk" "$ROOT_DIR/$APK_NAME"
ls -lh "$ROOT_DIR/$APK_NAME"

echo ""
echo "✅ Build local concluído."
echo ""
echo "Arquivo local:"
echo "$ROOT_DIR/$APK_NAME"
echo ""
echo "Para publicar:"
echo "npm run publish-apk"
