# Xbox 360 build identification

## Scope

This project targets the original Xbox 360 release of **Dark Souls II**, not Scholar of the First Sin and not another platform.

## Publicly listed Title ID

The Xbox 360 title databases consulted for this research list Dark Souls II as:

- **Title ID:** `465307E4`

This is a reference value, not proof of the exact installed package. The project must still record the value reported by the user's own Aurora installation before treating it as confirmed.

References:
- https://github.com/thiendalat/Xbox-360-Games-list/blob/main/xbox360_game-list-titleid.csv
- https://github.com/jnackmclain/Xbox360_presence/blob/main/xbox360titleids.json

## Media ID and executable identity

The Media ID is not inferred from the Title ID. Different releases/regions can share a Title ID while having different media identities. Do not guess a Media ID or use one copied from Scholar of the First Sin.

Record these values from the actual installed game/disc metadata when available:

| Field | Value |
|---|---|
| Game name shown by Aurora | Dark Souls II |
| Title ID | Pending local confirmation; public reference: `465307E4` |
| Media ID | Pending |
| Region / disc edition | Pending |
| Default.xex hash (SHA-256) | Pending |
| Title Update | User reports none / base game |

## Safe collection procedure

1. In Aurora, open the Dark Souls II game details and inspect the information/metadata panel.
2. Record the Title ID and Media ID exactly as displayed, if both are available.
3. If Aurora does not show Media ID, do not substitute a guessed value. The next safe source is metadata from the user's own game files, read-only.
4. Do not modify the game files, save, NAND, dashboard, or DashLaunch configuration to collect these values.
5. A photo of the Aurora details panel is sufficient for manual transcription.

## Why this is required

Before analyzing network behavior or matching executable code, the project must know which Xbox 360 build is being examined. A Title ID alone does not uniquely establish the media revision. All protocol findings must be tied to a recorded build identity.

## Current status

- [x] Public Title ID reference found.
- [ ] Confirm Title ID from the user's installed copy.
- [ ] Record Media ID from the user's own copy.
- [ ] Record executable hash and edition.
- [ ] Begin build-specific network analysis.
