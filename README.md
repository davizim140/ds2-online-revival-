# DS2 Online Revival

Projeto de preservação comunitária para pesquisar e reconstruir serviços online de **Dark Souls II (Xbox 360)** em consoles Xbox 360 RGH.

> Estado: pesquisa e infraestrutura inicial. Ainda não existe um plugin XEX funcional nem compatibilidade online confirmada.

## Objetivo

Desenvolver um plugin carregado pelo DashLaunch e uma infraestrutura de servidor privado, começando por instrumentação segura e descoberta do protocolo usado pelo jogo.

Recursos pretendidos, sujeitos à viabilidade técnica:

- presença e descoberta de jogadores;
- mensagens, fantasmas e manchas de sangue;
- matchmaking e sessões cooperativas;
- invasões e duelos.

## Arquitetura planejada

- `plugin/` — plugin Xbox 360, compilado com xsdk;
- `server/` — serviços privados e APIs;
- `protocol/` — documentação dos formatos e fluxos de rede observados;
- `docs/` — pesquisa, compatibilidade e instalação;
- `tests/` — testes automatizados e validação de protocolo;
- `.github/workflows/` — CI no GitHub Actions.

## Princípios de segurança e desenvolvimento

1. Não modificar o executável nem os dados originais do jogo na primeira fase.
2. O plugin inicial deve apenas inicializar, registrar diagnóstico e sair sem interferir no jogo.
3. Não aplicar hooks, patches de memória ou redirecionamentos até identificar com evidência os pontos e APIs envolvidos.
4. Não simular sucesso de login, matchmaking ou sessão: cada recurso só será marcado como funcional após teste reproduzível.
5. Manter o plugin desativável pelo DashLaunch e documentar como removê-lo.

## Limitações conhecidas

A FromSoftware encerrou os serviços online das versões Xbox 360 e PS3 em 31 de março de 2024. Um plugin DashLaunch, por si só, não restaura esses serviços. Será necessário entender o protocolo do cliente e implementar serviços compatíveis. A autenticação Xbox Live e eventuais dependências de middleware proprietário são pontos de pesquisa separados.

## Próximos marcos

- [ ] Documentar a versão/build exata do jogo e dependências de rede.
- [ ] Preparar a estrutura de compilação xsdk no GitHub Actions.
- [ ] Criar um XEX mínimo de diagnóstico, sem hooks.
- [ ] Validar carregamento e desligamento seguro no RGH.
- [ ] Capturar e documentar o fluxo de conexão do jogo.
- [ ] Implementar o primeiro serviço privado após identificar o protocolo.

## Aviso

Projeto independente, não afiliado à FromSoftware, Bandai Namco ou Microsoft. Use apenas cópias legítimas do jogo e não compartilhe credenciais Xbox Live.