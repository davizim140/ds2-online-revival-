// Import selected TShark metadata only. Packet payloads are never requested or parsed.
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { validateObservationsCsv } from "./protocol-observations.mjs";

const OUTPUT_COLUMNS = ["capture_id","game_build","title_id","media_id","title_update","console_capture_point","action","local_timestamp","dns_query","dns_result","source_ip","source_port","destination_ip","destination_port","transport","transport_stream_id","frame_number","frame_length","tcp_flags","connection_start","connection_end","tls_sni","tls_certificate_subject","tls_certificate_fingerprint","evidence_label","outcome","notes_redacted"];

function parseTsvLine(line) {
  const fields = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') quoted = false;
      else value += ch;
    } else if (ch === '"' && value.length === 0) quoted = true;
    else if (ch === "\t") { fields.push(value); value = ""; }
    else value += ch;
  }
  if (quoted) throw new Error("TShark TSV contains an unterminated quoted field");
  fields.push(value); return fields;
}
function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
function first(...values) { return values.find(v => v !== undefined && v !== null && v !== "") ?? ""; }

export function importWiresharkTsv(tsv, metadata = {}) {
  for (const key of ["captureId","action","outcome"]) {
    if (typeof metadata[key] !== "string" || !metadata[key].trim()) throw new TypeError("metadata." + key + " is required; supply the real capture context");
  }
  const evidenceLabel = metadata.evidenceLabel ?? "observed";
  if (!["observed","correlated","hypothesis","rejected"].includes(evidenceLabel)) throw new TypeError("metadata.evidenceLabel is not recognized");
  if (typeof tsv !== "string" || !tsv.trim()) throw new TypeError("TShark TSV input is empty");
  const lines = tsv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim() !== "");
  const headers = parseTsvLine(lines[0]);
  if (!headers.includes("frame.time_epoch")) throw new Error("TShark export is missing field: frame.time_epoch");
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseTsvLine(lines[i]);
    if (values.length !== headers.length) throw new Error("TShark TSV line " + (i + 1) + " has an unexpected number of fields");
    const packet = Object.fromEntries(headers.map((name, index) => [name, values[index].trim()]));
    const epoch = Number(packet["frame.time_epoch"]);
    if (!Number.isFinite(epoch) || epoch <= 0) throw new Error("TShark TSV line " + (i + 1) + " has an invalid frame.time_epoch");
    const date = new Date(epoch * 1000);
    if (Number.isNaN(date.getTime())) throw new Error("TShark TSV timestamp is outside the supported range");
    const tcp = Boolean(packet["tcp.srcport"] || packet["tcp.dstport"]);
    const udp = Boolean(packet["udp.srcport"] || packet["udp.dstport"]);
    const transport = tcp ? "TCP" : udp ? "UDP" : "";
    const output = {
      capture_id: metadata.captureId.trim(), game_build: metadata.gameBuild ?? "", title_id: metadata.titleId ?? "",
      media_id: metadata.mediaId ?? "", title_update: metadata.titleUpdate ?? "",
      console_capture_point: metadata.capturePoint ?? "wireshark-export", action: metadata.action.trim(),
      local_timestamp: date.toISOString(), dns_query: packet["dns.qry.name"] ?? "", dns_result: "",
      source_ip: first(packet["ip.src"], packet["ipv6.src"]), source_port: first(packet["tcp.srcport"], packet["udp.srcport"]),
      destination_ip: first(packet["ip.dst"], packet["ipv6.dst"]), destination_port: first(packet["tcp.dstport"], packet["udp.dstport"]),
      transport, transport_stream_id: first(packet["tcp.stream"], packet["udp.stream"]),
      frame_number: packet["frame.number"] ?? "", frame_length: packet["frame.len"] ?? "", tcp_flags: packet["tcp.flags"] ?? "",
      connection_start: "", connection_end: "", tls_sni: packet["tls.handshake.extensions_server_name"] ?? "",
      tls_certificate_subject: "", tls_certificate_fingerprint: "", evidence_label: evidenceLabel,
      outcome: metadata.outcome.trim(),
      notes_redacted: "Imported from TShark fields export; epoch timestamp normalized to UTC; stream IDs are capture-local; packet payload excluded."
    };
    rows.push(OUTPUT_COLUMNS.map(column => output[column]));
  }
  const csv = [OUTPUT_COLUMNS.join(","), ...rows.map(row => row.map(csvCell).join(","))].join("\n") + "\n";
  const validation = validateObservationsCsv(csv);
  if (!validation.valid) throw new Error("generated evidence CSV failed validation: " + validation.errors.join("; "));
  return { csv, rowsImported: rows.length, columns: [...OUTPUT_COLUMNS] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const chunks = []; for await (const chunk of process.stdin) chunks.push(chunk);
  const result = importWiresharkTsv(Buffer.concat(chunks).toString("utf8"), {
    captureId: process.env.CAPTURE_ID, action: process.env.CAPTURE_ACTION, outcome: process.env.CAPTURE_OUTCOME,
    evidenceLabel: process.env.EVIDENCE_LABEL ?? "observed", gameBuild: process.env.GAME_BUILD ?? "",
    titleId: process.env.TITLE_ID ?? "", mediaId: process.env.MEDIA_ID ?? "",
    titleUpdate: process.env.TITLE_UPDATE ?? "", capturePoint: process.env.CAPTURE_POINT ?? "wireshark-export"
  });
  process.stdout.write(result.csv);
}
