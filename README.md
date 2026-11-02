<div align="center">
  <img src="assets/logo.svg" alt="Avanade ServiceNow MCP Server" width="200"/>

  # Avanade ServiceNow MCP Server

  **Version 2.0** · Multi-instance Model Context Protocol server for ServiceNow

  Connect Claude, GitHub Copilot or any MCP client to one or many ServiceNow
  instances: 45 tools, generic CRUD over any table, and automated
  background-script execution.

  *An Avanade internal engineering asset · in development since October 2026*

  [![License: Avanade Proprietary](https://img.shields.io/badge/License-Avanade%20Proprietary-C8102E.svg)](LICENSE)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
  [![ServiceNow](https://img.shields.io/badge/ServiceNow-Compatible-00a3ba)](https://www.servicenow.com)
  [![Contract](https://img.shields.io/badge/client%20contract-frozen%20v1-blue)](wiki/06-Governance/Frozen-Contract.md)

</div>

---

## Contents

- [What this is](#what-this-is)
- [Quick start](#quick-start)
- [Configuring instances](#configuring-instances)
- [How instance selection works](#how-instance-selection-works)
- [Tool catalogue — all 45 tools](#tool-catalogue--all-45-tools)
- [MCP resources](#mcp-resources)
- [Connecting a client](#connecting-a-client)
- [Running in Docker](#running-in-docker)
- [Environment variables](#environment-variables)
- [Architecture](#architecture)
- [Client contract and compatibility](#client-contract-and-compatibility)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## What this is

A Node.js MCP server that exposes ServiceNow to AI assistants. It is metadata-driven:
generic CRUD tools work against **any** ServiceNow table by name, with a curated
catalogue of 162 tables (ITSM, CMDB, Service Catalog, platform development, workflows,
Flow Designer, integration) used for schema hints and discovery.

**At a glance**

| | |
|---|---|
| MCP tools | **45** — frozen client contract, see [Frozen Contract](wiki/06-Governance/Frozen-Contract.md) |
| MCP resources | **2** read-only `servicenow://` URIs |
| Tables | Generic CRUD on any table; **162** in the curated catalogue |
| Instances | Unlimited, configured in one file, switched per session |
| Transports | HTTP + SSE (`src/server.js`), stdio (`src/stdio-server.js`) |
| Server identity | `servicenow-server` v2.0.0, bin `servicenow-mcp-server` |
| Node.js | 18+ (Docker image builds on Node 22) |

**What's in v2.0**

- Multi-instance routing with per-session instance switching
- 45 tools: generic CRUD, ITSM convenience operations, update-set management,
  workflow creation, batch operations, natural-language search, schema discovery
- Automated background-script execution via the `sys_trigger` table (~1 second,
  trigger auto-deletes), with fix-script generation as fallback
- 2 read-only MCP resources for server/instance details and the table catalogue
- SSE keepalive heartbeat (15 s default) so connections survive Docker, Kubernetes
  and reverse-proxy idle timeouts
- Bounded, expiring session store — sessions cap at 100 and expire after 1 hour idle
- Frozen client contract with automated verification (`npm run contract:verify`)

---

## Quick start

**Prerequisites:** Node.js 18+, a ServiceNow instance with REST API access, and
credentials for a user with the roles your operations need.

```bash
git clone https://github.com/ava-innersource/servicenow-mcp-server.git
cd servicenow-mcp-server
npm install
```

Configure at least one instance (see [below](#configuring-instances)), then:

```bash
npm run dev          # HTTP + SSE server on :3000, with reload
# or
npm start            # HTTP + SSE server on :3000
# or
npm run stdio        # stdio transport, for Claude Desktop / IDE clients
```

Verify:

```bash
curl http://localhost:3000/health      # server status
curl http://localhost:3000/instances   # configured instances
npm run inspector                      # MCP Inspector against http://localhost:3000/mcp
```

---

## Configuring instances

### Multi-instance (recommended)

```bash
cp config/servicenow-instances.json.example config/servicenow-instances.json
```

```json
{
  "instances": [
    {
      "name": "dev",
      "url": "https://dev123456.service-now.com",
      "username": "admin",
      "password": "your-password",
      "default": true
    },
    {
      "name": "prod",
      "url": "https://prod789012.service-now.com",
      "username": "integration_user",
      "password": "your-password"
    }
  ]
}
```

Exactly one instance should carry `"default": true` — that is the instance the server
starts on. Restart the server after editing the file.

### Single instance via `.env`

Supported for backward compatibility and for container deployments where mounting a
config file is inconvenient:

```bash
cp .env.example .env
```

```ini
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password
SERVICENOW_INSTANCE_NAME=default
PORT=3000
DEBUG=true
```

> **Never commit `.env` or `config/servicenow-instances.json`.** Both hold plaintext
> credentials and are git-ignored. Use your platform's secret store in deployed
> environments.

---

## How instance selection works

Instance selection is **per session**, not per call. This matters when writing agent
prompts — it is the most common source of "it wrote to the wrong instance" bugs.

**1. Switch the session's active instance** with `SN-Set-Instance`. Every subsequent
tool call in that session targets it until changed:

```javascript
SN-Set-Instance({ instance_name: "prod" })
SN-Query-Table({ table_name: "incident", query: "active=true", limit: 10 })  // -> prod

SN-Set-Instance({})            // no argument: lists instances and shows the active one
SN-Get-Current-Instance({})    // confirm before any write
```

**2. Eleven convenience tools also accept a per-call `instance`,** which overrides the
session instance for that call only:

`SN-Add-Comment` · `SN-Add-Work-Notes` · `SN-Assign-Incident` · `SN-Resolve-Incident` ·
`SN-Close-Incident` · `SN-Add-Change-Comment` · `SN-Assign-Change` · `SN-Approve-Change` ·
`SN-Add-Problem-Comment` · `SN-Close-Problem` · `SN-Set-Instance`

```javascript
SN-Add-Work-Notes({
  incident_number: "INC0012345",
  work_notes: "Restarted application server.",
  instance: "prod"
})
```

The other 34 tools have **no** `instance` parameter. Passing one is silently ignored —
call `SN-Set-Instance` first instead.

---

## Tool catalogue — all 45 tools

Tool names are frozen. See [Client contract and compatibility](#client-contract-and-compatibility).

### Instance management (2)

| Tool | Purpose |
|---|---|
| `SN-Set-Instance` | Switch the session's active instance; lists instances when called with no argument |
| `SN-Get-Current-Instance` | Report the currently active instance |

### Generic CRUD and schema — works on any table (7)

| Tool | Purpose |
|---|---|
| `SN-Query-Table` | Query any table with an encoded query, field selection, paging, ordering |
| `SN-Create-Record` | Create a record in any table |
| `SN-Get-Record` | Fetch one record by `sys_id` |
| `SN-Update-Record` | Update a record by `sys_id` |
| `SN-Get-Table-Schema` | Required fields, common fields, field descriptions |
| `SN-Discover-Table-Schema` | Deep schema including relationships |
| `SN-List-Available-Tables` | Browse the curated table catalogue |

```javascript
SN-Query-Table({
  table_name: "incident",
  query: "active=true^priority=1",
  fields: "number,short_description,assigned_to",
  limit: 25,
  order_by: "-sys_created_on"
})

SN-Create-Record({
  table_name: "sys_properties",
  data: { name: "x_custom.setting", value: "enabled" }
})

SN-Update-Record({
  table_name: "incident",
  sys_id: "abc123...",
  data: { state: 6, close_notes: "Resolved" }
})
```

### Record listing — typed shortcuts (8)

| Tool | Table |
|---|---|
| `SN-List-Incidents` | `incident` |
| `SN-Create-Incident` | `incident` |
| `SN-Get-Incident` | `incident` |
| `SN-List-ChangeRequests` | `change_request` |
| `SN-List-Problems` | `problem` |
| `SN-List-SysUsers` | `sys_user` |
| `SN-List-SysUserGroups` | `sys_user_group` |
| `SN-List-CmdbCis` | `cmdb_ci` |

### ITSM convenience operations (10)

These take the **record number**, not a `sys_id`, and resolve user and group names
automatically — designed for agent conversations where the number is what the user says.

| Tool | Required arguments |
|---|---|
| `SN-Add-Comment` | `incident_number`, `comment` |
| `SN-Add-Work-Notes` | `incident_number`, `work_notes` |
| `SN-Assign-Incident` | `incident_number`, `assigned_to` (+ optional `assignment_group`) |
| `SN-Resolve-Incident` | `incident_number`, `resolution_notes` (+ optional `resolution_code`) |
| `SN-Close-Incident` | `incident_number`, `close_notes` (+ optional `close_code`) |
| `SN-Add-Change-Comment` | `change_number`, `comment` |
| `SN-Assign-Change` | `change_number`, `assigned_to` (+ optional `assignment_group`) |
| `SN-Approve-Change` | `change_number` (+ optional `comments`) |
| `SN-Add-Problem-Comment` | `problem_number`, `comment` |
| `SN-Close-Problem` | `problem_number` (+ close details) |

```javascript
SN-Assign-Incident({
  incident_number: "INC0012345",
  assigned_to: "Jane Doe",
  assignment_group: "Network Support"
})

SN-Resolve-Incident({
  incident_number: "INC0012345",
  resolution_notes: "Replaced the failed switch port.",
  resolution_code: "Solved (Permanently)"
})
```

All ten accept an optional `instance`.

### Natural-language search (1)

`SN-Natural-Language-Search` converts plain English into a ServiceNow encoded query,
runs it, and returns both the records and the query it generated — so you can inspect
and reuse the translation.

```javascript
SN-Natural-Language-Search({
  query: "unassigned P2 incidents created today",
  table: "incident",     // default: "incident"
  limit: 25,
  fields: "number,short_description,priority",
  show_patterns: true    // include how each phrase was parsed
})
```

Recognised patterns: priority (`P1`-`P5`, high/low), assignment (`assigned to me`,
`unassigned`, `assigned to <name>`), dates (`created today`, `last 7 days`, `recent`),
states (new/open/closed/in progress), content (`about SAP`, `containing error`),
impact and urgency, and record numbers (`number is INC0012345`).

Use it for exploration. For automation, read the encoded query it returns and pass that
to `SN-Query-Table` — the translation is deterministic, but the phrasing is not.

### Update-set management (6)

| Tool | Purpose |
|---|---|
| `SN-Set-Update-Set` | Make an update set current (automated via `sys_trigger`) |
| `SN-Get-Current-Update-Set` | Report the active update set |
| `SN-List-Update-Sets` | List update sets with filtering |
| `SN-Move-Records-To-Update-Set` | Move `sys_update_xml` records between sets — by sys_id list, time range, or source set name |
| `SN-Clone-Update-Set` | Copy an update set and all its records |
| `SN-Inspect-Update-Set` | Component breakdown and missing-dependency check |

```javascript
// Rescue records that landed in "Default"
SN-Move-Records-To-Update-Set({
  update_set_id: "target_set_sys_id",
  source_update_set: "Default",
  time_range: { start: "2026-10-15 09:00:00", end: "2026-10-15 11:30:00" }
})
```

`SN-Move-Records-To-Update-Set`, `SN-Clone-Update-Set`, `SN-Batch-Create`,
`SN-Batch-Update` and `SN-Create-Workflow` emit MCP progress notifications during
execution (`progress: true` by default).

### Application scope (1)

| Tool | Purpose |
|---|---|
| `SN-Set-Current-Application` | Set the active application scope for scoped-app development |

### Script execution (2)

| Tool | Purpose |
|---|---|
| `SN-Execute-Background-Script` | Run server-side JavaScript |
| `SN-Create-Fix-Script` | Generate a fix script for manual execution |

`SN-Execute-Background-Script` has three strategies:

1. **`sys_trigger`** (default, most reliable) — creates a scheduled job that runs in
   about a second and deletes its own trigger
2. **UI endpoint** (`sys.scripts.do`) — direct execution
3. **Fix script** — writes a script for manual execution in the ServiceNow UI

```javascript
SN-Execute-Background-Script({
  script: "gs.info('Hello from an automated script');",
  description: "Smoke test"
})
```

Output goes to ServiceNow **System Logs → System Log → All**. The call returns when the
job is *scheduled*, not when it has finished — allow ~2 seconds before reading results.

### Workflows (4)

| Tool | Purpose |
|---|---|
| `SN-Create-Workflow` | Full lifecycle: workflow → version → activities → transitions → optional publish |
| `SN-Create-Activity` | Add an activity (with embedded JavaScript) to an existing workflow version |
| `SN-Create-Transition` | Link two activities, with an optional condition script |
| `SN-Publish-Workflow` | Publish a workflow version |

```javascript
SN-Create-Workflow({
  name: "Auto-Approve Standard Changes",
  table: "change_request",
  condition: "type=standard",
  activities: [
    { name: "Check Risk", script: "workflow.scratchpad.risk = current.risk;" },
    { name: "Approve",    script: "current.approval = 'approved'; current.update();" }
  ],
  transitions: [{ from: "Check Risk", to: "Approve" }],
  publish: true
})
```

### Batch operations (2)

| Tool | Purpose |
|---|---|
| `SN-Batch-Create` | Create related records in one call; `${save_as}` references link them |
| `SN-Batch-Update` | Update many records across tables |

```javascript
SN-Batch-Create({
  operations: [
    { table: "sc_cat_item",     data: { name: "New Laptop" }, save_as: "item" },
    { table: "item_option_new", data: { cat_item: "${item}", name: "model" } }
  ],
  transaction: true    // all-or-nothing, default
})

SN-Batch-Update({
  updates: [
    { table: "incident", sys_id: "id1", data: { priority: 2 } },
    { table: "incident", sys_id: "id2", data: { priority: 2 } }
  ],
  stop_on_error: false
})
```

### Inspection and validation (2)

| Tool | Purpose |
|---|---|
| `SN-Explain-Field` | Field type, constraints, choices, known issues, usage examples |
| `SN-Validate-Configuration` | Validate a catalog item's variables, UI policies and business rules |

`SN-Explain-Field` resolves inherited fields by walking the table hierarchy, so
`incident.priority` is found on `task` and reported with `defined_on: task` and
`inherited: true`. Note that it takes `table` and `field`, not the `table_name` naming
the other schema tools use.

---

## MCP resources

Two read-only resources are registered, for lookups that do not warrant a tool call.
Both were verified against a live instance.

| URI | Returns |
|---|---|
| `servicenow://instance` | Server details and the connected instance |
| `servicenow://tables/all` | The full curated table catalogue (about 52 KB of JSON) |

> `src/resources.js` defines a richer, instance-scoped set (`servicenow://{instance}/incidents`
> and similar, 8 URIs in total). **That module is not imported by the server** and none of
> those URIs are advertised or readable. Treat it as unfinished work rather than as
> available surface.

---

## Connecting a client

### HTTP + SSE

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/mcp` | Open the SSE stream |
| `POST` | `/mcp` | Send a JSON-RPC message |
| `DELETE` | `/mcp` | Terminate a session |
| `GET` | `/health` | Health check |
| `GET` | `/instances` | List configured instances |

In MCP Inspector choose transport **Streamable HTTP (SSE)** and URL
`http://localhost:3000/mcp`.

### Claude Desktop (stdio)

Add to `claude_desktop_config.json` — macOS:
`~/Library/Application Support/Claude/claude_desktop_config.json`;
Windows: `%APPDATA%\Claude\claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "servicenow": {
      "command": "node",
      "args": ["/path/to/servicenow-mcp-server/src/stdio-server.js"],
      "cwd": "/path/to/servicenow-mcp-server",
      "env": {
        "SERVICENOW_INSTANCE_URL": "https://your-instance.service-now.com",
        "SERVICENOW_USERNAME": "your-username",
        "SERVICENOW_PASSWORD": "your-password"
      }
    }
  }
}
```

Restart Claude Desktop fully (quit, not just close the window) for the tools to appear.
Full walkthrough: [Client Setup](wiki/01-Getting-Started/Client-Setup.md).

With a multi-instance config file present, set `SERVICENOW_INSTANCE` to pick the
starting instance by name instead of supplying URL and credentials.

---

## Running in Docker

```bash
docker compose up -d
docker compose logs -f
curl http://localhost:3000/health
```

`docker-compose.yml` mounts `config/servicenow-instances.json` read-only and reads
credentials from your shell environment or a local `.env`. The image is a two-stage
Node 22 Alpine build running `src/server.js`, with a built-in healthcheck.

Behind nginx, Traefik or HAProxy, SSE needs buffering disabled and a read timeout longer
than the keepalive interval. Full configurations:
[SSE and Reverse Proxies](wiki/04-Deployment/SSE-and-Reverse-Proxies.md).

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `SERVICENOW_INSTANCE_URL` | — | Instance URL (single-instance mode) |
| `SERVICENOW_USERNAME` | — | Username (single-instance mode) |
| `SERVICENOW_PASSWORD` | — | Password (single-instance mode) |
| `SERVICENOW_INSTANCE_NAME` | `default` | Name for the single configured instance |
| `SERVICENOW_INSTANCE` | — | Select a named instance from the config file at startup |
| `PORT` | `3000` | HTTP listen port |
| `DEBUG` | — | Verbose logging when `true` |
| `SSE_KEEPALIVE_INTERVAL` | `15000` | SSE heartbeat in ms; lower it if a proxy closes idle streams |
| `AVANADE_MCP_MAX_SESSIONS` | `100` | Concurrent session cap |
| `AVANADE_MCP_SESSION_TTL_MS` | `3600000` | Idle time before a session is evicted |

The `SERVICENOW_*`, `PORT`, `DEBUG` and `SSE_KEEPALIVE_INTERVAL` names are part of the
frozen contract. The `AVANADE_MCP_*` settings are additive and carry their own prefix so
existing deployments are unaffected.

---

## Architecture

```
src/
├── server.js                    # Express HTTP + SSE transport, keepalive, session lifecycle
├── stdio-server.js              # Stdio transport (Claude Desktop, IDE clients)
├── mcp-server-consolidated.js   # Tool registration and dispatch - all 45 tools
├── servicenow-client.js         # ServiceNow REST client, auth, instance switching
├── config-manager.js            # Multi-instance configuration loading and lookup
├── session-store.js             # Bounded, TTL-expiring MCP session registry
├── natural-language.js          # Plain English -> encoded query translation
├── resources.js                 # Unused: defines 8 resources, not imported (see MCP resources)
├── script-sync.js               # Imported but unused: exports are never called
└── config/
    ├── table-definitions.json                 # 162-table curated catalogue
    └── comprehensive-table-definitions.json   # Detailed schema hints

config/servicenow-instances.json   # Your instances (git-ignored)
contract/mcp-tool-contract.v1.json # Frozen client-facing surface
scripts/verify-tool-contract.js    # Contract enforcement
scripts/smoke-tool-surface.js      # Wire-level tool surface check
```

**Design notes**

- **Metadata-driven.** No per-table tool generation; generic tools take `table_name`,
  so custom and scoped tables work without code changes.
- **One client per session.** Each MCP session holds its own server instance and
  ServiceNow client, which is why `SN-Set-Instance` is session-scoped.
- **Bounded sessions.** Abandoned SSE connections used to accumulate for the process
  lifetime. `session-store.js` caps and expires them, running cleanup on eviction.

---

## Client contract and compatibility

This server is already deployed. Live agents, IDE configurations and the ARIA agent
suite bind to its identifiers, so **five things are frozen** at contract version 1
(frozen 2026-11-02):

1. The 45 tool names, including the `SN-` prefix — it is *not* rebranded to `AVA-`
2. The server name `servicenow-server`
3. The bin name `servicenow-mcp-server`
4. The five HTTP endpoints
5. The eight contract environment variable names

```bash
npm run contract:verify   # fails the build if any frozen identifier moved
npm run smoke:tools       # checks the live tool surface over the wire
```

Renaming any frozen identifier breaks every deployed client, and the failure surfaces as
"tool not found" inside an agent conversation — far from the commit that caused it. If a
change is genuinely required, follow the process in
[Frozen Contract](wiki/06-Governance/Frozen-Contract.md). Do not edit the contract JSON
to silence a failing check.

Rebranding is scoped to packaging and presentation: package name, author, licence,
documentation, Docker image, repository URL. It does not touch the protocol surface.

---

## Testing

```bash
npm test               # 10 suites, 244 tests
npm run test:watch
npm run test:coverage  # fails by design - see below
npm run contract:verify
npm run smoke:tools
```

**Read this before trusting a green run.** All 244 tests pass, but coverage of `src/` is
**11% of statements** and very unevenly spread:

| Module | Statements | Note |
|---|---|---|
| `config-manager.js` | 100% | Tested against the real module |
| `session-store.js` | 100% | Tested against the real module |
| `script-sync.js` | 11% | Partially exercised |
| `servicenow-client.js` | 7% | Partially exercised |
| `mcp-server-consolidated.js` | **0%** | **All 45 tool handlers are untested** |
| `natural-language.js` | 0% | Untested |
| `resources.js` | 0% | Untested |

The uncovered suites assert against mocks and against logic reimplemented inline in the
test files rather than importing production code. The 80% `coverageThreshold` in
`jest.config.js` is kept as a target, so `test:coverage` fails by design.

A green suite is therefore **not** evidence that the tool handlers work.
`contract:verify` and `smoke:tools` are the only automated statement about the
client-facing surface, and they confirm that tools are registered and well-formed, not
that they return correct data. Tests against the handler layer are open work.

---

## Known limitations

**Not possible through the REST API**

- Flow Designer logic blocks (IF / FOREACH) — build in the UI or from templates
- Flow compilation and validation — flows compile in the UI
- UI Policy Action linking — needs a background script using `setValue()`

**Covered by workarounds**

- Background scripts execute automatically via `sys_trigger`
- Update-set operations are fully automated through REST
- Generic table tools work on custom and scoped tables
- Workflow creation is fully supported programmatically

Detail: [Platform Limitations](wiki/07-Architecture/Platform-Limitations.md).

---

## Troubleshooting

### Connection

```bash
curl -u user:pass "https://your-instance.service-now.com/api/now/table/incident?sysparm_limit=1"
curl http://localhost:3000/health
curl http://localhost:3000/instances
```

### Tools do not appear

Check the server log for registration errors, confirm the client is pointed at `/mcp`,
and confirm credentials are valid — an auth failure at startup can leave the tool list
empty.

### Multi-instance not working

Confirm `config/servicenow-instances.json` exists and is valid JSON, that exactly one
instance has `"default": true`, and restart — the config is read at startup.

### Wrong instance was written to

Call `SN-Get-Current-Instance` to see the active instance for the session. Remember that
only the eleven convenience tools honour a per-call `instance`; everything else follows
`SN-Set-Instance`.

### 403 Permission denied

Usually missing roles on system tables (`sys_dictionary`, `sys_db_object`) — typically
`personalize_dictionary` or `security_admin`. See
[Permissions and 403s](wiki/05-Operations/Permissions-and-403s.md).

### SSE connection drops in Docker or behind a proxy

Lower `SSE_KEEPALIVE_INTERVAL` below the proxy idle timeout and disable response
buffering. See [SSE and Reverse Proxies](wiki/04-Deployment/SSE-and-Reverse-Proxies.md).

### Background script appears to do nothing

The tool returns when the `sys_trigger` job is scheduled, not when it completes. Wait
~2 seconds, then check **System Logs → System Log → All**.

### Verbose logging

```bash
DEBUG=true npm run dev
```

---

## Documentation

Full documentation lives in the wiki — start at [Home](wiki/Home.md) or the
[sidebar index](wiki/_Sidebar.md).

**Getting started**

- [Installation](wiki/01-Getting-Started/Installation.md) — install and run locally
- [Configuration](wiki/01-Getting-Started/Configuration.md) — point it at your instances
- [Client Setup](wiki/01-Getting-Started/Client-Setup.md) — Claude Desktop, Claude Code, Copilot

**Tools and resources**

- [Tool Index](wiki/02-Tool-Reference/Tool-Index.md) — every tool and its parameters, generated from source
- [Usage Patterns](wiki/02-Tool-Reference/Usage-Patterns.md) — worked examples
- [MCP Resources](wiki/03-Resources/MCP-Resources.md)

**Deployment and operations**

- [Docker](wiki/04-Deployment/Docker.md) · [SSE and Reverse Proxies](wiki/04-Deployment/SSE-and-Reverse-Proxies.md)
- [Multi-Instance Routing](wiki/05-Operations/Multi-Instance-Routing.md)
- [Troubleshooting](wiki/05-Operations/Troubleshooting.md) · [Permissions and 403s](wiki/05-Operations/Permissions-and-403s.md)

**Governance**

- [Frozen Contract](wiki/06-Governance/Frozen-Contract.md) — the frozen surface and how to change it
- [Security Posture](wiki/06-Governance/Security-Posture.md)
- [Documentation Standards](wiki/06-Governance/Documentation-Standards.md)

**Architecture**

- [Overview](wiki/07-Architecture/Overview.md)
- [Platform Limitations](wiki/07-Architecture/Platform-Limitations.md) — Flow Designer and other REST boundaries
- [Archive](wiki/08-Archive/README.md) — disposition of the legacy documentation tree

> The legacy `docs/` tree is kept locally but is no longer in version control. Where it
> and the wiki disagree, the wiki is correct.

**For AI agents working in this repo** — [CLAUDE.md](CLAUDE.md).

---

## Acknowledgments

Inspired by the [Echelon AI Labs ServiceNow MCP Server](https://github.com/echelon-ai-labs/servicenow-mcp).
We are grateful for their pioneering work in bringing Model Context Protocol capabilities
to ServiceNow, which informed this multi-instance, metadata-driven implementation.

What this implementation adds: multi-instance support with session-scoped routing,
automated background-script execution via `sys_trigger`, update-set management including
record movement and cloning, natural-language search, programmatic workflow creation,
and a frozen, machine-verified client contract.

---

## License

**Avanade Proprietary — Internal Use Only.** See [LICENSE](LICENSE) for full terms.

**Copyright © 2026 Avanade Inc. All rights reserved.**

This software is the confidential and proprietary information of Avanade Inc. It is
licensed for internal Avanade business purposes and for delivery of services to Avanade
clients under a valid engagement. It must not be published to any public repository,
package registry or container registry.

This is bespoke custom code, not an Avanade product or supported offering. There is no
product support, service level or maintenance commitment — whoever deploys it owns its
dependency updates, security patching and ServiceNow compatibility. See clause 4 of the
[LICENSE](LICENSE).
