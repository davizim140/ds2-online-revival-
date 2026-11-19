import test from "node:test";
import assert from "node:assert/strict";
import { createMultiplayerApiServer } from "./multiplayer-api.mjs";

async function withServer(run) {
  const server = createMultiplayerApiServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run("http://127.0.0.1:" + address.port);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

async function post(base, path, body) {
  return fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("health endpoint identifies the internal-only multiplayer model", async () => {
  await withServer(async base => {
    const response = await fetch(base + "/health");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).service, "internal-multiplayer-model");
  });
});

test("HTTP matchmaking creates a session and supports heartbeat and close", async () => {
  await withServer(async base => {
    const first = await post(base, "/v1/matchmaking/join", {
      ownerKey: "alpha", mode: "coop", world: "w", area: "a"
    });
    assert.equal(first.status, 202);
    assert.equal((await first.json()).status, "queued");

    const second = await post(base, "/v1/matchmaking/join", {
      ownerKey: "beta", mode: "coop", world: "w", area: "a"
    });
    assert.equal(second.status, 201);
    const result = await second.json();
    const id = result.session.id;

    const get = await fetch(base + "/v1/sessions/" + id);
    assert.equal(get.status, 200);
    assert.equal((await get.json()).session.participants.length, 2);

    const heartbeat = await post(base, "/v1/sessions/" + id + "/heartbeat", { ownerKey: "beta" });
    assert.equal(heartbeat.status, 200);

    const denied = await post(base, "/v1/sessions/" + id + "/close", { ownerKey: "beta" });
    assert.equal(denied.status, 404);

    const closed = await post(base, "/v1/sessions/" + id + "/close", { ownerKey: "alpha" });
    assert.equal(closed.status, 200);
  });
});

test("HTTP gateway validates JSON, matchmaking fields, and unknown routes", async () => {
  await withServer(async base => {
    const invalid = await fetch(base + "/v1/matchmaking/join", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{"
    });
    assert.equal(invalid.status, 400);

    const badInput = await post(base, "/v1/matchmaking/join", { ownerKey: "x", mode: "bad" });
    assert.equal(badInput.status, 400);

    const missing = await fetch(base + "/missing");
    assert.equal(missing.status, 404);
  });
});
