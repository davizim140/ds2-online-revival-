// Internal presence domain model. Not the Xbox 360 wire protocol.
const DEFAULT_TTL_MS = 45_000;
const MAX_PRESENCES = 10_000;

export class PresenceStore {
  #records = new Map();

  constructor({ now = () => Date.now(), ttlMs = DEFAULT_TTL_MS, maxPresences = MAX_PRESENCES } = {}) {
    if (typeof now !== "function") throw new TypeError("now must be a function");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1) throw new TypeError("ttlMs must be a positive safe integer");
    if (!Number.isSafeInteger(maxPresences) || maxPresences < 1) throw new TypeError("maxPresences must be a positive safe integer");
    this.now = now;
    this.ttlMs = ttlMs;
    this.maxPresences = maxPresences;
  }

  heartbeat({ presenceKey, world, area, activity = "online" }) {
    for (const [name, value] of Object.entries({ presenceKey, world, area, activity })) {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError(name + " must be a non-empty string");
      }
    }
    if (presenceKey.length > 128 || world.length > 64 || area.length > 64 || activity.length > 32) {
      throw new RangeError("presence fields exceed their maximum length");
    }

    this.#expire();
    if (!this.#records.has(presenceKey) && this.#records.size >= this.maxPresences) {
      throw new RangeError("presence capacity reached");
    }

    const now = this.now();
    const record = Object.freeze({
      presenceKey: presenceKey.trim(),
      world: world.trim(),
      area: area.trim(),
      activity: activity.trim(),
      lastSeenAt: now,
      expiresAt: now + this.ttlMs
    });
    this.#records.set(record.presenceKey, record);
    return { ...record };
  }

  list({ world, area, limit = 50 }) {
    if (typeof world !== "string" || typeof area !== "string") {
      throw new TypeError("world and area are required strings");
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("limit must be an integer from 1 to 100");
    }
    this.#expire();
    return [...this.#records.values()]
      .filter(record => record.world === world && record.area === area)
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, limit)
      .map(record => ({ ...record }));
  }

  remove(presenceKey) {
    if (typeof presenceKey !== "string" || presenceKey.trim().length === 0) {
      throw new TypeError("presenceKey must be a non-empty string");
    }
    return this.#records.delete(presenceKey);
  }

  #expire() {
    const now = this.now();
    for (const [key, record] of this.#records) {
      if (record.expiresAt <= now) this.#records.delete(key);
    }
  }

  get size() {
    this.#expire();
    return this.#records.size;
  }
}
