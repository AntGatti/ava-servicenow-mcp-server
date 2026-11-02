#!/usr/bin/env node
/**
 * Avanade ServiceNow MCP Server - Tool Contract Verifier
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * Enforces the frozen client-facing contract during the Avanade conversion.
 * Existing MCP clients depend on these identifiers; removing or renaming any
 * of them is a breaking change for every deployed agent and IDE config.
 *
 * Semantics:
 *   - tools / endpoints / envVars : ADDING is allowed, removing or renaming FAILS.
 *   - serverName / serverVersion / binName : must match EXACTLY.
 *
 * Usage:
 *   node scripts/verify-tool-contract.js          verify against the manifest
 *   node scripts/verify-tool-contract.js --write  regenerate the manifest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'contract', 'mcp-tool-contract.v1.json');

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const uniqSort = (arr) => [...new Set(arr)].sort();

function extractActual() {
  const consolidated = read('src/mcp-server-consolidated.js');
  const httpServer = read('src/server.js');
  const pkg = JSON.parse(read('package.json'));

  const identity = consolidated.match(
    /new Server\(\s*\{\s*name:\s*'([^']+)'\s*,\s*version:\s*'([^']+)'/
  );
  if (!identity) {
    throw new Error('Could not locate the MCP Server identity block in src/mcp-server-consolidated.js');
  }

  const srcDir = path.join(ROOT, 'src');
  const envVars = uniqSort(
    fs.readdirSync(srcDir)
      .filter((f) => f.endsWith('.js'))
      .flatMap((f) => [
        ...fs.readFileSync(path.join(srcDir, f), 'utf8').matchAll(/process\.env\.([A-Z0-9_]+)/g)
      ].map((m) => m[1]))
  );

  return {
    serverName: identity[1],
    serverVersion: identity[2],
    binName: Object.keys(pkg.bin || {})[0] || null,
    tools: uniqSort([...consolidated.matchAll(/name:\s*'(SN-[A-Za-z0-9-]+)'/g)].map((m) => m[1])),
    endpoints: uniqSort(
      [...httpServer.matchAll(/app\.(get|post|delete|put|patch)\(\s*'([^']+)'/g)]
        .map((m) => `${m[1].toUpperCase()} ${m[2]}`)
    ),
    envVars
  };
}

const actual = extractActual();

if (process.argv.includes('--write')) {
  const manifest = {
    $comment:
      'FROZEN CLIENT-FACING CONTRACT. Do not edit by hand to silence a failure. ' +
      'Changing any value here is a breaking change for deployed MCP clients and ' +
      'requires an explicit migration decision. See docs/MIGRATION_CONTRACT.md.',
    contractVersion: 1,
    frozenAt: new Date().toISOString().slice(0, 10),
    ...actual
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✅ Wrote contract manifest: contract/mcp-tool-contract.v1.json`);
  console.log(`   ${actual.tools.length} tools, ${actual.endpoints.length} endpoints, ${actual.envVars.length} env vars`);
  process.exit(0);
}

if (!fs.existsSync(MANIFEST)) {
  console.error('❌ Contract manifest missing. Generate it with: npm run contract:write');
  process.exit(1);
}

const expected = JSON.parse(read('contract/mcp-tool-contract.v1.json'));
const failures = [];
const warnings = [];

for (const field of ['serverName', 'serverVersion', 'binName']) {
  if (actual[field] !== expected[field]) {
    failures.push(`${field}: frozen as "${expected[field]}" but found "${actual[field]}"`);
  }
}

for (const field of ['tools', 'endpoints', 'envVars']) {
  const missing = expected[field].filter((v) => !actual[field].includes(v));
  const added = actual[field].filter((v) => !expected[field].includes(v));
  if (missing.length) {
    failures.push(`${field}: ${missing.length} frozen entr${missing.length === 1 ? 'y' : 'ies'} removed or renamed -> ${missing.join(', ')}`);
  }
  if (added.length) {
    warnings.push(`${field}: ${added.length} new entr${added.length === 1 ? 'y' : 'ies'} added (allowed) -> ${added.join(', ')}`);
  }
}

for (const w of warnings) console.log(`⚠️  ${w}`);

if (failures.length) {
  console.error('\n❌ FROZEN CONTRACT VIOLATED — this breaks deployed MCP clients:\n');
  for (const f of failures) console.error(`   • ${f}`);
  console.error('\nSee docs/MIGRATION_CONTRACT.md before changing any of these identifiers.\n');
  process.exit(1);
}

console.log(`✅ Contract intact: ${expected.tools.length} tools, ${expected.endpoints.length} endpoints, ${expected.envVars.length} env vars, server "${expected.serverName}" v${expected.serverVersion}`);
