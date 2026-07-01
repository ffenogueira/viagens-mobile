# Viagens Mobile

App React Native nativo para o produto Viagens by Up Your Idea.

Esta base substitui a abordagem de APK via WebView/Capacitor para os fluxos em que mobile nativo importa: camera OCR, fotos, localizacao, notificacoes, armazenamento seguro de token e experiencia offline futura.

## Stack

- Expo
- React Native
- TypeScript
- API: `https://api-viagens.upyouridea.com.br/v1`

## Rodar localmente

```bash
npm install
npm run start
```

## Android Studio (emulador)

Pré-requisitos: Android Studio instalado com SDK + pelo menos um emulador (Device Manager).

```bash
cd viagens-mobile
npm run android:setup      # gera pasta android/ e local.properties
npm run android:emulator   # inicia emulador (AVD padrão: Pixel)
npm run android            # compila e instala no emulador
```

Abrir o projeto nativo no Android Studio:

```bash
npm run android:studio
```

No Studio: aguarde o Gradle Sync e clique em **Run ▶** com um emulador aberto.

Se o sync falhar com `command 'node'` ou `generateStubPCH` / `clang++`:

```bash
npm run android:patch-node
```

Isso configura Node (nvm) e contorna o bug do Expo com caminhos que têm espaço (`Up your idea`).

Depois no Android Studio: **File → Sync Project with Gradle Files** (ou ícone do elefante 🐘).

> **Importante:** com Expo, o Metro bundler precisa estar rodando para ver o JS atualizado.
> Em um terminal separado: `npm run start`
> Ou use `npm run android`, que já inicia o fluxo completo.

Variáveis úteis no `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Emulador diferente: `ANDROID_AVD=Medium_Phone_API_36.1 npm run android:emulator`

## Gerar APK

```bash
npm install
npx eas login
npm run build:apk
```

Para build local Android:

```bash
npm install
npm run prebuild:android
cd android
./gradlew assembleDebug
```

## Direcao do produto mobile

- `Viagem`: workspace vivo com destino, grupo, roteiro, checklist, gastos e fotos.
- `IA/OCR`: FEFAI contextual, camera de preco/recibo e check-in com consentimento.
- `Memorias`: album em qualidade original, busca visual, retrospectiva e passaporte digital.
- `Perfil`: preferencias, estilo de viagem e configuracoes de privacidade.
