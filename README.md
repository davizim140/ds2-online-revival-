# DS2 Online Revival

Projeto independente para pesquisar e reconstruir serviços online de **Dark Souls II (Xbox 360)** em consoles Xbox 360 RGH.

> Estado atual: pesquisa e infraestrutura inicial. O plugin presente é somente um stub de diagnóstico para validar compilação/carregamento pelo DashLaunch. Ainda não restaura o online, não possui hooks de rede e não confirma compatibilidade de protocolo.

## Objetivo

Reconstruir, com base no protocolo realmente utilizado pelo jogo de Xbox 360, os serviços de presença, mensagens, fantasmas/manchas de sangue, matchmaking, cooperação, invasões e duelos.

## Pesquisa de protocolo

Leia primeiro [Xbox 360 protocol research](docs/XBOX360_PROTOCOL_RESEARCH.md). Ele separa fatos confirmados de hipóteses e referências de outras versões.

**Importante:** projetos de servidor para PC/Scholar of the First Sin não provam compatibilidade com o executável original de Xbox 360. Hostnames, portas, formatos e offsets encontrados em pesquisas de PC não serão reutilizados no plugin sem confirmação por captura/análise da versão de Xbox 360.

## Estrutura

- `plugin/` — código C++ do plugin Xbox 360.
- `server/` — futuros serviços privados.
- `protocol/` — documentação de formatos e fluxos observados.
- `docs/` — pesquisa, compatibilidade e instalação.
- `tests/` — testes automatizados.
- `.github/workflows/build.yml` — compilação Windows com XDK no GitHub Actions.
- `build_plugin.bat` — compilação PowerPC, linkagem e empacotamento XEX.
- `xex.xml` — configuração XEXDLL com `<sysdll/>`.

## Compilação do plugin

O workflow de XEX usa ferramentas do XDK oficial. **No momento, essa etapa está bloqueada**, porque o projeto não tem uma cópia legítima do XDK nem um cache previamente abastecido. O workflow atual espera os secrets `XDK_ARCHIVE_URL` e `XDK_ARCHIVE_TOKEN` para baixar um arquivo privado autorizado.

Não é necessário configurar esses secrets para avançar na pesquisa de protocolo. Não há XEX compilado/verificado disponível neste estágio.

## Princípios de segurança

1. Não modificar o executável nem os dados originais do jogo na primeira fase.
2. Não aplicar hooks, patches de memória ou redirecionamentos sem identificar os pontos e APIs envolvidos.
3. Não simular sucesso de login, matchmaking ou sessão.
4. Manter o plugin desativável pelo DashLaunch e documentar sua remoção.
5. Não compartilhar tokens Xbox Live, identificadores de console ou dados privados de captura.

## Limitações conhecidas

Os serviços online oficiais das versões Xbox 360 e PS3 foram encerrados em 31 de março de 2024. Um plugin DashLaunch sozinho não restaura esses serviços. Será necessário entender o protocolo do cliente e implementar serviços compatíveis. Autenticação Xbox Live e dependências de middleware proprietário são questões separadas.

## Marcos

- [x] Registrar o escopo e as lacunas da pesquisa de protocolo Xbox 360.
- [ ] Identificar a versão exata do jogo e do Title Update.
- [ ] Capturar o fluxo de rede do jogo em uma tentativa controlada.
- [ ] Identificar o bootstrap/login e o protocolo real do cliente Xbox 360.
- [ ] Implementar e testar o primeiro serviço privado.
- [ ] Retomar a compilação do plugin quando houver toolchain XDK legítima disponível.
- [ ] Validar carregamento e desligamento seguro no RGH.

## Aviso

Projeto independente, não afiliado à FromSoftware, Bandai Namco ou Microsoft. Use cópias legítimas do jogo e não compartilhe credenciais Xbox Live.
