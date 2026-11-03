/**
 * Tests for API key generation, storage and validation, and the auth middleware.
 *
 * Exercises the real src/api-keys.js and src/auth-middleware.js modules against
 * a temporary key file. The clock is injected so expiry is deterministic.
 */

import { jest } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FileKeyStore, generateKey, parseKey, hashSecret } from '../src/api-keys.js';
import { createAuthMiddleware, extractKey, resolveAuthMode } from '../src/auth-middleware.js';

describe('api keys', () => {
  let dir;
  let file;
  let clock;
  const now = () => clock;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avmcp-keys-'));
    file = path.join(dir, 'api-keys.json');
    clock = Date.parse('2026-01-01T00:00:00Z');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const issue = (store, options = {}) => {
    const { key, record } = generateKey({ label: 'test', now, ...options });
    store.add(record);
    return { key, record };
  };

  describe('generateKey / parseKey', () => {
    it('produces a parseable key whose record holds only a hash', () => {
      const { key, record } = generateKey({ label: 'copilot', now });
      const parsed = parseKey(key);

      expect(key).toMatch(/^avmcp_[0-9a-f]{8}_/);
      expect(parsed.id).toBe(record.id);
      expect(record.hash).toBe(hashSecret(parsed.secret));
      expect(JSON.stringify(record)).not.toContain(parsed.secret);
    });

    it('requires a label', () => {
      expect(() => generateKey({})).toThrow(/label/);
    });

    it('generates distinct keys', () => {
      expect(generateKey({ label: 'a' }).key).not.toBe(generateKey({ label: 'a' }).key);
    });

    it.each([undefined, null, '', 'avmcp_bad', 'avmcp_12345678_short', 42])(
      'rejects malformed input %p',
      (value) => {
        expect(parseKey(value)).toBeNull();
      }
    );
  });

  describe('FileKeyStore', () => {
    it('validates a key it issued', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key, record } = issue(store, { label: 'prod' });

      expect(store.validate(key)).toEqual({ ok: true, id: record.id, label: 'prod' });
    });

    it('rejects a wrong secret for a known id', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key, record } = issue(store);
      const forged = `avmcp_${record.id}_${'A'.repeat(43)}`;

      expect(key).not.toBe(forged);
      expect(store.validate(forged)).toMatchObject({ ok: false, reason: 'mismatch' });
    });

    it('rejects unknown and malformed keys', () => {
      const store = new FileKeyStore({ filePath: file, now });
      issue(store);

      expect(store.validate(generateKey({ label: 'x' }).key)).toMatchObject({ reason: 'unknown' });
      expect(store.validate('nonsense')).toMatchObject({ reason: 'malformed' });
    });

    it('rejects everything when the file does not exist', () => {
      const store = new FileKeyStore({ filePath: file, now });
      expect(store.validate(generateKey({ label: 'x' }).key).ok).toBe(false);
      expect(store.size).toBe(0);
    });

    it('rejects an expired key', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key } = issue(store, { expiresAt: clock + 1000 });

      expect(store.validate(key).ok).toBe(true);
      clock += 1000;
      expect(store.validate(key)).toMatchObject({ ok: false, reason: 'expired' });
    });

    it('revokes a key', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key, record } = issue(store);

      expect(store.revoke(record.id)).toBe(true);
      expect(store.validate(key)).toMatchObject({ ok: false, reason: 'revoked' });
      expect(store.revoke(record.id)).toBe(false);
      expect(store.revoke('deadbeef')).toBe(false);
    });

    it('supports rotation: old and new keys overlap until the old is revoked', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const oldKey = issue(store, { label: 'v1' });
      const newKey = issue(store, { label: 'v2' });

      expect(store.validate(oldKey.key).ok).toBe(true);
      expect(store.validate(newKey.key).ok).toBe(true);

      store.revoke(oldKey.record.id);
      expect(store.validate(oldKey.key).ok).toBe(false);
      expect(store.validate(newKey.key).ok).toBe(true);
    });

    it('never stores or lists the plaintext secret or hash', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key } = issue(store);
      const { secret } = parseKey(key);

      expect(fs.readFileSync(file, 'utf8')).not.toContain(secret);
      expect(JSON.stringify(store.list())).not.toContain('hash');
    });

    it('picks up keys written by another process without a restart', () => {
      const server = new FileKeyStore({ filePath: file, now });
      expect(server.size).toBe(0);

      const cli = new FileKeyStore({ filePath: file, now });
      const { key } = issue(cli);
      // Guarantee a distinct mtime on filesystems with coarse timestamps.
      const future = new Date(Date.now() + 5000);
      fs.utimesSync(file, future, future);

      expect(server.validate(key).ok).toBe(true);
    });

    it('keeps the last good keys when the file is corrupted', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key } = issue(store);
      const errors = jest.spyOn(console, 'error').mockImplementation(() => {});

      fs.writeFileSync(file, '{ not json');
      const future = new Date(Date.now() + 5000);
      fs.utimesSync(file, future, future);

      expect(store.validate(key).ok).toBe(true);
      expect(errors).toHaveBeenCalled();
      errors.mockRestore();
    });
  });

  describe('extractKey', () => {
    it('reads X-API-Key, Bearer and a bare Authorization value', () => {
      expect(extractKey({ 'x-api-key': ' k1 ' })).toBe('k1');
      expect(extractKey({ authorization: 'Bearer k2' })).toBe('k2');
      expect(extractKey({ authorization: 'bearer k3' })).toBe('k3');
      expect(extractKey({ authorization: 'k4' })).toBe('k4');
    });

    it('prefers X-API-Key and returns null when nothing is sent', () => {
      expect(extractKey({ 'x-api-key': 'a', authorization: 'Bearer b' })).toBe('a');
      expect(extractKey({})).toBeNull();
    });
  });

  describe('resolveAuthMode', () => {
    it('defaults to off and normalises case', () => {
      expect(resolveAuthMode(undefined)).toBe('off');
      expect(resolveAuthMode(' ENFORCE ')).toBe('enforce');
    });

    it('rejects an unknown mode instead of silently running open', () => {
      expect(() => resolveAuthMode('enforced')).toThrow(/Invalid AVANADE_MCP_AUTH_MODE/);
    });
  });

  describe('createAuthMiddleware', () => {
    const run = (mode, headers, store) => {
      const log = jest.fn();
      const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
      const req = { headers, method: 'POST', path: '/mcp' };
      const next = jest.fn();
      createAuthMiddleware({ store, mode, log })(req, res, next);
      return { req, res, next, log };
    };

    it('does nothing in off mode', () => {
      const { next, res } = run('off', {}, new FileKeyStore({ filePath: file, now }));
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('lets a valid key through and records who it was', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key, record } = issue(store, { label: 'copilot-prod' });
      const { next, req } = run('enforce', { 'x-api-key': key }, store);

      expect(next).toHaveBeenCalled();
      expect(req.apiKey).toEqual({ id: record.id, label: 'copilot-prod' });
    });

    it('rejects a missing key with 401 in enforce mode', () => {
      const { next, res } = run('enforce', {}, new FileKeyStore({ filePath: file, now }));

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', expect.stringContaining('Bearer'));
    });

    it('gives the same body for every failure reason', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key, record } = issue(store);
      store.revoke(record.id);

      const revoked = run('enforce', { 'x-api-key': key }, store);
      const missing = run('enforce', {}, store);
      expect(revoked.res.json.mock.calls[0]).toEqual(missing.res.json.mock.calls[0]);
    });

    it('never logs the secret', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { key } = issue(store);
      const { secret } = parseKey(key);
      const forged = `avmcp_${parseKey(key).id}_${'B'.repeat(43)}`;
      const { log } = run('enforce', { 'x-api-key': forged }, store);

      expect(log.mock.calls.flat().join(' ')).not.toContain(secret);
      expect(log.mock.calls.flat().join(' ')).not.toContain('B'.repeat(43));
    });

    it('logs but allows an unauthenticated request in warn mode', () => {
      const { next, log, res } = run('warn', {}, new FileKeyStore({ filePath: file, now }));

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith(expect.stringContaining('missing'));
    });

    it('fails closed in enforce mode when no keys exist', () => {
      const store = new FileKeyStore({ filePath: file, now });
      const { next, res } = run('enforce', { 'x-api-key': generateKey({ label: 'x' }).key }, store);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
