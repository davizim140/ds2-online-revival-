// Summarizes sanitized capture metadata; transport streams are not game sessions.
import { parseCsvLine, validateObservationsCsv } from "./protocol-observations.mjs";
const ENDPOINT_FIELDS = ["dns_query","destination_ip","destination_port","transport"];

export function analyzeCaptureCsv(csv) {
  const validation = validateObservationsCsv(csv);
  if (!validation.valid) { const error = new Error("capture CSV failed validation"); error.validation = validation; throw error; }
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim() !== "");
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]));
  });
  const endpoints = new Map();
  for (const row of rows) {
    if (!ENDPOINT_FIELDS.some(field => row[field])) continue;
    const key = ENDPOINT_FIELDS.map(field => row[field] ?? "").join("|");
    let item = endpoints.get(key);
    if (!item) {
      item = { dnsQuery: row.dns_query || null, destinationIp: row.destination_ip || null,
        destinationPort: row.destination_port ? Number(row.destination_port) : null,
        transport: row.transport ? row.transport.toUpperCase() : null, observations: 0,
        evidenceLabels: new Set(), actions: new Set(), outcomes: new Set(), timestamps: [] };
      endpoints.set(key, item);
    }
    item.observations++;
    if (row.evidence_label) item.evidenceLabels.add(row.evidence_label);
    if (row.action) item.actions.add(row.action);
    if (row.outcome) item.outcomes.add(row.outcome);
    if (row.local_timestamp) item.timestamps.push(row.local_timestamp);
  }
  const endpointList = [...endpoints.values()].map(item => {
    item.timestamps.sort();
    return { ...item, evidenceLabels: [...item.evidenceLabels].sort(), actions: [...item.actions].sort(),
      outcomes: [...item.outcomes].sort(), firstSeen: item.timestamps[0] ?? null, lastSeen: item.timestamps.at(-1) ?? null };
  });
  const streams = new Map();
  for (const row of rows) {
    const streamId = row.transport_stream_id;
    const transport = (row.transport ?? "").toUpperCase();
    if (!streamId || !["TCP","UDP"].includes(transport)) continue;
    const key = [row.capture_id, transport, streamId].join("|");
    let item = streams.get(key);
    if (!item) {
      item = { captureId: row.capture_id, transport, streamId, packets: 0,
        sourceEndpoints: new Set(), destinationEndpoints: new Set(), tcpFlags: new Set(), timestamps: [] };
      streams.set(key, item);
    }
    item.packets++;
    if (row.source_ip || row.source_port) item.sourceEndpoints.add([row.source_ip || "?", row.source_port || "?"].join(":"));
    if (row.destination_ip || row.destination_port) item.destinationEndpoints.add([row.destination_ip || "?", row.destination_port || "?"].join(":"));
    if (row.tcp_flags) item.tcpFlags.add(row.tcp_flags);
    if (row.local_timestamp) item.timestamps.push(row.local_timestamp);
  }
  const connectionList = [...streams.values()].map(item => {
    item.timestamps.sort();
    return { ...item, sourceEndpoints: [...item.sourceEndpoints].sort(),
      destinationEndpoints: [...item.destinationEndpoints].sort(), tcpFlags: [...item.tcpFlags].sort(),
      firstSeen: item.timestamps[0] ?? null, lastSeen: item.timestamps.at(-1) ?? null };
  });
  return {
    rowsAnalyzed: rows.length, endpointCount: endpointList.length, endpoints: endpointList,
    connectionCount: connectionList.length, connections: connectionList,
    evidenceCounts: Object.fromEntries(["observed","correlated","hypothesis","rejected"].map(label =>
      [label, rows.filter(row => row.evidence_label === label).length])),
    interpretation: "Metadata summary only. A transport stream is not a gameplay session; endpoint ownership, service purpose, and protocol compatibility remain unproven."
  };
}
