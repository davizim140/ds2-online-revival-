import test from "node:test";
import assert from "node:assert/strict";
import { WorldEventStore } from "./world-event-store.mjs";

test("stores bloodstains and shades separately by world and area", () => {
  const store = new WorldEventStore();
  const blood = store.publish({ ownerKey: "p1", type: "bloodstain", world: "w", area: "a", payload: { replay: "opaque-test-data" } });
  store.publish({ ownerKey: "p2", type: "shade", world: "w", area: "a" });
  store.publish({ ownerKey: "p3", type: "bloodstain", world: "w", area: "b" });
  assert.equal(store.list({ type: "bloodstain", world: "w", area: "a" })[0].id, blood.id);
  assert.equal(store.list({ type: "shade", world: "w", area: "a" }).length, 1);
});

test("expires events at the TTL boundary", () => {
  let now = 100;
  const store = new WorldEventStore({ now: () => now, ttlMs: 50 });
  store.publish({ ownerKey: "p", type: "shade", world: "w", area: "a" });
  now = 149;
  assert.equal(store.size, 1);
  now = 150;
  assert.equal(store.size, 0);
});

test("only the owner can remove an event", () => {
  const store = new WorldEventStore();
  const event = store.publish({ ownerKey: "owner", type: "bloodstain", world: "w", area: "a" });
  assert.equal(store.remove(event.id, "someone-else"), false);
  assert.equal(store.remove(event.id, "owner"), true);
});

test("payload is defensively copied", () => {
  const store = new WorldEventStore();
  const event = store.publish({ ownerKey: "p", type: "shade", world: "w", area: "a", payload: { position: { x: 1 } } });
  event.payload.position.x = 999;
  assert.equal(store.list({ type: "shade", world: "w", area: "a" })[0].payload.position.x, 1);
});

test("rejects invalid types, payloads, limits, and capacity overflow", () => {
  const store = new WorldEventStore({ maxEvents: 1 });
  assert.throws(() => store.publish({ ownerKey: "p", type: "ghost", world: "w", area: "a" }), TypeError);
  assert.throws(() => store.publish({ ownerKey: "p", type: "shade", world: "w", area: "a", payload: [] }), TypeError);
  store.publish({ ownerKey: "p", type: "shade", world: "w", area: "a" });
  assert.throws(() => store.publish({ ownerKey: "q", type: "bloodstain", world: "w", area: "a" }), RangeError);
  assert.throws(() => store.list({ type: "shade", world: "w", area: "a", limit: 101 }), RangeError);
});
