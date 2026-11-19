// Internal matchmaking queue model. Matching fields are opaque placeholders, not DS2 rules or Xbox 360 protocol.
const MODES = new Set(["coop", "invasion", "duel"]);
const DEFAULT_TTL_MS = 30_000;
const MAX_QUEUE = 2_000;

export class MatchmakingStore {
  #queue = new Map();
  #nextTicket = 1;
  #nextMatch = 1;

  constructor({ now = () => Date.now(), ttlMs = DEFAULT_TTL_MS, maxQueue = MAX_QUEUE } = {}) {
    if (typeof now !== "function") throw new TypeError("now must be a function");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1) throw new TypeError("ttlMs must be a positive safe integer");
    if (!Number.isSafeInteger(maxQueue) || maxQueue < 1) throw new TypeError("maxQueue must be a positive safe integer");
    this.now = now;
    this.ttlMs = ttlMs;
    this.maxQueue = maxQueue;
  }

  join({ ownerKey, mode, world, area, groupKey = "default" }) {
    for (const [name, value] of Object.entries({ ownerKey, mode, world, area, groupKey })) {
      if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(name + " must be a non-empty string");
    }
    if (!MODES.has(mode)) throw new TypeError("mode must be coop, invasion, or duel");
    if (ownerKey.length > 128 || world.length > 64 || area.length > 64 || groupKey.length > 64) {
      throw new RangeError("matchmaking fields exceed their maximum length");
    }

    this.#expire();
    const owner = ownerKey.trim();
    const existing = [...this.#queue.values()].find(ticket => ticket.ownerKey === owner);
    if (existing) this.#queue.delete(existing.id);
    if (this.#queue.size >= this.maxQueue) throw new RangeError("matchmaking queue capacity reached");

    const now = this.now();
    const ticket = Object.freeze({
      id: this.#nextTicket++,
      ownerKey: owner,
      mode,
      world: world.trim(),
      area: area.trim(),
      groupKey: groupKey.trim(),
      queuedAt: now,
      expiresAt: now + this.ttlMs
    });
    this.#queue.set(ticket.id, ticket);

    const partner = [...this.#queue.values()]
      .filter(item => item.id !== ticket.id && item.ownerKey !== ticket.ownerKey &&
        item.mode === ticket.mode && item.world === ticket.world &&
        item.area === ticket.area && item.groupKey === ticket.groupKey)
      .sort((a, b) => a.queuedAt - b.queuedAt || a.id - b.id)[0];

    if (!partner) return { status: "queued", ticket: { ...ticket } };

    this.#queue.delete(ticket.id);
    this.#queue.delete(partner.id);
    return {
      status: "matched",
      match: Object.freeze({
        id: this.#nextMatch++,
        mode: ticket.mode,
        world: ticket.world,
        area: ticket.area,
        groupKey: ticket.groupKey,
        participantKeys: [partner.ownerKey, ticket.ownerKey],
        createdAt: now
      })
    };
  }

  leave(ownerKey) {
    if (typeof ownerKey !== "string" || ownerKey.trim().length === 0) throw new TypeError("ownerKey must be a non-empty string");
    let removed = false;
    for (const [id, ticket] of this.#queue) {
      if (ticket.ownerKey === ownerKey.trim()) {
        this.#queue.delete(id);
        removed = true;
      }
    }
    return removed;
  }

  list() {
    this.#expire();
    return [...this.#queue.values()].sort((a, b) => a.queuedAt - b.queuedAt || a.id - b.id).map(ticket => ({ ...ticket }));
  }

  #expire() {
    const now = this.now();
    for (const [id, ticket] of this.#queue) if (ticket.expiresAt <= now) this.#queue.delete(id);
  }

  get size() {
    this.#expire();
    return this.#queue.size;
  }
}
