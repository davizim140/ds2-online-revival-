import test from "node:test";
import assert from "node:assert/strict";
import { PresenceStore } from "./presence-store.mjs";

test("heartbeat creates and refreshes a presence", () => {
  let now = 100;
  const store = new PresenceStore({ now: () => now, ttlMs: 50 });
  store.heartbeat({ presenceKey: "session-a", world: "world-1", area: "forest" });
  now = 120;
  store.heartbeat({ presenceKey: "session-a", world: "world-1", area: "castle", activity: "online" });
  assert.equal(store.size, 1);
  assert.equal(store.list({ world: "world-1", area: "forest" }).length, 0);
  assert.equal(store.list({ world: "world-1", area: "castle" })[0].lastSeenAt, 120);
});

test("lists only the requested world and area, newest first", () => {
  let now = 0;
  const store = new PresenceStore({ now: () => now });
  store.heartbeat({ presenceKey: "a", world: "w1", area: "a1" });
  now++;
  store.heartbeat({ presenceKey: "b", world: "w1", area: "a1" });
  store.heartbeat({ presenceKey: "c", world: "w2", area: "a1" });
  assert.deepEqual(
    store.list({ world: "w1", area: "a1" }).map(item => item.presenceKey),
    ["b", "a"]
  );
});

test("expires stale presences at the TTL boundary", () => {
  let now = 0;
  const store = new PresenceStore({ now: () => now, ttlMs: 10 });
  store.heartbeat({ presenceKey: "a", world: "w", area: "a" });
  now = 9;
  assert.equal(store.size, 1);
  now = 10;
  assert.equal(store.size, 0);
});

test("removes a presence and reports unknown keys", () => {
  const store = new PresenceStore();
  store.heartbeat({ presenceKey: "a", world: "w", area: "a" });
  assert.equal(store.remove("a"), true);
  assert.equal(store.remove("a"), false);
});

test("rejects invalid fields, oversized values, limits, and capacity overflow", () => {
  const store = new PresenceStore({ maxPresences: 1 });
  assert.throws(() => store.heartbeat({ presenceKey: "", world: "w", area: "a" }), TypeError);
  assert.throws(() => store.heartbeat({ presenceKey: "x".repeat(129), world: "w", area: "a" }), RangeError);
  store.heartbeat({ presenceKey: "a", world: "w", area: "a" });
  assert.throws(() => store.heartbeat({ presenceKey: "b", world: "w", area: "a" }), RangeError);
  assert.throws(() => store.list({ world: "w", area: "a", limit: 101 }), RangeError);
});
