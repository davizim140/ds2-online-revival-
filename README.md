# DS2 Online Revival

Projeto independente para pesquisar e reconstruir serviços online de **Dark Souls II (Xbox 360)** em consoles Xbox 360 RGH.

> Estado atual: infraestrutura inicial. O plugin presente é somente diagnóstico para validar compilação e carregamento pelo DashLaunch. Ainda não restaura o online, não possui hooks e não confirma compatibilidade de rede.

## Objetivo

Reconstruir, com base no protocolo realmente utilizado pelo jogo, os serviços de presença, mensagens, fantasmas/manchas de sangue, matchmaking, cooperação, invasões e duelos.

## Estrutura

- `plugin/` — código C++ do plugin Xbox 360.
- `server/` — futuros serviços privados.
- `protocol/` — documentação de formatos e fluxos observados.
- `docs/` — pesquisa, compatibilidade e instalação.
- `tests/` — testes automatizados.
- `.github/workflows/build.yml` — compilação Windows com XDK no GitHub Actions.
- `build_plugin.bat` — compilação PowerPC, linkagem e empacotamento XEX.
- `xex.xml` — configuração XEXDLL com `<sysdll/>`.

## Compilação no GitHub Actions

O workflow usa os binários do XDK oficial, sem exigir Visual Studio completo no runner.

Configure estes secrets no repositório:

- `XDK_ARCHIVE_URL`: URL HTTPS do ZIP privado do XDK.
- `XDK_ARCHIVE_TOKEN`: token Bearer aceito pelo serviço de hospedagem.

O ZIP deve conter:

- `bin/win32/` — diretório completo, com `cl.exe`, `link.exe`, `imagexex.exe` e DLLs auxiliares;
- `include/xbox/` — headers;
- `lib/xbox/` — bibliotecas.

O projeto atualmente usa apenas bibliotecas padrão do XDK (`xapilib.lib` e `xboxkrnl.lib`). A dependência xkelib foi removida porque o plugin diagnóstico atual não chama funções dela.

Depois de configurar os secrets, execute **Actions → DS2 Online Revival - XDK plugin build → Run workflow**. O artifact `DS2OnlineRevival-XEX` só será publicado se compilação, linkagem e empacotamento passarem.

## Princípios de segurança

1. Não modificar o executável nem os dados originais do jogo na primeira fase.
2. Não aplicar hooks, patches de memória ou redirecionamentos sem identificar os pontos e APIs envolvidos.
3. Não simular sucesso de login, matchmaking ou sessão.
4. Manter o plugin desativável pelo DashLaunch e documentar sua remoção.

## Limitações conhecidas

Os serviços online oficiais das versões Xbox 360 e PS3 foram encerrados em 31 de março de 2024. Um plugin DashLaunch sozinho não restaura esses serviços. Será necessário entender o protocolo do cliente e implementar serviços compatíveis. Autenticação Xbox Live e dependências de middleware proprietário são questões separadas.

## Marcos

- [ ] Configurar o ZIP privado do XDK e os dois secrets.
- [ ] Obter um XEX verificável no Actions.
- [ ] Validar carregamento e desligamento seguro no RGH.
- [ ] Capturar e documentar o fluxo de conexão do jogo.
- [ ] Implementar o primeiro serviço privado com protocolo identificado.

## Aviso

Projeto independente, não afiliado à FromSoftware, Bandai Namco ou Microsoft. Use cópias legítimas do jogo e não compartilhe credenciais Xbox Live.
