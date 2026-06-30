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
