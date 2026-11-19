// Compares two sanitized captures by destination metadata only.
// A difference does not establish service ownership or protocol purpose.
import { analyzeCaptureCsv } from "./capture-analysis.mjs";

function signature(endpoint) {
  return [endpoint.dnsQuery ?? "", endpoint.destinationIp ?? "",
    endpoint.destinationPort ?? "", endpoint.transport ?? ""].join("|");
}

export function compareCaptureCsvs(baselineCsv, comparisonCsv) {
  const baseline = analyzeCaptureCsv(baselineCsv);
  const comparison = analyzeCaptureCsv(comparisonCsv);
  const left = new Map(baseline.endpoints.map(item => [signature(item), item]));
  const right = new Map(comparison.endpoints.map(item => [signature(item), item]));
  const shared = [];
  const added = [];
  const absent = [];
  for (const [key, item] of right) {
    if (left.has(key)) {
      const before = left.get(key);
      shared.push({ ...item, baselineObservations: before.observations,
        comparisonObservations: item.observations,
        actions: [...new Set([...before.actions, ...item.actions])].sort() });
    } else added.push(item);
  }
  for (const [key, item] of left) if (!right.has(key)) absent.push(item);
  const sort = (a, b) => signature(a).localeCompare(signature(b));
  shared.sort(sort); added.sort(sort); absent.sort(sort);
  return {
    baselineRows: baseline.rowsAnalyzed,
    comparisonRows: comparison.rowsAnalyzed,
    sharedCount: shared.length, addedCount: added.length, absentCount: absent.length,
    shared, added, absent,
    interpretation: "Capture metadata comparison only. Added or absent endpoints may be unrelated background traffic; repeat controlled captures before assigning a game-service role. Stream IDs are capture-local and are not compared."
  };
}
