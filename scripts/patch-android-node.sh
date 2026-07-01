#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
NODE_WRAPPER="$ANDROID_DIR/node"
LOCAL_PROPS="$ANDROID_DIR/local.properties"
GRADLEW="$ANDROID_DIR/gradlew"
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"

if [[ ! -d "$ANDROID_DIR" ]]; then
  echo "Pasta android/ não existe. Rode: npm run android:setup"
  exit 1
fi

cp "$ROOT_DIR/scripts/android-node" "$NODE_WRAPPER"
chmod +x "$NODE_WRAPPER"

NODE_PATH="$("$NODE_WRAPPER" -e "console.log(process.execPath)")"
echo "→ Node: $NODE_PATH"

mkdir -p "$ANDROID_DIR"
touch "$LOCAL_PROPS"

upsert_prop() {
  local key="$1"
  local value="$2"
  local file="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

upsert_prop "sdk.dir" "$SDK_DIR" "$LOCAL_PROPS"
upsert_prop "node.dir" "$NODE_PATH" "$LOCAL_PROPS"

if ! grep -q "viagens-node-path:start" "$GRADLEW"; then
  perl -0pi -e 's/APP_HOME=\$\( cd -P "\$\{APP_HOME:-\.\/\}" > \/dev\/null && printf '\''%s\\n'\'' "\$PWD" \) \|\| exit\n/APP_HOME=$( cd -P "${APP_HOME:-.\/}" > \/dev\/null && printf '\''%s\\n'\'' "$PWD" ) || exit\n\n# viagens-node-path:start\nif [ -x "$APP_HOME\/node" ]; then\n  PATH="$APP_HOME:$PATH"\n  export PATH\nelif [ -f "$APP_HOME\/local.properties" ]; then\n  VIAGENS_NODE_DIR=$(grep '\''^node.dir='\'' "$APP_HOME\/local.properties" | cut -d= -f2- | xargs dirname 2>\/dev\/null)\n  if [ -n "$VIAGENS_NODE_DIR" ]; then\n    PATH="$VIAGENS_NODE_DIR:$PATH"\n    export PATH\n  fi\nfi\n# viagens-node-path:end\n\n/s' "$GRADLEW"
fi

SETTINGS="$ANDROID_DIR/settings.gradle"
APP_BUILD="$ANDROID_DIR/app/build.gradle"

if ! grep -q "viagensNodeBinary" "$SETTINGS"; then
  perl -0pi -e 's/pluginManagement \{\n  def reactNativeGradlePlugin/pluginManagement {\n  def viagensNodeBinary = {\n    def localProps = new Properties()\n    def localPropsFile = new File(settingsDir, "local.properties")\n    if (localPropsFile.exists()) {\n      localPropsFile.withInputStream { localProps.load(it) }\n    }\n    def fromLocal = localProps.getProperty("node.dir")\n    if (fromLocal != null && new File(fromLocal).canExecute()) {\n      return fromLocal\n    }\n    def wrapper = new File(settingsDir, "node")\n    if (wrapper.canExecute()) {\n      return wrapper.absolutePath\n    }\n    def fromEnv = System.getenv("NODE_BINARY")\n    if (fromEnv != null && new File(fromEnv).canExecute()) {\n      return fromEnv\n    }\n    return "node"\n  }.call()\n\n  def reactNativeGradlePlugin/s' "$SETTINGS"
  perl -0pi -e 's/commandLine\("node",/commandLine(viagensNodeBinary,/g' "$SETTINGS"
fi

if ! grep -q "viagensNodeBinary" "$APP_BUILD"; then
  RESOLVER='def viagensResolveNodeBinary = {
  def localProps = new Properties()
  def localPropsFile = new File(rootDir, "local.properties")
  if (localPropsFile.exists()) {
    localPropsFile.withInputStream { localProps.load(it) }
  }
  def fromLocal = localProps.getProperty("node.dir")
  if (fromLocal != null && new File(fromLocal).canExecute()) {
    return fromLocal
  }
  def wrapper = new File(rootDir, "node")
  if (wrapper.canExecute()) {
    return wrapper.absolutePath
  }
  def fromEnv = System.getenv("NODE_BINARY")
  if (fromEnv != null && new File(fromEnv).canExecute()) {
    return fromEnv
  }
  return "node"
}
def viagensNodeBinary = viagensResolveNodeBinary()
'
  tmp="$(mktemp)"
  head -n 5 "$APP_BUILD" > "$tmp"
  printf '%s\n' "$RESOLVER" >> "$tmp"
  tail -n +6 "$APP_BUILD" >> "$tmp"
  mv "$tmp" "$APP_BUILD"
  sed -i '' 's/\["node",/[viagensNodeBinary,/g' "$APP_BUILD"
fi

bash "$ROOT_DIR/scripts/patch-expo-path-spaces.sh"

rm -rf "$ROOT_DIR/android/.cxx" "$ROOT_DIR/android/app/.cxx" \
  "$ROOT_DIR/node_modules/expo/node_modules/expo-modules-core/android/.cxx" 2>/dev/null || true

echo "→ Patches Android aplicados. Sincronize de novo no Android Studio."
