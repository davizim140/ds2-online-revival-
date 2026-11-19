# Xbox 360 protocol research — status and evidence

## Scope

Target: the original **Dark Souls II Xbox 360 release**, not Scholar of the First Sin on PC, Xbox One, or PS4.

The objective is to restore the original console game's online features through an independently operated service. This document records what is known and, importantly, what has not yet been verified.

## Confirmed facts

- FromSoftware states that the PS3 and Xbox 360 online services ended on **31 March 2024**.
- The discontinued features include asynchronous elements (shades/ghosts, bloodstains, and messages) and multiplayer (co-op, invasions, and duels).
- Offline play remains available.
- FromSoftware explicitly distinguishes the PS3/Xbox 360 services from the still-running PS4, Xbox One, and Windows DX9/DX11 services.

Primary source: https://www.fromsoftware.jp/ww/faq-games.html

## Related research — not yet transferable

The community project `TLeonardUK/ds3os` reconstructs online services for Dark Souls III and Scholar of the First Sin. Its protocol definitions and server implementation may help identify concepts and research methods, but they are **not proof of compatibility with the original Xbox 360 executable**.

Likewise, reports of the hostname `frpg2-steam64-ope-login.fromsoftware-game.net`, TCP port `50031`, protobuf messages, or PC server redirection refer to PC/SotFS research unless independently confirmed against the Xbox 360 build. Do not hardcode these values into the Xbox 360 plugin.

## Unknowns that block implementation

1. The exact login/bootstrap hostname and transport used by the Xbox 360 build.
2. Whether the console build uses the same application protocol as PC/SotFS or a platform-specific variant.
3. The role of Xbox Live services, title-specific middleware, certificates, and platform authentication.
4. Message schemas and request/response sequences for login, presence, world data, matchmaking, and peer sessions.
5. Whether the old service performed matchmaking only or also relayed any gameplay traffic.

No server endpoint, port, packet schema, or memory offset is considered verified for Xbox 360 at this stage.

## Evidence collection plan

1. Identify the exact game title ID, media/build version, and installed title update from the user's own console.
2. Capture the console's network traffic during a controlled launch and an online attempt, without changing the game executable or save.
3. Separate Xbox Live/platform traffic from game-service traffic using destination, timing, DNS, and connection metadata.
4. Record DNS names, destination IPs, TCP/UDP ports, TLS certificate metadata where visible, and connection failures. Do not publish account tokens, console identifiers, or other secrets.
5. Repeat only after confirming the same game build and network conditions.
6. Map observed traffic to client functions before writing hooks or a replacement server.

## Safety constraints

- Do not patch NAND, bootloaders, dashboard files, or the original game.
- Do not alter the original save.
- Do not redirect production traffic until the original endpoints and protocol are understood.
- Keep the plugin disabled during passive capture; a diagnostic plugin is not required to observe router-level traffic.
- Never claim that a login, session, or multiplayer feature works without a reproducible test using two consoles/accounts.

## Current milestone

**Research only.** The existing DashLaunch plugin is a loader/build diagnostic stub. It does not implement networking, authentication, protocol hooks, or a replacement service. The XDK-based XEX workflow remains blocked until a legitimate XDK toolchain is available; protocol research and documentation can proceed independently.
