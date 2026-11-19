# Replacement service architecture (Xbox 360 target)

## Status and rule

This is a design boundary, not a claim that the Xbox 360 wire protocol is known. No endpoint, port, packet format, cryptographic handshake, or game-memory offset is assumed. Implementations must be driven by observations from the original Xbox 360 client.

## Components

1. **Console integration**
   - Minimal DashLaunch module, loaded only when explicitly enabled.
   - Later, a narrowly scoped transport adapter may be considered after the client call path is identified.
   - No kernel patching, executable modification, or fabricated login response.
2. **Protocol compatibility gateway**
   - Accepts only the transport and framing proven by captures.
   - Performs version/build checks before handling requests.
   - Logs message type, timing, and result while redacting credentials and console identifiers.
3. **Identity and presence**
   - Maps a game session identity to an online presence record.
   - Must not impersonate Xbox Live or bypass platform authentication.
4. **Asynchronous world service**
   - Message publication/retrieval.
   - Shade/ghost sightings and bloodstain publication/retrieval.
   - Expiration, region/world filtering, and moderation are server policy decisions to validate against observed behavior.
5. **Multiplayer coordination**
   - Co-op sign placement and summon matching.
   - Invasion and duel candidate matching.
   - Session coordination is separate from gameplay transport; do not assume the server relays gameplay packets.
6. **Operations**
   - Private test environment, structured logs, rate limits, abuse controls, and health checks.
   - No production DNS redirection until the protocol and ownership of each endpoint are understood.

## Feature-to-service map

| Game feature | Candidate backend responsibility | Evidence required before implementation |
|---|---|---|
| Messages | Store, filter, retrieve, expire | Request/response framing, world/area identifiers, rating flow |
| Bloodstains | Store and retrieve replay metadata | Payload representation, eligibility and expiration rules |
| Shades/ghosts | Presence snapshots or event stream | Sampling cadence, identity privacy, region filters |
| Co-op | Sign listing and summon coordination | Sign registration, polling, eligibility, session handoff |
| Invasions | Candidate selection and session coordination | Trigger conditions, matchmaking filters, failure handling |
| Duels | Arena/duel candidate selection | Queue semantics, ranking/level filters, session handoff |

## Compatibility gates

A feature is not considered implemented until all gates pass:

- Captured request from the original Xbox 360 client is reproducible.
- Server response matches observed framing and required fields.
- Client accepts the response without a crash or false success state.
- A negative/error response is handled safely.
- The test is repeatable and its build identity is recorded.
- Multiplayer features are verified with two independently controlled clients.

## Out of scope

- Reusing PC/SotFS protocol values without Xbox 360 evidence.
- Replacing Xbox Live authentication or representing the project as an Xbox Live service.
- Claiming gameplay relay, matchmaking, or online restoration based only on a loaded plugin.


## Internal presence model (development only)

`server/presence-store.mjs` now provides an in-process presence registry with heartbeat refresh, world/area filtering, TTL expiry, removal, and capacity limits. Its `presenceKey` is an opaque internal key; it is not an Xbox Live XUID or a proven game identity field.

This model is not exposed to the Xbox 360 client and does not establish the game's real heartbeat interval, area identifiers, activity values, identity rules, or wire format. Those values must be mapped only after protocol evidence is collected. It is a domain-model building block, not a working online feature.
