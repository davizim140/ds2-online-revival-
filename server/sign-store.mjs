// Internal matchmaking-sign domain model. Not the Xbox 360 wire protocol.
const DEFAULT_TTL_MS = 120_000;
const MAX_SIGNS = 5_000;
const SIGN_TYPES = new Set(["coop", "invasion", "duel"]);

export class SignStore {
  #signs = new Map();
  #nextId = 1;

  constructor({ now = () => Date.now(), ttlMs = DEFAULT_TTL_MS, maxSigns = MAX_SIGNS } = {}) {
    if (typeof now !== "function") throw new TypeError("now must be a function");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1) throw new TypeError("ttlMs must be a positive safe integer");
    if (!Number.isSafeInteger(maxSigns) || maxSigns < 1) throw new TypeError("maxSigns must be a positive safe integer");
    this.now = now;
    this.ttlMs = ttlMs;
    this.maxSigns = maxSigns;
  }

  publish({ ownerKey, type, world, area, metadata = {} }) {
    for (const [name, value] of Object.entries({ ownerKey, type, world, area })) {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError(name + " must be a non-empty string");
      }
    }
    if (!SIGN_TYPES.has(type)) throw new TypeError("type must be coop, invasion, or duel");
    if (ownerKey.length > 128 || world.length > 64 || area.length > 64) {
      throw new RangeError("sign fields exceed their maximum length");
    }
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new TypeError("metadata must be an object");
    }
    if (JSON.stringify(metadata).length > 1024) throw new RangeError("metadata exceeds 1024 characters");

    this.#expire();
    if (this.#signs.size >= this.maxSigns) throw new RangeError("sign capacity reached");

    const now = this.now();
    const sign = Object.freeze({
      id: this.#nextId++,
      ownerKey: ownerKey.trim(),
      type,
      world: world.trim(),
      area: area.trim(),
      metadata: Object.freeze({ ...metadata }),
      createdAt: now,
      expiresAt: now + this.ttlMs
    });
    this.#signs.set(sign.id, sign);
    return this.#copy(sign);
  }

  list({ type, world, area, limit = 50 }) {
    if (!SIGN_TYPES.has(type)) throw new TypeError("type must be coop, invasion, or duel");
    if (typeof world !== "string" || typeof area !== "string") {
      throw new TypeError("world and area are required strings");
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("limit must be an integer from 1 to 100");
    }
    this.#expire();
    return [...this.#signs.values()]
      .filter(sign => sign.type === type && sign.world === world && sign.area === area)
      .sort((a, b) => a.createdAt - b.createdAt || a.id - b.id)
      .slice(0, limit)
      .map(sign => this.#copy(sign));
  }

  revoke(id, ownerKey) {
    if (!Number.isSafeInteger(id) || id < 1) throw new TypeError("id must be a positive integer");
    if (typeof ownerKey !== "string" || ownerKey.trim().length === 0) {
      throw new TypeError("ownerKey must be a non-empty string");
    }
    this.#expire();
    const sign = this.#signs.get(id);
    if (!sign || sign.ownerKey !== ownerKey.trim()) return false;
    return this.#signs.delete(id);
  }

  #copy(sign) {
    return { ...sign, metadata: { ...sign.metadata } };
  }

  #expire() {
    const now = this.now();
    for (const [id, sign] of this.#signs) {
      if (sign.expiresAt <= now) this.#signs.delete(id);
    }
  }

  get size() {
    this.#expire();
    return this.#signs.size;
  }
}
