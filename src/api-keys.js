/**
 * Avanade ServiceNow MCP Server - API Key Store
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * Keys look like `avmcp_<id>_<secret>`. The id is public and appears in logs
 * and in the key file; the secret is shown once at creation and only its
 * SHA-256 hash is stored. Because secrets are 256 bits of random data, a plain
 * hash is sufficient - there is nothing to brute-force, so a slow KDF would
 * only add latency to every request.
 *
 * The key file is re-read whenever its modification time changes, so keys can
 * be created, rotated or revoked while the server is running.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const KEY_PREFIX = 'avmcp';
export const DEFAULT_KEYS_FILE = path.join(__dirname, '../config/api-keys.json');

const KEY_PATTERN = /^avmcp_([0-9a-f]{8})_([A-Za-z0-9_-]{43})$/;

export const hashSecret = (secret) => crypto.createHash('sha256').update(secret).digest('hex');

/** Split a presented key into { id, secret }, or null if it is malformed. */
export const parseKey = (value) => {
  if (typeof value !== 'string') return null;
  const match = KEY_PATTERN.exec(value.trim());
  return match ? { id: match[1], secret: match[2] } : null;
};

/**
 * Create a new key. Returns the plaintext key (show it once) and the record
 * to persist, which holds only the hash.
 */
export const generateKey = ({ label, expiresAt = null, now = Date.now } = {}) => {
  if (!label || typeof label !== 'string') {
    throw new Error('A label is required so the key can be identified in logs');
  }
  const id = crypto.randomBytes(4).toString('hex');
  const secret = crypto.randomBytes(32).toString('base64url');
  return {
    key: `${KEY_PREFIX}_${id}_${secret}`,
    record: {
      id,
      label,
      hash: hashSecret(secret),
      status: 'active',
      created_at: new Date(now()).toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      revoked_at: null
    }
  };
};

const safeEqualHex = (a, b) => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

export class FileKeyStore {
  /**
   * @param {object}   [options]
   * @param {string}   [options.filePath] Key file location.
   * @param {Function} [options.now]      Clock, injectable for tests.
   */
  constructor({ filePath = DEFAULT_KEYS_FILE, now = Date.now } = {}) {
    this.filePath = filePath;
    this.now = now;
    this.records = [];
    this.mtimeMs = null;
  }

  /** Re-read the file if it changed since the last read. */
  #refresh() {
    let stat;
    try {
      stat = fs.statSync(this.filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.records = [];
        this.mtimeMs = null;
        return;
      }
      throw error;
    }

    if (stat.mtimeMs === this.mtimeMs) return;

    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.records = Array.isArray(parsed.keys) ? parsed.keys : [];
      this.mtimeMs = stat.mtimeMs;
    } catch (error) {
      // Keep the last good set rather than locking everyone out, or worse,
      // dropping to an empty set, because of a half-written or malformed edit.
      console.error(`❌ Could not read API key file ${this.filePath}: ${error.message}`);
    }
  }

  list() {
    this.#refresh();
    return this.records.map(({ hash, ...rest }) => ({ ...rest }));
  }

  get size() {
    this.#refresh();
    return this.records.length;
  }

  /** Persist a new record. The write is atomic so readers never see a partial file. */
  add(record) {
    this.#refresh();
    this.#write([...this.records, record]);
  }

  /** @returns {boolean} whether an active key with this id was revoked. */
  revoke(id) {
    this.#refresh();
    const target = this.records.find((record) => record.id === id);
    if (!target || target.status === 'revoked') return false;
    this.#write(
      this.records.map((record) =>
        record.id === id
          ? { ...record, status: 'revoked', revoked_at: new Date(this.now()).toISOString() }
          : record
      )
    );
    return true;
  }

  /**
   * Check a presented key.
   * @returns {{ ok: true, id: string, label: string } | { ok: false, reason: string, id?: string }}
   */
  validate(presented) {
    const parsed = parseKey(presented);
    if (!parsed) return { ok: false, reason: 'malformed' };

    this.#refresh();
    const record = this.records.find((candidate) => candidate.id === parsed.id);
    if (!record) return { ok: false, reason: 'unknown' };

    // Compare before looking at status so timing does not reveal whether an
    // id exists but is revoked.
    if (!safeEqualHex(hashSecret(parsed.secret), record.hash)) {
      return { ok: false, reason: 'mismatch', id: record.id };
    }
    if (record.status !== 'active') return { ok: false, reason: 'revoked', id: record.id };
    if (record.expires_at && Date.parse(record.expires_at) <= this.now()) {
      return { ok: false, reason: 'expired', id: record.id };
    }
    return { ok: true, id: record.id, label: record.label };
  }

  #write(records) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify({ keys: records }, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temp, this.filePath);
    this.#refresh();
  }
}
