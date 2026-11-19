import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonMessageStore } from "./json-message-store.mjs";

test("persists messages and ratings across store restarts", t => {
  const directory = mkdtempSync(join(tmpdir(), "ds2-message-store-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "messages.json");

  const firstRun = new JsonMessageStore(file, { now: () => 1000 });
  const created = firstRun.publish({
    world: "world-1", area: "area-2", author: "player-1", text: "Try jumping"
  });
  assert.equal(firstRun.rate(created.id, 1), true);

  const secondRun = new JsonMessageStore(file, { now: () => 1001 });
  const restored = secondRun.list({ world: "world-1", area: "area-2" });
  assert.equal(restored.length, 1);
  assert.equal(restored[0].id, created.id);
  assert.equal(restored[0].rating, 1);

  const next = secondRun.publish({
    world: "world-1", area: "area-2", author: "player-2", text: "Be careful"
  });
  assert.equal(next.id, created.id + 1);
  assert.equal(JSON.parse(readFileSync(file, "utf8")).length, 2);
});

test("rejects a malformed persisted file instead of silently overwriting it", t => {
  const directory = mkdtempSync(join(tmpdir(), "ds2-message-store-invalid-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "messages.json");
  writeFileSync(file, "{broken", "utf8");
  assert.throws(() => new JsonMessageStore(file), SyntaxError);
});
