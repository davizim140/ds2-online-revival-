# Opções para capturar o tráfego do Xbox 360

Este documento compara formas de observar o tráfego de rede do Xbox 360 durante uma tentativa normal de conexão do Dark Souls II original.

## Opção A — Captura integrada no roteador

É a opção mais simples quando o roteador oferece captura de pacotes (PCAP) ou diagnóstico de tráfego por dispositivo.

1. Abra a interface administrativa do roteador.
2. Procure uma função documentada de captura de pacotes ou diagnóstico de rede.
3. Selecione somente o Xbox 360 como origem, quando houver esse filtro.
4. Inicie a captura, faça uma única tentativa de conexão no jogo e encerre a captura.
5. Mantenha o PCAP privado. Extraia apenas os metadados descritos em `CAPTURE_PROCEDURE.md`.

Nem todo roteador oferece essa função. Não presuma que uma tela de estatísticas ou lista de dispositivos seja uma captura de pacotes.

## Opção B — Switch gerenciável com espelhamento de porta

Use esta opção se a rede já tiver um switch gerenciável que ofereça port mirroring/SPAN.

1. Conecte o Xbox 360 a uma porta do switch.
2. Configure o espelhamento da porta do console para uma porta de destino.
3. Conecte um computador de captura à porta de destino.
4. Capture somente durante a sessão controlada descrita no procedimento principal.

A configuração exata depende do fabricante e do modelo do switch. Não altere portas de uplink ou configurações de rede sem entender a topologia existente.

## Opção C — Captura no computador que compartilha a conexão

Pode funcionar quando o computador já atua como gateway ou ponto de acesso para o console e consegue observar o tráfego encaminhado. Uma captura comum na interface Wi-Fi de um computador conectado à mesma rede normalmente não garante visibilidade do tráfego unicast entre o Xbox 360 e o roteador.

Não mude a topologia da rede apenas para tentar esta opção. Prefira A ou B se já estiverem disponíveis.

## O que não é necessário

- Instalar software ou executar homebrew no Xbox 360.
- Alterar DNS, proxy ou certificados.
- Usar VPN ou descriptografia TLS.
- Interceptar ou modificar pacotes.
- Compartilhar o PCAP bruto no GitHub.

## Escolha da opção

Antes de orientar uma configuração específica, basta saber o fabricante e o modelo do roteador ou se já existe um switch gerenciável na rede. Não envie senha, endereço público, MAC, XUID ou outros identificadores.

## Resultado esperado

Uma captura útil deve permitir correlacionar uma ação do jogo com consultas DNS e conexões de rede observáveis. Uma tentativa de conexão que falha após o encerramento dos serviços oficiais não revela, por si só, o protocolo antigo. Não serão definidos hostnames, portas ou formatos de pacote sem evidência real.
