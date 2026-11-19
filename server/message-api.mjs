// Local development API for the internal message model.
// This is NOT the Xbox 360 protocol adapter. Bind to loopback only.
import { createServer } from "node:http";
import { MessageStore } from "./message-store.mjs";

const MAX_BODY_BYTES = 4096;

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
      const error = new Error("request body too large");
      error.statusCode = 413;
      throw error;
    }
  }
  try {
    return raw.length ? JSON.parse(raw) : {};
  } catch {
    const error = new Error("invalid JSON");
    error.statusCode = 400;
    throw error;
  }
}

function send(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

export function createMessageApiServer({ store = new MessageStore() } = {}) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/health") {
        return send(response, 200, { ok: true, service: "internal-message-model" });
      }

      if (request.method === "POST" && url.pathname === "/v1/messages") {
        const body = await readJson(request);
        const message = store.publish(body);
        return send(response, 201, { message });
      }

      if (request.method === "GET" && url.pathname === "/v1/messages") {
        const world = url.searchParams.get("world");
        const area = url.searchParams.get("area");
        const rawLimit = url.searchParams.get("limit");
        const limit = rawLimit === null ? 50 : Number(rawLimit);
        const messages = store.list({ world, area, limit });
        return send(response, 200, { messages });
      }

      const ratingMatch = url.pathname.match(/^\/v1\/messages\/(\d+)\/rating$/);
      if (request.method === "POST" && ratingMatch) {
        const body = await readJson(request);
        const changed = store.rate(Number(ratingMatch[1]), body.delta);
        return send(response, changed ? 200 : 404, { updated: changed });
      }

      return send(response, 404, { error: "not_found" });
    } catch (error) {
      const status = error.statusCode ??
        (error instanceof TypeError || error instanceof RangeError ? 400 : 500);
      return send(response, status, { error: status === 500 ? "internal_error" : error.message });
    }
  });
}

export function listenLocal({ port = 8787, store } = {}) {
  const server = createMessageApiServer({ store });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}
