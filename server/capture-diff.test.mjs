import test from "node:test";
import assert from "node:assert/strict";
import { compareCaptureCsvs } from "./capture-diff.mjs";

const header = "capture_id,game_build,title_id,media_id,title_update,console_capture_point,action,local_timestamp,dns_query,dns_result,source_ip,source_port,destination_ip,destination_port,transport,transport_stream_id,frame_number,frame_length,tcp_flags,connection_start,connection_end,tls_sni,tls_certificate_subject,tls_certificate_fingerprint,evidence_label,outcome,notes_redacted";
const row = (capture, action, ip, port) =>
  [capture,"base","465307E4","","none","router",action,"2026-11-19T10:00:00Z","example.invalid","","192.0.2.50","50000",ip,port,"TCP","1","1","128","0x0018","","","","","","observed","timeout","redacted"].join(",");
const csv = (...rows) => [header, ...rows].join("\n");

test("compares endpoint metadata without comparing capture-local stream IDs", () => {
  const baseline = csv(row("idle","idle","192.0.2.10","443"), row("idle","idle","192.0.2.12","443"));
  const comparison = csv(row("online","open-online-menu","192.0.2.10","443"), row("online","open-online-menu","192.0.2.11","3074"));
  const result = compareCaptureCsvs(baseline, comparison);
  assert.equal(result.sharedCount, 1);
  assert.equal(result.addedCount, 1);
  assert.equal(result.absentCount, 1);
  assert.equal(result.shared[0].baselineObservations, 1);
  assert.equal(result.shared[0].comparisonObservations, 1);
  assert.deepEqual(result.added[0].actions, ["open-online-menu"]);
  assert.equal(result.added[0].destinationPort, 3074);
  assert.equal(result.absent[0].destinationPort, 443);
  assert.match(result.interpretation, /background traffic/);
});

test("rejects invalid baseline or comparison CSV", () => {
  assert.throws(() => compareCaptureCsvs(header.replace("outcome", "missing_outcome"), csv(row("online","menu","192.0.2.10","443"))), /failed validation/);
  assert.throws(() => compareCaptureCsvs(csv(row("idle","idle","192.0.2.10","443")), ""), /failed validation/);
});
