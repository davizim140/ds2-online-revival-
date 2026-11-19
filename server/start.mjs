// Starts the local development API with file-backed message persistence.
import { resolve } from "node:path";
import { JsonMessageStore } from "./json-message-store.mjs";
import { listenLocal } from "./message-api.mjs";

const port = Number(process.env.PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new TypeError("PORT must be an integer from 1 to 65535");
}
const dataFile = resolve(process.env.DS2_MESSAGE_FILE ?? "./data/messages.json");
const store = new JsonMessageStore(dataFile);
const server = await listenLocal({ port, store });

console.log(`DS2 internal message API listening on http://127.0.0.1:${port}`);
console.log(`Message data file: ${dataFile}`);

function shutdown() {
  server.close(error => {
    if (error) {
      console.error("API shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
