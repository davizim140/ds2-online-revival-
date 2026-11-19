import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonMessageStore } from "./json-message-store.mjs";
import { createMessageApiServer } from "./message-api.mjs";

async function start(store) {
  const server = createMessageApiServer({ store });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
async function stop(server) {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test("HTTP API retains published messages after a server restart", async t => {
  const directory = mkdtempSync(join(tmpdir(), "ds2-api-persistence-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "messages.json");

  const first = await start(new JsonMessageStore(file));
  const response = await fetch(first.base + "/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ world: "w", area: "a", author: "p", text: "Persist me" })
  });
  assert.equal(response.status, 201);
  await stop(first.server);

  const second = await start(new JsonMessageStore(file));
  t.after(() => stop(second.server));
  const listed = await fetch(second.base + "/v1/messages?world=w&area=a");
  assert.equal(listed.status, 200);
  const body = await listed.json();
  assert.equal(body.messages.length, 1);
  assert.equal(body.messages[0].text, "Persist me");
});
