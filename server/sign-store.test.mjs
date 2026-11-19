import test from "node:test";
import assert from "node:assert/strict";
import { SignStore } from "./sign-store.mjs";

test("publishes and lists signs by type, world, and area", () => {
  const store = new SignStore();
  const coop = store.publish({ ownerKey: "player-a", type: "coop", world: "w1", area: "forest" });
  store.publish({ ownerKey: "player-b", type: "duel", world: "w1", area: "forest" });
  store.publish({ ownerKey: "player-c", type: "coop", world: "w2", area: "forest" });
  assert.equal(coop.type, "coop");
  assert.deepEqual(store.list({ type: "coop", world: "w1", area: "forest" }).map(x => x.id), [coop.id]);
});

test("expires signs at the TTL boundary", () => {
  let now = 10;
  const store = new SignStore({ now: () => now, ttlMs: 20 });
  store.publish({ ownerKey: "p", type: "coop", world: "w", area: "a" });
  now = 29;
  assert.equal(store.size, 1);
  now = 30;
  assert.equal(store.size, 0);
});

test("only the owner can revoke a sign", () => {
  const store = new SignStore();
  const sign = store.publish({ ownerKey: "owner", type: "invasion", world: "w", area: "a" });
  assert.equal(store.revoke(sign.id, "other"), false);
  assert.equal(store.revoke(sign.id, "owner"), true);
  assert.equal(store.revoke(sign.id, "owner"), false);
});

test("returns defensive copies of sign metadata", () => {
  const store = new SignStore();
  const sign = store.publish({ ownerKey: "p", type: "duel", world: "w", area: "a", metadata: { level: 20 } });
  sign.metadata.level = 999;
  assert.equal(store.list({ type: "duel", world: "w", area: "a" })[0].metadata.level, 20);
});

test("rejects invalid types, fields, metadata, limits, and capacity overflow", () => {
  const store = new SignStore({ maxSigns: 1 });
  assert.throws(() => store.publish({ ownerKey: "p", type: "unknown", world: "w", area: "a" }), TypeError);
  assert.throws(() => store.publish({ ownerKey: "p", type: "coop", world: "w", area: "a", metadata: [] }), TypeError);
  store.publish({ ownerKey: "p", type: "coop", world: "w", area: "a" });
  assert.throws(() => store.publish({ ownerKey: "q", type: "duel", world: "w", area: "a" }), RangeError);
  assert.throws(() => store.list({ type: "coop", world: "w", area: "a", limit: 101 }), RangeError);
});
