import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateObservationsCsv } from "./protocol-observations.mjs";

const header = "capture_id,action,local_timestamp,destination_port,transport,evidence_label,outcome";
const validRow = 'capture-001,"Opened online menu",2026-11-19T20:00:00,443,TCP,observed,connection timed out';

test("accepts the repository's empty observations template", async () => {
  const csv = await readFile(new URL("../protocol/observations-template.csv", import.meta.url), "utf8");
  const result = validateObservationsCsv(csv);
  assert.equal(result.valid, true);
  assert.equal(result.rowsChecked, 0);
});

test("accepts a well-formed observation row and quoted commas", () => {
  const result = validateObservationsCsv(header + "\n" + validRow.replace("Opened online menu", "Opened online menu, waited"));
  assert.equal(result.valid, true);
  assert.equal(result.rowsChecked, 1);
});

test("rejects unknown evidence labels, invalid ports, and invalid transports", () => {
  const row = "capture-001,launch,2026-11-19T20:00:00,70000,ICMP,confirmed,timeout";
  const result = validateObservationsCsv(header + "\n" + row);
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 3);
});

test("rejects incomplete rows and missing required values", () => {
  const result = validateObservationsCsv(header + "\n" + "capture-001,launch");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("expected")));
  const missing = validateObservationsCsv(header + "\n" + ",launch,not-a-date,,,observed,timeout");
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("capture_id is required")));
  assert.ok(missing.errors.some(error => error.includes("local_timestamp must")));
});

test("rejects a missing required header", () => {
  const result = validateObservationsCsv("capture_id,action\n001,launch");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("Missing required column")));
});
