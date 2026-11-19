# DS2 Online Revival

Projeto independente para pesquisar e reconstruir serviços online de **Dark Souls II (Xbox 360)** em consoles Xbox 360 RGH.

> Estado atual: pesquisa e infraestrutura inicial. O plugin presente é somente um stub de diagnóstico para validar compilação/carregamento pelo DashLaunch. Ainda não restaura o online, não possui hooks de rede e não confirma compatibilidade de protocolo.

## Objetivo

Reconstruir, com base no protocolo realmente utilizado pelo jogo de Xbox 360, os serviços de presença, mensagens, fantasmas/manchas de sangue, matchmaking, cooperação, invasões e duelos.

## Pesquisa e arquitetura

- [Xbox 360 protocol research](docs/XBOX360_PROTOCOL_RESEARCH.md) — fatos confirmados e lacunas.
- [Build identification](docs/BUILD_IDENTIFICATION.md) — identidade da cópia Xbox 360.
- [Service architecture](docs/SERVICE_ARCHITECTURE.md) — componentes e critérios para cada recurso.
- [Protocol evidence workspace](protocol/README.md) — regras e modelo para registrar capturas.\n- [Passive capture procedure](docs/CAPTURE_PROCEDURE.md) — sequência de captura sem alterar o console ou os arquivos do jogo.

A arquitetura é condicionada a evidências: nenhum endpoint, porta ou formato de pacote será inventado.

**Importante:** projetos de servidor para PC/Scholar of the First Sin não provam compatibilidade com o executável original de Xbox 360. Hostnames, portas, formatos e offsets encontrados em pesquisas de PC não serão reutilizados no plugin sem confirmação por captura/análise da versão de Xbox 360.

## Estrutura

- `plugin/` — código C++ do plugin Xbox 360.
- `server/message-store.mjs` — modelo interno para publicação, consulta, avaliação e expiração de mensagens; ainda não é uma API compatível com o protocolo do jogo.
- `server/message-api.mjs` — API HTTP local de desenvolvimento, limitada a loopback quando iniciada por `listenLocal`; não é o protocolo do Xbox 360.
- `server/message-store.test.mjs` — testes automatizados do modelo de mensagens.
- `server/message-api.test.mjs` — testes HTTP de saúde, publicação, consulta, avaliação, JSON inválido e rota inexistente.
- `.github/workflows/server-tests.yml` — CI independente do XDK para executar os testes Node.js.
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
- [x] Definir arquitetura dos serviços por funcionalidade, condicionada a evidências.
- [x] Criar modelo para registrar observações de rede sem publicar segredos.
- [ ] Identificar a versão exata do jogo e do Title Update.
- [x] Documentar procedimento seguro e modelo de metadados para captura passiva.\n- [ ] Capturar o fluxo de rede do jogo em uma tentativa controlada.
- [ ] Identificar o bootstrap/login e o protocolo real do cliente Xbox 360.
- [x] Criar e cobrir com testes o modelo interno de mensagens (não conectado ao cliente Xbox 360).
- [x] Criar API HTTP local de desenvolvimento e testes de integração (não conectada ao cliente Xbox 360).\n- [x] Persistir o modelo de mensagens localmente em JSON para sobreviver a reinicializações do processo.\n- [x] Ligar a API local ao armazenamento persistente e testar a recuperação após reinicialização.
- [ ] Implementar o adaptador de protocolo Xbox 360 após obter evidências reproduzíveis.
- [ ] Integrar o primeiro serviço privado ao protocolo confirmado.
- [ ] Retomar a compilação do plugin quando houver toolchain XDK legítima disponível.
- [ ] Validar carregamento e desligamento seguro no RGH.

## Aviso

Projeto independente, não afiliado à FromSoftware, Bandai Namco ou Microsoft. Use cópias legítimas do jogo e não compartilhe credenciais Xbox Live.
