// Orchestrates the internal queue-to-session lifecycle. No Xbox 360 protocol is implemented here.
import { MatchmakingStore } from "./matchmaking-store.mjs";
import { SessionStore } from "./session-store.mjs";

export class MatchmakingService {
  constructor({ queue = new MatchmakingStore(), sessions = new SessionStore() } = {}) {
    if (!queue || typeof queue.join !== "function" || typeof queue.leave !== "function") {
      throw new TypeError("queue must provide join() and leave()");
    }
    if (!sessions || typeof sessions.create !== "function" ||
        typeof sessions.heartbeat !== "function" || typeof sessions.get !== "function" ||
        typeof sessions.close !== "function") {
      throw new TypeError("sessions must provide create(), heartbeat(), get(), and close()");
    }
    this.queue = queue;
    this.sessions = sessions;
  }

  join(request) {
    const result = this.queue.join(request);
    if (result.status !== "matched") return result;
    const session = this.sessions.create({
      mode: result.match.mode,
      world: result.match.world,
      area: result.match.area,
      participantKeys: result.match.participantKeys
    });
    return { status: "matched", match: result.match, session };
  }

  leave(ownerKey) {
    return this.queue.leave(ownerKey);
  }

  heartbeat(sessionId, ownerKey) {
    return this.sessions.heartbeat(sessionId, ownerKey);
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  closeSession(sessionId, ownerKey) {
    return this.sessions.close(sessionId, ownerKey);
  }
}
