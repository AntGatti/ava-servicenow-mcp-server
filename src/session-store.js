/**
 * Avanade ServiceNow MCP Server - Session Store
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * Bounded, expiring registry of MCP sessions.
 *
 * The previous implementation kept sessions in a bare object with no cap, no
 * expiry and no eviction, so abandoned SSE connections accumulated for the
 * lifetime of the process - each one holding a full MCP server instance.
 * This store bounds that: sessions expire after a TTL of inactivity and the
 * total count is capped, with eviction running cleanup for each removed entry.
 */

export class SessionLimitError extends Error {
  constructor(max) {
    super(`Session limit reached (${max} concurrent sessions)`);
    this.name = 'SessionLimitError';
    this.max = max;
  }
}

export class SessionStore {
  /**
   * @param {object}   [options]
   * @param {number}   [options.maxSessions=100] Maximum concurrent sessions.
   * @param {number}   [options.ttlMs=3600000]   Idle time before a session expires.
   * @param {Function} [options.onEvict]         Called with (id, value) on removal.
   * @param {Function} [options.now]             Clock, injectable for tests.
   */
  constructor({ maxSessions = 100, ttlMs = 3600000, onEvict = null, now = Date.now } = {}) {
    this.maxSessions = maxSessions;
    this.ttlMs = ttlMs;
    this.onEvict = onEvict;
    this.now = now;
    this.sessions = new Map();
  }

  get size() {
    return this.sessions.size;
  }

  ids() {
    return [...this.sessions.keys()];
  }

  /**
   * Whether a session could be registered right now, sweeping expired entries
   * first so an idle backlog does not block new work.
   *
   * Callers must check this *before* doing work that writes to the response.
   * Transports commit headers as soon as they handle a request, so a capacity
   * check made afterwards cannot turn into a 503 - it can only leave an
   * orphaned session that the client believes is live.
   *
   * @param {string|null} [id] If given, an existing session with this id counts
   *                           as acceptable, since adding it replaces rather
   *                           than grows the store.
   */
  canAccept(id = null) {
    this.sweep();
    if (id !== null && this.sessions.has(id)) return true;
    return this.sessions.size < this.maxSessions;
  }

  /**
   * Register a session.
   * Sweeps expired entries first so that an idle backlog cannot block new work.
   * @throws {SessionLimitError} when the cap is reached with nothing to reclaim.
   */
  add(id, value) {
    this.sweep();

    if (!this.sessions.has(id) && this.sessions.size >= this.maxSessions) {
      throw new SessionLimitError(this.maxSessions);
    }

    this.sessions.set(id, { value, lastAccess: this.now() });
    return value;
  }

  /**
   * Fetch a session, refreshing its idle timer.
   * An entry already past its TTL is evicted and reported as absent.
   */
  get(id) {
    const entry = this.sessions.get(id);
    if (!entry) return undefined;

    if (this.#isExpired(entry)) {
      this.delete(id);
      return undefined;
    }

    entry.lastAccess = this.now();
    return entry.value;
  }

  has(id) {
    return this.get(id) !== undefined;
  }

  /**
   * Remove a session and run its eviction hook.
   * @returns {boolean} whether an entry was removed.
   */
  delete(id) {
    const entry = this.sessions.get(id);
    if (!entry) return false;

    this.sessions.delete(id);
    this.#evict(id, entry.value);
    return true;
  }

  /**
   * Drop every entry past its TTL.
   * @returns {string[]} the ids removed.
   */
  sweep() {
    const expired = [];
    for (const [id, entry] of this.sessions) {
      if (this.#isExpired(entry)) expired.push(id);
    }
    for (const id of expired) this.delete(id);
    return expired;
  }

  /** Remove every session, running each eviction hook. */
  clear() {
    for (const id of this.ids()) this.delete(id);
  }

  #isExpired(entry) {
    return this.now() - entry.lastAccess >= this.ttlMs;
  }

  #evict(id, value) {
    if (!this.onEvict) return;
    try {
      this.onEvict(id, value);
    } catch (error) {
      // Eviction is best-effort cleanup; a failing hook must not take down the
      // request that triggered the sweep.
      console.error(`❌ Session eviction hook failed for ${id}:`, error.message);
    }
  }
}
