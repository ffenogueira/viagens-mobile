1- Nao temos pipeline de build de APK neste projeto.

2- O desenvolvimento e a compilacao do APK acontecem localmente no Mac, usando Android Studio/SDK, Java 21, Node 22 e Gradle local.

3- A VPS nao deve receber o projeto mobile completo, node_modules, android build, Gradle cache ou codigo-fonte para compilar APK. Ela deve receber apenas o arquivo APK pronto para download publico.

4- Fluxo correto:
- desenvolver localmente;
- testar no emulador ou aparelho fisico;
- gerar release local com `npm run build-apk`;
- publicar o APK pronto com `npm run publish-apk`.

5- O script `build-apk` nunca deve publicar automaticamente. O script `publish-apk` e separado para evitar subir APK sem querer durante testes locais.

6- Credenciais e caminhos de publicacao ficam em `.env.local`, que nao deve ser commitado.
