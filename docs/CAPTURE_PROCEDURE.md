# Xbox 360 passive network capture procedure

This procedure collects evidence only. It does not modify the game, save, NAND, dashboard, or console configuration.

## Current scope

- Target: original Dark Souls II for Xbox 360.
- The user reports the base game with no Title Update.
- Official online services are discontinued. A failed connection is expected and does not, by itself, reveal the old application protocol.
- The repository currently has no Xbox 360 packet capture. Do not label a guessed hostname, port, or packet format as observed.

## Capture point

Use a router/firewall feature that can capture traffic for the Xbox 360, or mirror the console's switch port to a separate capture computer. The capture device must observe the console's traffic without becoming a man-in-the-middle.

Do not:
- install unsigned network tools on the console;
- change DNS, proxy, certificates, or game files;
- publish a full PCAP in this public repository;
- capture or share other players' traffic;
- share Xbox Live credentials, tokens, XUIDs, console serials, or private IP/MAC identifiers.

If the router cannot isolate the console's traffic, do not upload the resulting capture. Keep it local and extract only the metadata needed for the evidence log.

## Repeatable session sequence

For each session, record a unique capture ID and local time:

1. Start capture before powering on or connecting the console.
2. Record the console's game build identity if already known. Do not guess missing Media ID values.
3. Launch Dark Souls II and wait at the title/menu screen for about 60 seconds.
4. Perform one clearly recorded action: select the online-related menu option or allow the game's normal connection attempt.
5. Wait until the game reports an outcome or times out; record the exact visible outcome in neutral language.
6. Return to the menu and stop capture.
7. Repeat once only if the first capture is incomplete. Keep the two sessions separate.

Do not combine launch traffic and an online-menu attempt into one vague event. The action and timestamp are needed to correlate traffic.

## Metadata to extract

From the capture, record only:
- DNS query name and response (if visible);
- destination IP and port, transport (TCP/UDP), and connection start/end times;
- TLS SNI and certificate subject/issuer/fingerprint only when visible without decryption;
- whether the connection succeeded, reset, timed out, or was refused;
- which in-game action was occurring at that time.

A destination IP alone is not proof of a game service. Xbox Live/platform traffic must be distinguished from title-specific traffic through repeatable timing and DNS/connection evidence.

## Evidence labels

- `observed`: directly visible in a capture from this Xbox 360 client.
- `correlated`: timing matches an action, but service purpose is not proven.
- `hypothesis`: interpretation only.
- `rejected`: repeated evidence shows the proposed interpretation does not apply.

Never put credentials, raw packet payloads, account identifiers, console identifiers, or another player's IP in the CSV. Keep the original PCAP private and local; submit only redacted metadata.

## Current blocker

No actual Xbox 360 capture has been supplied or reviewed. Therefore this procedure does not establish any endpoint, port, handshake, protocol, or compatibility claim. The next protocol milestone begins only after a redacted observation from a real console capture is recorded.
