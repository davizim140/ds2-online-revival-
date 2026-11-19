import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const header = "capture_id,game_build,title_id,media_id,title_update,console_capture_point,action,local_timestamp,dns_query,dns_result,source_ip,source_port,destination_ip,destination_port,transport,transport_stream_id,frame_number,frame_length,tcp_flags,connection_start,connection_end,tls_sni,tls_certificate_subject,tls_certificate_fingerprint,evidence_label,outcome,notes_redacted";
const row = (capture, action, ip, port) =>
  [capture,"base","465307E4","","none","router",action,"2026-11-19T10:00:00Z","","","192.0.2.50","50000",ip,port,"TCP","1","1","128","0x0018","","","","","","observed","timeout","redacted"].join(",");
const csv = (...rows) => [header, ...rows].join("\\n");

test("CLI emits a JSON comparison report for two valid files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ds2-capture-diff-"));
  try {
    const baseline = join(dir, "baseline.csv");
    const comparison = join(dir, "comparison.csv");
    await writeFile(baseline, csv(row("idle","idle","192.0.2.10","443")));
    await writeFile(comparison, csv(row("online","open-online-menu","192.0.2.11","3074")));
    const result = spawnSync(process.execPath, [resolve("server/capture-diff-cli.mjs"), baseline, comparison], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.addedCount, 1);
    assert.equal(report.added[0].destinationPort, 3074);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("CLI rejects missing arguments and invalid CSV", async () => {
  const missing = spawnSync(process.execPath, [resolve("server/capture-diff-cli.mjs")], { encoding: "utf8" });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /Usage:/);

  const dir = await mkdtemp(join(tmpdir(), "ds2-capture-diff-invalid-"));
  try {
    const invalid = join(dir, "invalid.csv");
    await writeFile(invalid, "not,a,valid,capture");
    const result = spawnSync(process.execPath, [resolve("server/capture-diff-cli.mjs"), invalid, invalid], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /failed validation/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
