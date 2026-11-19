import test from "node:test";
import assert from "node:assert/strict";
import { SessionStore } from "./session-store.mjs";

const make = (store, participantKeys = ["player-a", "player-b"]) =>
  store.create({ mode: "coop", world: "world-1", area: "area-1", participantKeys });

test("creates a session and returns an isolated snapshot", () => {
  const store = new SessionStore();
  const session = make(store);
  assert.equal(session.status, "active");
  assert.equal(session.participants.length, 2);
  session.participants.pop();
  assert.equal(store.get(session.id).participants.length, 2);
});

test("only a listed participant can heartbeat and heartbeat extends expiry", () => {
  let now = 100;
  const store = new SessionStore({ now: () => now, ttlMs: 20 });
  const session = make(store);
  now = 115;
  assert.equal(store.heartbeat(session.id, "outsider"), null);
  assert.ok(store.heartbeat(session.id, "player-b"));
  now = 130;
  assert.ok(store.get(session.id));
  now = 136;
  assert.equal(store.get(session.id), null);
});

test("only the host participant can close a session", () => {
  const store = new SessionStore();
  const session = make(store);
  assert.equal(store.close(session.id, "player-b"), false);
  assert.equal(store.close(session.id, "player-a"), true);
  assert.equal(store.get(session.id), null);
});

test("expires inactive sessions", () => {
  let now = 0;
  const store = new SessionStore({ now: () => now, ttlMs: 5 });
  const session = make(store);
  now = 5;
  assert.equal(store.get(session.id), null);
  assert.equal(store.size, 0);
});

test("validates participants and enforces capacity", () => {
  const store = new SessionStore({ maxSessions: 1 });
  assert.throws(() => make(store, ["same", "same"]), /unique/);
  make(store);
  assert.throws(() => make(store, ["player-c", "player-d"]), /capacity/);
});
