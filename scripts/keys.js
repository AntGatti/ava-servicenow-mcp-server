/**
 * Avanade ServiceNow MCP Server - API key management CLI
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 *   npm run keys -- create --label "copilot-studio-prod" [--expires-days 90]
 *   npm run keys -- list
 *   npm run keys -- revoke <id>
 *   npm run keys -- check <key>
 *
 * Reads AVANADE_MCP_API_KEYS_FILE, defaulting to config/api-keys.json.
 */

import dotenv from 'dotenv';
import { FileKeyStore, DEFAULT_KEYS_FILE, generateKey } from '../src/api-keys.js';

dotenv.config();

const store = new FileKeyStore({ filePath: process.env.AVANADE_MCP_API_KEYS_FILE || DEFAULT_KEYS_FILE });
const [command, ...rest] = process.argv.slice(2);

const option = (name) => {
  const index = rest.indexOf(`--${name}`);
  return index === -1 ? undefined : rest[index + 1];
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

switch (command) {
  case 'create': {
    const label = option('label');
    if (!label) fail('Usage: keys create --label <name> [--expires-days <n>]');

    const days = option('expires-days');
    if (days !== undefined && !(Number(days) > 0)) fail('--expires-days must be a positive number');
    const expiresAt = days ? Date.now() + Number(days) * 86_400_000 : null;

    const { key, record } = generateKey({ label, expiresAt });
    store.add(record);
    console.log(`Created key ${record.id} (${label}), expires: ${record.expires_at ?? 'never'}`);
    console.log('\nStore this now - it cannot be shown again:\n');
    console.log(`  ${key}\n`);
    console.log('Copilot Studio: Authentication = API key, Parameter type = Header,');
    console.log('Header name = X-API-Key, Key value = the key above.');
    break;
  }

  case 'list': {
    const keys = store.list();
    if (keys.length === 0) {
      console.log(`No keys in ${store.filePath}`);
      break;
    }
    console.table(
      keys.map(({ id, label, status, created_at, expires_at }) => ({
        id, label, status, created_at, expires_at: expires_at ?? 'never'
      }))
    );
    break;
  }

  case 'revoke': {
    const [id] = rest;
    if (!id) fail('Usage: keys revoke <id>');
    console.log(store.revoke(id) ? `Revoked key ${id}` : `No active key with id ${id}`);
    break;
  }

  case 'check': {
    const [presented] = rest;
    if (!presented) fail('Usage: keys check <key>');
    const result = store.validate(presented);
    console.log(result.ok ? `valid: ${result.id} (${result.label})` : `invalid: ${result.reason}`);
    process.exit(result.ok ? 0 : 1);
    break;
  }

  default:
    fail('Commands: create --label <name> [--expires-days <n>] | list | revoke <id> | check <key>');
}
