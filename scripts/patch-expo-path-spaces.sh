#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_GRADLE="$ROOT_DIR/node_modules/expo/node_modules/expo-modules-core/android/build.gradle"

if [[ ! -f "$BUILD_GRADLE" ]]; then
  echo "expo-modules-core não encontrado. Rode npm install primeiro."
  exit 1
fi

if grep -q 'Skipping generateStubPCH because the project path contains spaces' "$BUILD_GRADLE"; then
  echo "→ Patch de caminhos com espaço já aplicado em expo-modules-core"
  exit 0
fi

perl -0pi -e 's/doLast \{\n    if \(!cxxDir\.exists\(\)\)/doLast {\n    if (project.projectDir.absolutePath.contains(" ")) {\n      logger.lifecycle("Skipping generateStubPCH because the project path contains spaces.")\n      return\n    }\n\n    if (!cxxDir.exists())/s' "$BUILD_GRADLE"

echo "→ Patch aplicado: sync do Android Studio ignora PCH quando o caminho tem espaços"
