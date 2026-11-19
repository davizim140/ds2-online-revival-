import test from "node:test";
import assert from "node:assert/strict";
import { MessageStore } from "./message-store.mjs";

test("publishes and retrieves messages newest first within world and area", () => {
  let now = 1000;
  const store = new MessageStore({ now: () => now });
  const first = store.publish({ world: "world-1", area: "area-a", author: "p1", text: "Try jumping" });
  now++;
  store.publish({ world: "world-1", area: "area-a", author: "p2", text: "Be wary of enemy" });
  store.publish({ world: "world-2", area: "area-a", author: "p3", text: "Other world" });

  const result = store.list({ world: "world-1", area: "area-a" });
  assert.equal(result.length, 2);
  assert.equal(result[0].text, "Be wary of enemy");
  assert.equal(result[1].id, first.id);
});

test("rejects empty fields, oversized text, and invalid limits", () => {
  const store = new MessageStore();
  assert.throws(() => store.publish({ world: "", area: "a", author: "p", text: "x" }), TypeError);
  assert.throws(() => store.publish({ world: "w", area: "a", author: "p", text: "x".repeat(257) }), RangeError);
  assert.throws(() => store.list({ world: "w", area: "a", limit: 0 }), RangeError);
});

test("expires messages and prevents rating expired entries", () => {
  let now = 0;
  const store = new MessageStore({ now: () => now, ttlMs: 100 });
  const message = store.publish({ world: "w", area: "a", author: "p", text: "Hello" });
  assert.equal(store.rate(message.id, 1), true);
  assert.equal(store.list({ world: "w", area: "a" })[0].rating, 1);
  now = 100;
  assert.equal(store.size, 0);
  assert.equal(store.rate(message.id, 1), false);
});
