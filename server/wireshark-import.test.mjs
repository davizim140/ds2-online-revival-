import test from "node:test";
import assert from "node:assert/strict";
import { importWiresharkTsv } from "./wireshark-import.mjs";
import { validateObservationsCsv } from "./protocol-observations.mjs";

const header = [
  "frame.time_epoch", "dns.qry.name", "ip.dst", "ipv6.dst",
  "tcp.dstport", "udp.dstport", "tcp.srcport", "udp.srcport", "ip.src", "ipv6.src", "tcp.stream", "udp.stream", "frame.number", "frame.len", "tcp.flags", "tls.handshake.extensions_server_name"
].join("\t");

test("imports TShark metadata fields into validated project CSV", () => {
  const tsv = [
    header,
    ["1795082400.125", "service.example", "203.0.113.8", "", "443", "", "51000", "", "192.0.2.20", "", "4", "", "100", "128", "0x0002", "service.example"].join("\t"),
    ["1795082460.5", "", "", "2001:db8::8", "", "3074", "", "52000", "", "2001:db8::20", "", "", "7", "101", "96", "", ""].join("\t")
  ].join("\n");
  const result = importWiresharkTsv(tsv, {
    captureId: "real-capture-01",
    action: "selected online menu",
    outcome: "connection timed out"
  });
  assert.equal(result.rowsImported, 2);
  assert.equal(validateObservationsCsv(result.csv).valid, true);
  assert.match(result.csv, /service\.example/);
  assert.match(result.csv, /203\.0\.113\.8,443,TCP/);
  assert.match(result.csv, /2001:db8::20,52000,2001:db8::8,3074,UDP,7,101,96/);
  assert.match(result.csv, /Imported from TShark fields export/);
});

test("requires explicit capture context instead of inventing action or outcome", () => {
  assert.throws(() => importWiresharkTsv(header + "\n", { captureId: "c1" }), /metadata.action is required/);
});

test("rejects malformed timestamps and missing TShark fields", () => {
  assert.throws(() => importWiresharkTsv(header + "\n" + ["bad","x","1.2.3.4","","80","",""].join("\t"), {
    captureId: "c1", action: "launch", outcome: "timeout"
  }), /invalid frame.time_epoch/);
  assert.throws(() => importWiresharkTsv("ip.dst\n", {
    captureId: "c1", action: "launch", outcome: "timeout"
  }), /missing field/);
});

test("rejects malformed TSV column counts", () => {
  assert.throws(() => importWiresharkTsv(header + "\n1795082400.125\ttoo-few", {
    captureId: "c1", action: "launch", outcome: "timeout"
  }), /unexpected number of fields/);
});
