// Converts a TShark/Wireshark tab-separated field export into the project's redacted evidence CSV.
// It imports metadata only; packet payloads are neither requested nor parsed.
import { parseCsvLine, validateObservationsCsv } from "./protocol-observations.mjs";

const OUTPUT_COLUMNS = [
  "capture_id", "game_build", "title_id", "media_id", "title_update",
  "console_capture_point", "action", "local_timestamp", "dns_query", "dns_result",
  "destination_ip", "destination_port", "transport", "connection_start",
  "connection_end", "tls_sni", "tls_certificate_subject",
  "tls_certificate_fingerprint", "evidence_label", "outcome", "notes_redacted"
];

function parseTsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"' && value.length === 0) {
      quoted = true;
    } else if (char === "\t") {
      fields.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("TShark TSV contains an unterminated quoted field");
  fields.push(value);
  return fields;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function first(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "") ?? "";
}

export function importWiresharkTsv(tsv, metadata = {}) {
  for (const key of ["captureId", "action", "outcome"]) {
    if (typeof metadata[key] !== "string" || metadata[key].trim() === "") {
      throw new TypeError("metadata." + key + " is required; supply the real capture context");
    }
  }
  const evidenceLabel = metadata.evidenceLabel ?? "observed";
  if (!["observed", "correlated", "hypothesis", "rejected"].includes(evidenceLabel)) {
    throw new TypeError("metadata.evidenceLabel is not recognized");
  }
  if (typeof tsv !== "string" || tsv.trim() === "") throw new TypeError("TShark TSV input is empty");

  const lines = tsv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim() !== "");
  const headers = parseTsvLine(lines[0]);
  const required = ["frame.time_epoch"];
  for (const field of required) {
    if (!headers.includes(field)) throw new Error("TShark export is missing field: " + field);
  }
  const rows = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const values = parseTsvLine(lines[lineIndex]);
    if (values.length !== headers.length) {
      throw new Error("TShark TSV line " + (lineIndex + 1) + " has an unexpected number of fields");
    }
    const packet = Object.fromEntries(headers.map((name, index) => [name, values[index].trim()]));
    const epoch = Number(packet["frame.time_epoch"]);
    if (!Number.isFinite(epoch) || epoch <= 0) {
      throw new Error("TShark TSV line " + (lineIndex + 1) + " has an invalid frame.time_epoch");
    }
    const date = new Date(epoch * 1000);
    if (Number.isNaN(date.getTime())) throw new Error("TShark TSV timestamp is outside the supported range");

    const tcpPort = packet["tcp.dstport"];
    const udpPort = packet["udp.dstport"];
    const transport = tcpPort ? "TCP" : udpPort ? "UDP" : "";
    const destinationPort = first(tcpPort, udpPort);
    const output = {
      capture_id: metadata.captureId.trim(),
      game_build: metadata.gameBuild ?? "",
      title_id: metadata.titleId ?? "",
      media_id: metadata.mediaId ?? "",
      title_update: metadata.titleUpdate ?? "",
      console_capture_point: metadata.capturePoint ?? "wireshark-export",
      action: metadata.action.trim(),
      local_timestamp: date.toISOString(),
      dns_query: packet["dns.qry.name"] ?? "",
      dns_result: "",
      destination_ip: first(packet["ip.dst"], packet["ipv6.dst"]),
      destination_port: destinationPort,
      transport,
      connection_start: "",
      connection_end: "",
      tls_sni: packet["tls.handshake.extensions_server_name"] ?? "",
      tls_certificate_subject: "",
      tls_certificate_fingerprint: "",
      evidence_label: evidenceLabel,
      outcome: metadata.outcome.trim(),
      notes_redacted: "Imported from TShark fields export; packet payload excluded."
    };
    rows.push(OUTPUT_COLUMNS.map(column => output[column]));
  }

  const csv = [
    OUTPUT_COLUMNS.join(","),
    ...rows.map(row => row.map(csvCell).join(","))
  ].join("\n") + "\n";
  const validation = validateObservationsCsv(csv);
  if (!validation.valid) throw new Error("generated evidence CSV failed validation: " + validation.errors.join("; "));
  return { csv, rowsImported: rows.length, columns: [...OUTPUT_COLUMNS] };
}

if (import.meta.url === "file://" + process.argv[1]) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const tsv = Buffer.concat(chunks).toString("utf8");
  const result = importWiresharkTsv(tsv, {
    captureId: process.env.CAPTURE_ID,
    action: process.env.CAPTURE_ACTION,
    outcome: process.env.CAPTURE_OUTCOME,
    evidenceLabel: process.env.EVIDENCE_LABEL ?? "observed",
    gameBuild: process.env.GAME_BUILD ?? "",
    titleId: process.env.TITLE_ID ?? "",
    mediaId: process.env.MEDIA_ID ?? "",
    titleUpdate: process.env.TITLE_UPDATE ?? "",
    capturePoint: process.env.CAPTURE_POINT ?? "wireshark-export"
  });
  process.stdout.write(result.csv);
}
