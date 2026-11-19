// Summarizes sanitized Xbox 360 capture metadata. It does not inspect payloads or infer protocol semantics.
import { parseCsvLine, validateObservationsCsv } from "./protocol-observations.mjs";

const ENDPOINT_FIELDS = ["dns_query", "destination_ip", "destination_port", "transport"];

export function analyzeCaptureCsv(csv) {
  const validation = validateObservationsCsv(csv);
  if (!validation.valid) {
    const error = new Error("capture CSV failed validation");
    error.validation = validation;
    throw error;
  }

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
      item = {
        dnsQuery: row.dns_query || null,
        destinationIp: row.destination_ip || null,
        destinationPort: row.destination_port ? Number(row.destination_port) : null,
        transport: row.transport ? row.transport.toUpperCase() : null,
        observations: 0,
        evidenceLabels: new Set(),
        actions: new Set(),
        outcomes: new Set(),
        timestamps: []
      };
      endpoints.set(key, item);
    }
    item.observations++;
    if (row.evidence_label) item.evidenceLabels.add(row.evidence_label);
    if (row.action) item.actions.add(row.action);
    if (row.outcome) item.outcomes.add(row.outcome);
    if (row.local_timestamp) item.timestamps.push(row.local_timestamp);
  }

  const endpointList = [...endpoints.values()].map(item => ({
    ...item,
    evidenceLabels: [...item.evidenceLabels].sort(),
    actions: [...item.actions].sort(),
    outcomes: [...item.outcomes].sort(),
    firstSeen: item.timestamps.sort()[0] ?? null,
    lastSeen: item.timestamps.at(-1) ?? null
  }));

  return {
    rowsAnalyzed: rows.length,
    endpointCount: endpointList.length,
    evidenceCounts: Object.fromEntries(
      ["observed", "correlated", "hypothesis", "rejected"].map(label => [
        label, rows.filter(row => row.evidence_label === label).length
      ])
    ),
    endpoints: endpointList,
    interpretation: "Metadata summary only. Endpoint ownership, service purpose, handshake, and game-protocol compatibility remain unproven."
  };
}
