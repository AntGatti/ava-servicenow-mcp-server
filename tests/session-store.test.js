/**
 * Tests for SessionStore - the bounded, expiring MCP session registry.
 *
 * Exercises the real src/session-store.js module. The clock is injected so
 * expiry is tested deterministically rather than with timers.
 */

import { jest } from '@jest/globals';
import { SessionStore, SessionLimitError } from '../src/session-store.js';

describe('SessionStore', () => {
  let clock;
  const now = () => clock;

  beforeEach(() => {
    clock = 1_000_000;
  });

  describe('basic registry behaviour', () => {
    it('stores and retrieves a session', () => {
      const store = new SessionStore({ now });
      const value = { server: 'a' };

      store.add('s1', value);

      expect(store.get('s1')).toBe(value);
      expect(store.size).toBe(1);
      expect(store.ids()).toEqual(['s1']);
    });

    it('returns undefined for an unknown session', () => {
      const store = new SessionStore({ now });
      expect(store.get('nope')).toBeUndefined();
      expect(store.has('nope')).toBe(false);
    });

    it('keeps sessions separate from one another', () => {
      const store = new SessionStore({ now });
      store.add('a', { id: 'a' });
      store.add('b', { id: 'b' });

      expect(store.get('a')).toEqual({ id: 'a' });
      expect(store.get('b')).toEqual({ id: 'b' });
      expect(store.size).toBe(2);
    });

    it('replaces the value when the same id is added twice', () => {
      const store = new SessionStore({ now });
      store.add('a', { v: 1 });
      store.add('a', { v: 2 });

      expect(store.get('a')).toEqual({ v: 2 });
      expect(store.size).toBe(1);
    });

    it('reports whether a delete removed anything', () => {
      const store = new SessionStore({ now });
      store.add('a', {});

      expect(store.delete('a')).toBe(true);
      expect(store.delete('a')).toBe(false);
      expect(store.size).toBe(0);
    });
  });

  describe('capacity limit', () => {
    it('throws SessionLimitError once the cap is reached', () => {
      const store = new SessionStore({ maxSessions: 2, now });
      store.add('a', {});
      store.add('b', {});

      expect(() => store.add('c', {})).toThrow(SessionLimitError);
      expect(store.size).toBe(2);
    });

    it('reports the limit on the error so callers can surface it', () => {
      const store = new SessionStore({ maxSessions: 1, now });
      store.add('a', {});

      try {
        store.add('b', {});
        throw new Error('expected SessionLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(SessionLimitError);
        expect(error.max).toBe(1);
        expect(error.message).toContain('1');
      }
    });

    it('allows replacing an existing session when at capacity', () => {
      const store = new SessionStore({ maxSessions: 1, now });
      store.add('a', { v: 1 });

      expect(() => store.add('a', { v: 2 })).not.toThrow();
      expect(store.get('a')).toEqual({ v: 2 });
    });

    it('canAccept reports room before anything is registered', () => {
      const store = new SessionStore({ maxSessions: 2, now });
      expect(store.canAccept()).toBe(true);

      store.add('a', {});
      expect(store.canAccept()).toBe(true);

      store.add('b', {});
      expect(store.canAccept()).toBe(false);
    });

    it('canAccept allows replacing an id that is already present', () => {
      const store = new SessionStore({ maxSessions: 1, now });
      store.add('a', {});

      expect(store.canAccept()).toBe(false);
      expect(store.canAccept('a')).toBe(true);
      expect(store.canAccept('b')).toBe(false);
    });

    it('canAccept reclaims expired sessions before answering', () => {
      const store = new SessionStore({ maxSessions: 1, ttlMs: 1000, now });
      store.add('old', {});
      expect(store.canAccept()).toBe(false);

      clock += 2000;

      expect(store.canAccept()).toBe(true);
      expect(store.size).toBe(0);
    });

    it('reclaims expired sessions instead of rejecting a new one', () => {
      const store = new SessionStore({ maxSessions: 1, ttlMs: 1000, now });
      store.add('old', {});

      clock += 2000; // 'old' is now past its TTL

      expect(() => store.add('new', {})).not.toThrow();
      expect(store.ids()).toEqual(['new']);
    });
  });

  describe('expiry', () => {
    it('treats a session past its TTL as absent', () => {
      const store = new SessionStore({ ttlMs: 1000, now });
      store.add('a', {});

      clock += 1000;

      expect(store.get('a')).toBeUndefined();
      expect(store.size).toBe(0);
    });

    it('keeps a session that is still within its TTL', () => {
      const store = new SessionStore({ ttlMs: 1000, now });
      store.add('a', { v: 1 });

      clock += 999;

      expect(store.get('a')).toEqual({ v: 1 });
    });

    it('refreshes the idle timer on access', () => {
      const store = new SessionStore({ ttlMs: 1000, now });
      store.add('a', { v: 1 });

      clock += 900;
      expect(store.get('a')).toEqual({ v: 1 }); // refreshes lastAccess

      clock += 900; // 1800ms since add, but only 900ms since last access
      expect(store.get('a')).toEqual({ v: 1 });
    });

    it('sweep removes only the expired sessions and reports them', () => {
      const store = new SessionStore({ ttlMs: 1000, now });
      store.add('old', {});

      clock += 600;
      store.add('fresh', {});

      clock += 600; // old is 1200ms idle, fresh is 600ms idle

      expect(store.sweep()).toEqual(['old']);
      expect(store.ids()).toEqual(['fresh']);
    });
  });

  describe('eviction hook', () => {
    it('runs on explicit delete', () => {
      const onEvict = jest.fn();
      const store = new SessionStore({ onEvict, now });
      const value = { v: 1 };
      store.add('a', value);

      store.delete('a');

      expect(onEvict).toHaveBeenCalledWith('a', value);
    });

    it('runs on expiry', () => {
      const onEvict = jest.fn();
      const store = new SessionStore({ ttlMs: 1000, onEvict, now });
      store.add('a', { v: 1 });

      clock += 2000;
      store.get('a');

      expect(onEvict).toHaveBeenCalledWith('a', { v: 1 });
    });

    it('runs for every session on clear', () => {
      const onEvict = jest.fn();
      const store = new SessionStore({ onEvict, now });
      store.add('a', {});
      store.add('b', {});

      store.clear();

      expect(onEvict).toHaveBeenCalledTimes(2);
      expect(store.size).toBe(0);
    });

    it('does not run for a delete that removed nothing', () => {
      const onEvict = jest.fn();
      const store = new SessionStore({ onEvict, now });

      store.delete('absent');

      expect(onEvict).not.toHaveBeenCalled();
    });

    it('survives a throwing hook so cleanup cannot break the request', () => {
      const onEvict = jest.fn(() => {
        throw new Error('cleanup exploded');
      });
      const store = new SessionStore({ onEvict, now });
      store.add('a', {});

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => store.delete('a')).not.toThrow();
      expect(store.size).toBe(0);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });
});
