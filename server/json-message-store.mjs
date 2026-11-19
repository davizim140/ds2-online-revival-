// File-backed persistence for the internal message model.
// Single-process development storage; not a production database or Xbox protocol.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { MessageStore } from "./message-store.mjs";

export class JsonMessageStore {
  constructor(filePath, options = {}) {
    if (typeof filePath !== "string" || filePath.length === 0) {
      throw new TypeError("filePath must be a non-empty string");
    }
    this.filePath = filePath;
    mkdirSync(dirname(filePath), { recursive: true });
    let initialMessages = [];
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8"));
      if (!Array.isArray(parsed)) throw new TypeError("persisted message file must contain an array");
      initialMessages = parsed;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    this.store = null;
    this.store = new MessageStore({
      ...options,
      initialMessages,
      onChange: messages => this.#writeAtomically(messages)
    });
  }

  #writeAtomically(messages) {
    const temporaryPath = this.filePath + ".tmp";
    writeFileSync(temporaryPath, JSON.stringify(messages, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, this.filePath);
  }

  publish(message) { return this.store.publish(message); }
  list(query) { return this.store.list(query); }
  rate(id, delta) { return this.store.rate(id, delta); }
  get size() { return this.store.size; }
}
