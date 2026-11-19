# Protocol evidence workspace

Only record observations from the original Dark Souls II Xbox 360 client. Keep PC/SotFS and other platform observations in separate documents.

## Capture record template

Copy `observations-template.csv` for each capture session. Record metadata, not secrets.

Required context:
- Game build / Title ID / Media ID if known.
- Title Update state (user reports base game / no TU).
- Console network topology and capture point.
- Exact action performed in game and local timestamp.
- Whether Xbox Live sign-in succeeded independently.

Record DNS names, destination IPs, ports, transport, connection timing, TLS metadata where visible, and outcome. Do not store authorization headers, session tokens, console serials, XUIDs, IPs of other players, or packet payloads containing credentials in shared repository files.

## Evidence labels

- `observed`: directly visible in a capture from the target Xbox 360 client.
- `correlated`: timing suggests a relationship to an in-game action, but not yet proven.
- `hypothesis`: interpretation only; never use as a hardcoded implementation value.
- `rejected`: tested and shown not to apply to this build.

## Acceptance rule

A hostname, port, or message format becomes a project fact only after a repeatable capture is tied to a recorded Xbox 360 build and the observation is independently reviewed. A PC/SotFS source is background research, not Xbox 360 evidence.


## Automated CSV validation

The repository includes `server/protocol-observations.mjs`, a local validator for this CSV format. It checks required context fields, row width, timestamp parsing, evidence labels, destination port range, and TCP/UDP transport values.

Run the checks with Node.js 22:

```sh
node --test server/*.test.mjs
```

The validator does not create observations, infer server endpoints, or prove that a destination belongs to Dark Souls II. The template remains header-only until real console evidence is collected.
