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


## Importing Wireshark/TShark metadata

The repository includes `server/wireshark-import.mjs`. Export only selected packet metadata fields; do not export packet bytes or payloads.

Example TShark export (run against a capture kept locally):

```sh
tshark -r capture.pcapng -T fields -E header=y -E separator=/t -E quote=d -E occurrence=f \
  -e frame.time_epoch \
  -e dns.qry.name \
  -e ip.src -e ipv6.src -e ip.dst -e ipv6.dst \
  -e tcp.srcport -e udp.srcport -e tcp.dstport -e udp.dstport \
  -e tcp.stream -e udp.stream -e frame.number -e frame.len -e tcp.flags \
  -e tls.handshake.extensions_server_name > capture-fields.tsv
```

Then convert the metadata export to the project CSV. Supply the actual capture ID, action, and visible outcome; the importer deliberately refuses to invent these values.

PowerShell:

```powershell
$env:CAPTURE_ID = "your-capture-id"
$env:CAPTURE_ACTION = "exact action performed in the game"
$env:CAPTURE_OUTCOME = "exact result shown by the game"
Get-Content .\\capture-fields.tsv -Raw | node server/wireshark-import.mjs | Set-Content -Encoding utf8 .\\observations.csv
```

The importer converts TShark epoch timestamps to ISO 8601 UTC and maps DNS, destination IP, destination port, transport, and TLS SNI when present. It does not infer service ownership or protocol meaning. Review and redact the resulting CSV before committing it. The raw capture and TSV should remain private.


### Connection grouping

When available, the importer also records source IP/port, TShark's `tcp.stream` or `udp.stream` identifier, frame number, frame length, and TCP flags. The analyzer groups rows by capture ID + transport + stream ID and reports packet count, observed source/destination endpoints, flags, and first/last timestamps.

Stream IDs are assigned by Wireshark/TShark within one capture file. They are not game session IDs, player IDs, or proof of a Dark Souls II service. Do not compare stream IDs between different capture files. UDP stream grouping is only a capture-level flow grouping; it does not establish an application session.


### Correlation by in-game action

The capture analyzer now groups observed endpoints and transport streams by the exact action label supplied by the researcher (for example, `open-online-menu` or `attempt-coop`). Each group preserves its evidence labels, outcomes, observation count, and time range. A row is not automatically attributed to an action based on timing: the action and visible outcome must be entered from the actual capture session.

The output is a correlation aid, not protocol identification. A connection appearing during an action does not prove that it implements that feature. Compare repeated captures and a control capture (game idle / menu without selecting online) before assigning a service role.


### Comparing a control capture with an online-action capture

Use `server/capture-diff.mjs` to compare two sanitized CSV files. The baseline should be a control capture (for example, the game idle at the title screen); the comparison capture should record one exact action (for example, opening the online menu). The report lists destination metadata shared by both captures, newly present in the comparison, and absent from it.

The comparison intentionally ignores TShark stream IDs because they are local to each capture file. Newly present traffic is not automatically Dark Souls II traffic: console background services, Xbox Live, DNS, and unrelated network activity can also change. Repeat the same controlled action and compare against multiple control captures before drawing conclusions.
