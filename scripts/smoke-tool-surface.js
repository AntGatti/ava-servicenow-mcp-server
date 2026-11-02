#!/usr/bin/env node
/**
 * Avanade ServiceNow MCP Server - Tool Surface Smoke Test
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * Boots the MCP server over an in-memory transport with a stubbed ServiceNow
 * client and asserts that the wire surface still matches the frozen contract.
 *
 * Complements scripts/verify-tool-contract.js: that one reads the source text,
 * this one checks what a real MCP client actually receives. Catches regressions
 * that static analysis cannot - SDK upgrades changing registration behaviour,
 * tools failing to register, schemas going missing.
 *
 * Requires no credentials, no network and no running ServiceNow instance.
 *
 * Usage: npm run smoke:tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMcpServer } from '../src/mcp-server-consolidated.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Stub client: every ServiceNow method throws if called, so a network call during
// construction or tool registration fails loudly instead of silently reaching out.
const stubClient = new Proxy(
  {
    currentInstanceName: 'smoke',
    instanceUrl: 'https://smoke.invalid',
    getCurrentInstance: () => ({ name: 'smoke', url: 'https://smoke.invalid' }),
    setProgressCallback: () => {}
  },
  {
    get: (target, prop) =>
      prop in target
        ? target[prop]
        : async () => {
            throw new Error(`ServiceNow call '${String(prop)}' attempted during smoke test`);
          }
  }
);

const expected = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'contract', 'mcp-tool-contract.v1.json'), 'utf8')
);

const server = await createMcpServer(stubClient);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: 'contract-smoke-test', version: '1.0.0' }, { capabilities: {} });

await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const identity = client.getServerVersion();
const { tools } = await client.listTools();
const advertised = tools.map((t) => t.name).sort();

const failures = [];

if (identity.name !== expected.serverName) {
  failures.push(`server name: expected "${expected.serverName}", got "${identity.name}"`);
}
if (identity.version !== expected.serverVersion) {
  failures.push(`server version: expected "${expected.serverVersion}", got "${identity.version}"`);
}

const missing = expected.tools.filter((t) => !advertised.includes(t));
if (missing.length) {
  failures.push(`${missing.length} frozen tool(s) not advertised: ${missing.join(', ')}`);
}

const schemaless = tools.filter((t) => !t.inputSchema).map((t) => t.name);
if (schemaless.length) {
  failures.push(`${schemaless.length} tool(s) advertised without an input schema: ${schemaless.join(', ')}`);
}

const added = advertised.filter((t) => !expected.tools.includes(t));
if (added.length) console.log(`⚠️  ${added.length} tool(s) added beyond the contract (allowed): ${added.join(', ')}`);

await client.close();

if (failures.length) {
  console.error('\n❌ WIRE SURFACE DOES NOT MATCH THE FROZEN CONTRACT:\n');
  for (const f of failures) console.error(`   • ${f}`);
  console.error('\nSee docs/MIGRATION_CONTRACT.md.\n');
  process.exit(1);
}

console.log(
  `✅ Wire surface intact: "${identity.name}" v${identity.version} advertised ` +
    `${advertised.length} tools, ${tools.length}/${tools.length} with input schemas`
);
