// Internal multiplayer session registry. It does not implement the DS2/Xbox 360 wire protocol.
const DEFAULT_TTL_MS = 60_000;
const MAX_SESSIONS = 1_000;
const MAX_PARTICIPANTS = 8;

export class SessionStore {
  #sessions = new Map();
  #nextId = 1;

  constructor({ now = () => Date.now(), ttlMs = DEFAULT_TTL_MS, maxSessions = MAX_SESSIONS } = {}) {
    if (typeof now !== "function") throw new TypeError("now must be a function");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1) throw new TypeError("ttlMs must be a positive safe integer");
    if (!Number.isSafeInteger(maxSessions) || maxSessions < 1) throw new TypeError("maxSessions must be a positive safe integer");
    this.now = now;
    this.ttlMs = ttlMs;
    this.maxSessions = maxSessions;
  }

  create({ mode, world, area, participantKeys }) {
    for (const [name, value] of Object.entries({ mode, world, area })) {
      if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(name + " must be a non-empty string");
    }
    if (!Array.isArray(participantKeys) || participantKeys.length < 2 || participantKeys.length > MAX_PARTICIPANTS) {
      throw new RangeError("participantKeys must contain 2 to 8 participants");
    }
    const normalized = participantKeys.map(key => {
      if (typeof key !== "string" || key.trim().length === 0 || key.length > 128) {
        throw new TypeError("each participant key must be a non-empty string up to 128 characters");
      }
      return key.trim();
    });
    if (new Set(normalized).size !== normalized.length) throw new TypeError("participants must be unique");
    if (mode.length > 32 || world.length > 64 || area.length > 64) throw new RangeError("session fields exceed their maximum length");

    this.#expire();
    if (this.#sessions.size >= this.maxSessions) throw new RangeError("session capacity reached");

    const now = this.now();
    const session = {
      id: "session-" + this.#nextId++,
      mode: mode.trim(),
      world: world.trim(),
      area: area.trim(),
      hostKey: normalized[0],
      participants: normalized.map(ownerKey => ({ ownerKey, lastSeenAt: now })),
      createdAt: now,
      expiresAt: now + this.ttlMs,
      status: "active"
    };
    this.#sessions.set(session.id, session);
    return this.#copy(session);
  }

  heartbeat(sessionId, ownerKey) {
    this.#validateIdentity(sessionId, ownerKey);
    this.#expire();
    const session = this.#sessions.get(sessionId);
    if (!session) return null;
    const participant = session.participants.find(item => item.ownerKey === ownerKey.trim());
    if (!participant) return null;
    const now = this.now();
    participant.lastSeenAt = now;
    session.expiresAt = now + this.ttlMs;
    return this.#copy(session);
  }

  get(sessionId) {
    if (typeof sessionId !== "string" || sessionId.trim().length === 0) throw new TypeError("sessionId must be a non-empty string");
    this.#expire();
    const session = this.#sessions.get(sessionId);
    return session ? this.#copy(session) : null;
  }

  close(sessionId, ownerKey) {
    this.#validateIdentity(sessionId, ownerKey);
    this.#expire();
    const session = this.#sessions.get(sessionId);
    if (!session || session.hostKey !== ownerKey.trim()) return false;
    this.#sessions.delete(sessionId);
    return true;
  }

  #validateIdentity(sessionId, ownerKey) {
    if (typeof sessionId !== "string" || sessionId.trim().length === 0) throw new TypeError("sessionId must be a non-empty string");
    if (typeof ownerKey !== "string" || ownerKey.trim().length === 0) throw new TypeError("ownerKey must be a non-empty string");
  }

  #copy(session) {
    return { ...session, participants: session.participants.map(item => ({ ...item })) };
  }

  #expire() {
    const now = this.now();
    for (const [id, session] of this.#sessions) {
      if (session.expiresAt <= now) this.#sessions.delete(id);
    }
  }

  get size() {
    this.#expire();
    return this.#sessions.size;
  }
}
