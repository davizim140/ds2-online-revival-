# DS2 Online Revival

Projeto independente de preservação comunitária para pesquisar e reconstruir serviços online de **Dark Souls II (Xbox 360)** em consoles Xbox 360 RGH.

> Estado atual: infraestrutura inicial criada. O código presente é somente um plugin de diagnóstico para validar a cadeia de compilação e o carregamento pelo DashLaunch. Não restaura o online, não faz hooks e não confirma compatibilidade de rede.

## Objetivo

Desenvolver um plugin DashLaunch e serviços privados compatíveis com o protocolo efetivamente utilizado pelo jogo. Recursos pretendidos, sujeitos à viabilidade técnica:

- presença e descoberta de jogadores;
- mensagens, fantasmas e manchas de sangue;
- matchmaking e sessões cooperativas;
- invasões e duelos.

## Estrutura

- `plugin/` — código C++ do plugin Xbox 360.
- `server/` — futuros serviços privados e APIs.
- `protocol/` — documentação dos formatos e fluxos observados.
- `docs/` — pesquisa, compatibilidade e instalação.
- `tests/` — testes automatizados.
- `.github/workflows/build.yml` — compilação Windows com o XDK no GitHub Actions.
- `build_plugin.bat` — compilação PowerPC, linkagem da DLL e empacotamento XEX.
- `xex.xml` — configuração DashLaunch com `<sysdll/>`.

## Compilação no GitHub Actions

O workflow usa os binários do XDK oficial, sem exigir a instalação completa do Visual Studio no runner.

### Secrets necessários

Configure estes dois secrets no repositório:

- `XDK_ARCHIVE_URL`: URL HTTPS de download do ZIP privado.
- `XDK_ARCHIVE_TOKEN`: token de acesso aceito pelo serviço que hospeda o ZIP.

O ZIP deve conter, na raiz ou dentro de uma única pasta superior:

- `bin/win32/` — diretório completo, incluindo `cl.exe`, `link.exe`, `imagexex.exe` e suas DLLs auxiliares;
- `include/xbox/` — headers do XDK;
- `lib/xbox/` — bibliotecas do XDK.

O workflow espera autenticação HTTP Bearer no download. O ZIP não deve ser commitado no repositório.

### Dependência xkelib

O script de linkagem inclui `xkelib.lib`. Essa biblioteca **não faz parte do XDK padrão** e precisa ser fornecida separadamente em:

```
third_party/xkelib/
├── include/
└── lib/
    └── xkelib.lib
```

Não foi incluída uma biblioteca fictícia. Sem o arquivo real, o workflow interrompe a compilação com erro explícito.

### Executar

No GitHub: **Actions → DS2 Online Revival - XDK plugin build → Run workflow**.

O resultado esperado, após fornecer todas as dependências, é o artifact `DS2OnlineRevival-XEX`. Um artifact não será publicado se compilação, linkagem ou empacotamento falharem.

## Princípios de segurança

1. Não modificar o executável nem os dados originais do jogo na primeira fase.
2. O plugin inicial apenas registra diagnóstico.
3. Não aplicar hooks, patches de memória ou redirecionamentos antes de identificar com evidência os pontos e APIs envolvidos.
4. Não simular sucesso de login, matchmaking ou sessão.
5. Manter o plugin desativável pelo DashLaunch e documentar como removê-lo.

## Limitações conhecidas

A FromSoftware encerrou os serviços online das versões Xbox 360 e PS3 em 31 de março de 2024. Um plugin DashLaunch, por si só, não restaura esses serviços. Será necessário entender o protocolo do cliente e implementar serviços compatíveis. A autenticação Xbox Live e eventuais dependências de middleware proprietário são pontos de pesquisa separados.

## Próximos marcos

- [ ] Fornecer o ZIP privado do XDK e configurar os secrets.
- [ ] Fornecer a biblioteca xkelib real.
- [ ] Obter um build XEX verificável no Actions.
- [ ] Validar carregamento e desligamento seguro no RGH.
- [ ] Capturar e documentar o fluxo de conexão do jogo.
- [ ] Implementar o primeiro serviço privado após identificar o protocolo.

## Aviso

Projeto independente, não afiliado à FromSoftware, Bandai Namco ou Microsoft. Use apenas cópias legítimas do jogo e não compartilhe credenciais Xbox Live.
