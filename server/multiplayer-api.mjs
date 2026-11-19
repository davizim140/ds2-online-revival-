// Loopback-only development HTTP gateway for the internal multiplayer model.
// It is not the Dark Souls II Xbox 360 wire protocol and is not exposed publicly.
import { createServer } from "node:http";
import { MatchmakingService } from "./matchmaking-service.mjs";

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

export function createMultiplayerApiServer({ service = new MatchmakingService() } = {}) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/health") {
        return send(response, 200, { ok: true, service: "internal-multiplayer-model" });
      }

      if (request.method === "POST" && url.pathname === "/v1/matchmaking/join") {
        const result = service.join(await readJson(request));
        return send(response, result.status === "matched" ? 201 : 202, result);
      }

      if (request.method === "POST" && url.pathname === "/v1/matchmaking/leave") {
        const body = await readJson(request);
        return send(response, 200, { removed: service.leave(body.ownerKey) });
      }

      const heartbeat = url.pathname.match(/^\/v1\/sessions\/([a-zA-Z0-9-]+)\/heartbeat$/);
      if (request.method === "POST" && heartbeat) {
        const body = await readJson(request);
        const session = service.heartbeat(heartbeat[1], body.ownerKey);
        return send(response, session ? 200 : 404, { session });
      }

      const close = url.pathname.match(/^\/v1\/sessions\/([a-zA-Z0-9-]+)\/close$/);
      if (request.method === "POST" && close) {
        const body = await readJson(request);
        const closed = service.closeSession(close[1], body.ownerKey);
        return send(response, closed ? 200 : 404, { closed });
      }

      const session = url.pathname.match(/^\/v1\/sessions\/([a-zA-Z0-9-]+)$/);
      if (request.method === "GET" && session) {
        const result = service.getSession(session[1]);
        return send(response, result ? 200 : 404, { session: result });
      }

      return send(response, 404, { error: "not_found" });
    } catch (error) {
      const status = error.statusCode ??
        (error instanceof TypeError || error instanceof RangeError ? 400 : 500);
      return send(response, status, { error: status === 500 ? "internal_error" : error.message });
    }
  });
}

export function listenMultiplayerLocal({ port = 8788, service } = {}) {
  const server = createMultiplayerApiServer({ service });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}
