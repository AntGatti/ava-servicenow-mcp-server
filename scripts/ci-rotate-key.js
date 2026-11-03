/**
 * Avanade ServiceNow MCP Server - CI key rotation helper
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * Adds a new API key to the key file on the deployed App Service through the
 * Kudu VFS API, and writes the plaintext key to a local file for the caller to
 * store. The key is never printed.
 *
 * Environment:
 *   PUBLISH_PROFILE  contents of the app's publish profile XML
 *   KEY_LABEL        label for the new key
 *   KEY_OUT_FILE     where to write the plaintext key
 *   KEY_FILE_PATH    path of the key file on the app, relative to /home (default data/api-keys.json)
 *   EXPIRES_DAYS     optional expiry in days
 */

import fs from 'node:fs';
import { generateKey } from '../src/api-keys.js';

const { PUBLISH_PROFILE, KEY_LABEL, KEY_OUT_FILE } = process.env;
const remotePath = process.env.KEY_FILE_PATH || 'data/api-keys.json';
const days = process.env.EXPIRES_DAYS ? Number(process.env.EXPIRES_DAYS) : null;

if (!PUBLISH_PROFILE || !KEY_LABEL || !KEY_OUT_FILE) {
  console.error('PUBLISH_PROFILE, KEY_LABEL and KEY_OUT_FILE are required');
  process.exit(1);
}
if (days !== null && !(days > 0)) {
  console.error('EXPIRES_DAYS must be a positive number');
  process.exit(1);
}

// The publish profile lists a zip-deploy entry carrying the Kudu credentials.
const zipDeploy = /<publishProfile[^>]*publishMethod="ZipDeploy"[^>]*>/.exec(PUBLISH_PROFILE)?.[0];
const attr = (name) => new RegExp(`${name}="([^"]*)"`).exec(zipDeploy ?? '')?.[1];
const host = attr('publishUrl')?.replace(/:443$/, '');
const user = attr('userName');
const password = attr('userPWD');
if (!host || !user || !password) {
  console.error('Could not read Kudu credentials from the publish profile');
  process.exit(1);
}

const base = `https://${host}/api/vfs/${remotePath}`;
const headers = { Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}` };

const current = await fetch(base, { headers });
let keys = [];
if (current.status === 200) {
  keys = JSON.parse(await current.text()).keys ?? [];
} else if (current.status === 404) {
  // First key: make sure the directory exists before writing the file.
  const dir = base.slice(0, base.lastIndexOf('/') + 1);
  await fetch(dir, { method: 'PUT', headers });
} else {
  console.error(`Could not read the key file (HTTP ${current.status})`);
  process.exit(1);
}

const expiresAt = days ? Date.now() + days * 86_400_000 : null;
const { key, record } = generateKey({ label: KEY_LABEL, expiresAt });

const write = await fetch(base, {
  method: 'PUT',
  headers: { ...headers, 'If-Match': '*', 'Content-Type': 'application/json' },
  body: `${JSON.stringify({ keys: [...keys, record] }, null, 2)}\n`
});
if (!write.ok) {
  console.error(`Could not write the key file (HTTP ${write.status})`);
  process.exit(1);
}

fs.writeFileSync(KEY_OUT_FILE, key, { mode: 0o600 });
console.log(`Added key ${record.id} (${KEY_LABEL}); expires: ${record.expires_at ?? 'never'}`);
console.log(`Key file now holds ${keys.length + 1} keys`);
