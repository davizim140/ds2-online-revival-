import test from "node:test";
import assert from "node:assert/strict";
import { MatchmakingStore } from "./matchmaking-store.mjs";

test("pairs two distinct owners with identical opaque queue fields", () => {
  const store = new MatchmakingStore();
  assert.equal(store.join({ ownerKey: "a", mode: "coop", world: "w", area: "x" }).status, "queued");
  const result = store.join({ ownerKey: "b", mode: "coop", world: "w", area: "x" });
  assert.equal(result.status, "matched");
  assert.deepEqual(result.match.participantKeys, ["a", "b"]);
  assert.equal(store.size, 0);
});

test("does not pair different modes, worlds, areas, or group keys", () => {
  const store = new MatchmakingStore();
  store.join({ ownerKey: "a", mode: "coop", world: "w", area: "x", groupKey: "g1" });
  const result = store.join({ ownerKey: "b", mode: "duel", world: "w", area: "x", groupKey: "g1" });
  assert.equal(result.status, "queued");
  assert.equal(store.size, 2);
});

test("rejoining replaces the owner's previous ticket", () => {
  const store = new MatchmakingStore();
  store.join({ ownerKey: "a", mode: "coop", world: "w", area: "x" });
  store.join({ ownerKey: "a", mode: "duel", world: "w", area: "x" });
  assert.equal(store.size, 1);
  assert.equal(store.list()[0].mode, "duel");
});

test("expires tickets and permits a later join", () => {
  let now = 100;
  const store = new MatchmakingStore({ now: () => now, ttlMs: 10 });
  store.join({ ownerKey: "a", mode: "coop", world: "w", area: "x" });
  now = 110;
  assert.equal(store.size, 0);
  assert.equal(store.join({ ownerKey: "b", mode: "coop", world: "w", area: "x" }).status, "queued");
});

test("owner can leave queue and inputs are validated", () => {
  const store = new MatchmakingStore();
  store.join({ ownerKey: "a", mode: "coop", world: "w", area: "x" });
  assert.equal(store.leave("a"), true);
  assert.equal(store.leave("a"), false);
  assert.throws(() => store.join({ ownerKey: "b", mode: "unknown", world: "w", area: "x" }), /mode/);
});

test("enforces queue capacity", () => {
  const store = new MatchmakingStore({ maxQueue: 1 });
  store.join({ ownerKey: "a", mode: "coop", world: "w", area: "x" });
  assert.throws(() => store.join({ ownerKey: "b", mode: "coop", world: "w", area: "y" }), /capacity/);
});
