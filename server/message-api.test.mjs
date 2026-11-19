import test from "node:test";
import assert from "node:assert/strict";
import { createMessageApiServer } from "./message-api.mjs";

test("HTTP API health, publish, list, rate and validation", async t => {
  const server = createMessageApiServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const health = await fetch(base + "/health");
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const created = await fetch(base + "/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ world: "w", area: "a", author: "player", text: "Hello" })
  });
  assert.equal(created.status, 201);
  const { message } = await created.json();

  const listed = await fetch(base + "/v1/messages?world=w&area=a");
  assert.equal((await listed.json()).messages.length, 1);

  const rated = await fetch(base + `/v1/messages/${message.id}/rating`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ delta: 1 })
  });
  assert.equal(rated.status, 200);

  const invalid = await fetch(base + "/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });
  assert.equal(invalid.status, 400);

  const missing = await fetch(base + "/not-a-route");
  assert.equal(missing.status, 404);
});
