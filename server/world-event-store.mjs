// Internal world-event registry for bloodstain/shade research. Not the Xbox 360 wire protocol.
const EVENT_TYPES = new Set(["bloodstain", "shade"]);
const DEFAULT_TTL_MS = 5 * 60_000;
const MAX_EVENTS = 10_000;
const MAX_PAYLOAD_BYTES = 8_192;

export class WorldEventStore {
  #events = new Map();
  #nextId = 1;

  constructor({ now = () => Date.now(), ttlMs = DEFAULT_TTL_MS, maxEvents = MAX_EVENTS } = {}) {
    if (typeof now !== "function") throw new TypeError("now must be a function");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1) throw new TypeError("ttlMs must be a positive safe integer");
    if (!Number.isSafeInteger(maxEvents) || maxEvents < 1) throw new TypeError("maxEvents must be a positive safe integer");
    this.now = now;
    this.ttlMs = ttlMs;
    this.maxEvents = maxEvents;
  }

  publish({ ownerKey, type, world, area, payload = {} }) {
    for (const [name, value] of Object.entries({ ownerKey, type, world, area })) {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError(name + " must be a non-empty string");
      }
    }
    if (!EVENT_TYPES.has(type)) throw new TypeError("type must be bloodstain or shade");
    if (ownerKey.length > 128 || world.length > 64 || area.length > 64) {
      throw new RangeError("event fields exceed their maximum length");
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new TypeError("payload must be an object");
    }
    let encoded;
    try {
      encoded = JSON.stringify(payload);
    } catch {
      throw new TypeError("payload must be JSON-serializable");
    }
    if (encoded.length > MAX_PAYLOAD_BYTES) throw new RangeError("payload exceeds 8192 characters");

    this.#expire();
    if (this.#events.size >= this.maxEvents) throw new RangeError("event capacity reached");

    const now = this.now();
    const event = Object.freeze({
      id: this.#nextId++,
      ownerKey: ownerKey.trim(),
      type,
      world: world.trim(),
      area: area.trim(),
      payload: JSON.parse(encoded),
      createdAt: now,
      expiresAt: now + this.ttlMs
    });
    this.#events.set(event.id, event);
    return this.#copy(event);
  }

  list({ type, world, area, limit = 50 }) {
    if (!EVENT_TYPES.has(type)) throw new TypeError("type must be bloodstain or shade");
    if (typeof world !== "string" || typeof area !== "string") {
      throw new TypeError("world and area are required strings");
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("limit must be an integer from 1 to 100");
    }
    this.#expire();
    return [...this.#events.values()]
      .filter(event => event.type === type && event.world === world && event.area === area)
      .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
      .slice(0, limit)
      .map(event => this.#copy(event));
  }

  remove(id, ownerKey) {
    if (!Number.isSafeInteger(id) || id < 1) throw new TypeError("id must be a positive integer");
    if (typeof ownerKey !== "string" || ownerKey.trim().length === 0) {
      throw new TypeError("ownerKey must be a non-empty string");
    }
    this.#expire();
    const event = this.#events.get(id);
    if (!event || event.ownerKey !== ownerKey.trim()) return false;
    return this.#events.delete(id);
  }

  #copy(event) {
    return { ...event, payload: JSON.parse(JSON.stringify(event.payload)) };
  }

  #expire() {
    const now = this.now();
    for (const [id, event] of this.#events) {
      if (event.expiresAt <= now) this.#events.delete(id);
    }
  }

  get size() {
    this.#expire();
    return this.#events.size;
  }
}
