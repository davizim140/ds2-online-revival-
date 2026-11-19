import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCaptureCsv } from "./capture-analysis.mjs";

const header = "capture_id,game_build,title_id,media_id,title_update,console_capture_point,action,local_timestamp,dns_query,dns_result,destination_ip,destination_port,transport,connection_start,connection_end,tls_sni,tls_certificate_subject,tls_certificate_fingerprint,evidence_label,outcome,notes_redacted";
const row = (action, timestamp, ip, port, label = "observed") =>
  ["cap-1","base","465307E4","","none","router","" + action,timestamp,"example.invalid","",ip,port,"TCP","","","","","",label,"timeout","redacted"].join(",");

test("groups repeated transport observations and preserves evidence labels", () => {
  const csv = [header, row("launch","2026-11-19T10:00:00Z","192.0.2.10","443"), row("online-menu","2026-11-19T10:01:00Z","192.0.2.10","443","correlated"), row("online-menu","2026-11-19T10:01:02Z","192.0.2.11","3074")].join("\n");
  const result = analyzeCaptureCsv(csv);
  assert.equal(result.rowsAnalyzed, 3);
  assert.equal(result.endpointCount, 2);
  assert.equal(result.endpoints[0].observations, 2);
  assert.deepEqual(result.endpoints[0].evidenceLabels, ["correlated", "observed"]);
  assert.deepEqual(result.endpoints[0].actions, ["launch", "online-menu"]);
  assert.equal(result.evidenceCounts.observed, 2);
  assert.equal(result.evidenceCounts.correlated, 1);
});

test("rejects invalid evidence instead of analyzing guessed data", () => {
  assert.throws(() => analyzeCaptureCsv(header + "\n" + row("launch","not-a-time","192.0.2.10","443")), /failed validation/);
});

test("handles a valid header-only template", () => {
  const result = analyzeCaptureCsv(header + "\n");
  assert.equal(result.rowsAnalyzed, 0);
  assert.equal(result.endpointCount, 0);
});
