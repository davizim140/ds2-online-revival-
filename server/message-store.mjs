// Internal domain model only. This is NOT the Xbox 360 wire protocol.
const MAX_TEXT_LENGTH = 256;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class MessageStore {
  #messages = [];
  #nextId = 1;

  constructor({ now = () => Date.now(), ttlMs = DEFAULT_TTL_MS } = {}) {
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
      throw new TypeError("ttlMs must be a positive safe integer");
    }
    this.now = now;
    this.ttlMs = ttlMs;
  }

  publish({ world, area, author, text }) {
    for (const [name, value] of Object.entries({ world, area, author, text })) {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError(name + " must be a non-empty string");
      }
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new RangeError(`text must be at most ${MAX_TEXT_LENGTH} characters`);
    }
    const createdAt = this.now();
    const message = Object.freeze({
      id: this.#nextId++,
      world: world.trim(),
      area: area.trim(),
      author: author.trim(),
      text: text.trim(),
      createdAt,
      expiresAt: createdAt + this.ttlMs,
      rating: 0
    });
    this.#messages.push(message);
    return message;
  }

  list({ world, area, limit = 50 }) {
    if (typeof world !== "string" || typeof area !== "string") {
      throw new TypeError("world and area are required strings");
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("limit must be an integer from 1 to 100");
    }
    const now = this.now();
    this.#messages = this.#messages.filter(item => item.expiresAt > now);
    return this.#messages
      .filter(item => item.world === world && item.area === area)
      .slice(-limit)
      .reverse();
  }

  rate(id, delta) {
    if (!Number.isSafeInteger(id) || ![-1, 1].includes(delta)) {
      throw new TypeError("id must be an integer and delta must be -1 or 1");
    }
    const index = this.#messages.findIndex(item => item.id === id && item.expiresAt > this.now());
    if (index < 0) return false;
    const current = this.#messages[index];
    this.#messages[index] = Object.freeze({ ...current, rating: current.rating + delta });
    return true;
  }

  get size() {
    this.#messages = this.#messages.filter(item => item.expiresAt > this.now());
    return this.#messages.length;
  }
}
