#!/usr/bin/env node
/**
 * Avanade ServiceNow MCP Server - Tool Reference Generator
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * Generates wiki/02-Tool-Reference/Tool-Index.md from the live MCP server.
 *
 * Why generated rather than written: an audit of the previous hand-maintained
 * documentation found 58 tool names documented that do not exist, against 45
 * that do. Hand-maintained tool docs drift, and drifted tool docs are worse
 * than none - an agent reads them and calls a tool that was never implemented.
 * This reads the real registration, so the page cannot be wrong.
 *
 * Usage: npm run docs:tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMcpServer } from '../src/mcp-server-consolidated.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'wiki', '02-Tool-Reference', 'Tool-Index.md');

/**
 * Presentation grouping. Order matters; the first matching group wins.
 * A tool that matches nothing lands in "Other", which is the signal to come
 * back and classify it rather than a silent omission.
 */
const GROUPS = [
  ['Instance routing', ['SN-Set-Instance', 'SN-Get-Current-Instance']],
  ['Generic table operations', [
    'SN-Query-Table', 'SN-Create-Record', 'SN-Get-Record', 'SN-Update-Record',
    'SN-Get-Table-Schema', 'SN-Discover-Table-Schema', 'SN-List-Available-Tables',
    'SN-Explain-Field'
  ]],
  ['Incidents', [
    'SN-List-Incidents', 'SN-Create-Incident', 'SN-Get-Incident', 'SN-Assign-Incident',
    'SN-Resolve-Incident', 'SN-Close-Incident', 'SN-Add-Comment', 'SN-Add-Work-Notes'
  ]],
  ['Changes and problems', [
    'SN-List-ChangeRequests', 'SN-Assign-Change', 'SN-Approve-Change', 'SN-Add-Change-Comment',
    'SN-List-Problems', 'SN-Close-Problem', 'SN-Add-Problem-Comment'
  ]],
  ['Users, groups and CMDB', ['SN-List-SysUsers', 'SN-List-SysUserGroups', 'SN-List-CmdbCis']],
  ['Update sets and application scope', [
    'SN-Set-Update-Set', 'SN-Get-Current-Update-Set', 'SN-List-Update-Sets',
    'SN-Move-Records-To-Update-Set', 'SN-Clone-Update-Set', 'SN-Inspect-Update-Set',
    'SN-Set-Current-Application', 'SN-Validate-Configuration'
  ]],
  ['Workflows', [
    'SN-Create-Workflow', 'SN-Create-Activity', 'SN-Create-Transition', 'SN-Publish-Workflow'
  ]],
  ['Scripting', ['SN-Execute-Background-Script', 'SN-Create-Fix-Script']],
  ['Batch operations', ['SN-Batch-Create', 'SN-Batch-Update']],
  ['Natural language', ['SN-Natural-Language-Search']]
];

const stubClient = new Proxy(
  {
    currentInstanceName: 'docgen',
    instanceUrl: 'https://docgen.invalid',
    getCurrentInstance: () => ({ name: 'docgen', url: 'https://docgen.invalid' }),
    setProgressCallback: () => {}
  },
  {
    get: (t, p) => (p in t ? t[p] : async () => {
      throw new Error(`ServiceNow call '${String(p)}' attempted during doc generation`);
    })
  }
);

const escape = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();

/** Render one tool's parameter table, or a note when it takes none. */
function renderParams(schema) {
  const props = schema?.properties ?? {};
  const names = Object.keys(props);
  if (names.length === 0) return '_No parameters._\n';

  const required = new Set(schema.required ?? []);
  const rows = names.map((name) => {
    const p = props[name] ?? {};
    const type = p.type ?? (p.enum ? 'enum' : 'any');
    const allowed = p.enum ? ` One of: ${p.enum.map((v) => `\`${v}\``).join(', ')}.` : '';
    const dflt = p.default !== undefined ? ` Default: \`${JSON.stringify(p.default)}\`.` : '';
    return `| \`${name}\` | ${type} | ${required.has(name) ? 'yes' : 'no'} | ${escape(p.description)}${allowed}${dflt} |`;
  });

  return ['| Parameter | Type | Required | Description |', '|---|---|---|---|', ...rows].join('\n') + '\n';
}

const server = await createMcpServer(stubClient);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: 'doc-generator', version: '1.0.0' }, { capabilities: {} });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const identity = client.getServerVersion();
const { tools } = await client.listTools();
const byName = new Map(tools.map((t) => [t.name, t]));

const grouped = [];
const claimed = new Set();
for (const [title, names] of GROUPS) {
  const members = names.filter((n) => byName.has(n));
  members.forEach((n) => claimed.add(n));
  if (members.length) grouped.push([title, members]);
}
const unclaimed = tools.map((t) => t.name).filter((n) => !claimed.has(n)).sort();
if (unclaimed.length) grouped.push(['Other', unclaimed]);

const lines = [];
lines.push('# Tool Index');
lines.push('');
lines.push('> **Generated file - do not edit by hand.**');
lines.push('> Produced from the live MCP server by `npm run docs:tools`');
lines.push('> ([scripts/generate-tool-reference.js](../../scripts/generate-tool-reference.js)).');
lines.push('> Edits here are overwritten on the next run; change the tool definition instead.');
lines.push('');
lines.push(`Server \`${identity.name}\` v${identity.version} advertises **${tools.length} tools**.`);
lines.push('');
lines.push('Every tool name on this page is frozen by the');
lines.push('[Frozen Contract](../06-Governance/Frozen-Contract.md). Renaming one breaks every');
lines.push('deployed client.');
lines.push('');
lines.push('All tools accept an optional `instance` parameter to target a configured');
lines.push('ServiceNow instance for that call. See [Multi-Instance Routing](../05-Operations/Multi-Instance-Routing.md).');
lines.push('');

lines.push('## Contents');
lines.push('');
for (const [title, members] of grouped) {
  const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  lines.push(`- [${title}](#${anchor}) — ${members.length} tool${members.length === 1 ? '' : 's'}`);
}
lines.push('');
lines.push('---');
lines.push('');

for (const [title, members] of grouped) {
  lines.push(`## ${title}`);
  lines.push('');
  for (const name of members) {
    const tool = byName.get(name);
    lines.push(`### \`${name}\``);
    lines.push('');
    lines.push(escape(tool.description) || '_No description provided._');
    lines.push('');
    lines.push(renderParams(tool.inputSchema));
  }
  lines.push('---');
  lines.push('');
}

lines.push(`_Generated ${new Date().toISOString().slice(0, 10)} from ${tools.length} registered tools._`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n') + '\n');

await client.close();
console.log(`✅ Wrote wiki/02-Tool-Reference/Tool-Index.md (${tools.length} tools, ${grouped.length} groups)`);
if (unclaimed.length) {
  console.log(`⚠️  ${unclaimed.length} tool(s) fell into "Other" and need classifying: ${unclaimed.join(', ')}`);
}
