import test from "node:test";
import assert from "node:assert/strict";
import { MatchmakingService } from "./matchmaking-service.mjs";
import { MatchmakingStore } from "./matchmaking-store.mjs";
import { SessionStore } from "./session-store.mjs";

function createService() {
  let now = 1_000;
  return {
    service: new MatchmakingService({
      queue: new MatchmakingStore({ now: () => now }),
      sessions: new SessionStore({ now: () => now })
    }),
    advance(ms) { now += ms; }
  };
}

const request = ownerKey => ({
  ownerKey, mode: "coop", world: "opaque-world", area: "opaque-area"
});

test("first player queues and second player creates a session", () => {
  const { service } = createService();
  assert.equal(service.join(request("p1")).status, "queued");
  const result = service.join(request("p2"));
  assert.equal(result.status, "matched");
  assert.equal(result.session.status, "active");
  assert.deepEqual(result.session.participants.map(p => p.ownerKey), ["p1", "p2"]);
  assert.equal(service.getSession(result.session.id).id, result.session.id);
});

test("session heartbeat is restricted to matched participants", () => {
  const { service } = createService();
  service.join(request("p1"));
  const { session } = service.join(request("p2"));
  assert.equal(service.heartbeat(session.id, "stranger"), null);
  assert.ok(service.heartbeat(session.id, "p2"));
});

test("host can close the session after matchmaking", () => {
  const { service } = createService();
  service.join(request("p1"));
  const { session } = service.join(request("p2"));
  assert.equal(service.closeSession(session.id, "p2"), false);
  assert.equal(service.closeSession(session.id, "p1"), true);
  assert.equal(service.getSession(session.id), null);
});

test("queued player can cancel before a match", () => {
  const { service } = createService();
  service.join(request("p1"));
  assert.equal(service.leave("p1"), true);
  assert.equal(service.join(request("p2")).status, "queued");
});

test("different opaque matchmaking fields remain in separate queues", () => {
  const { service } = createService();
  service.join(request("p1"));
  assert.equal(service.join({ ...request("p2"), area: "another-area" }).status, "queued");
});
