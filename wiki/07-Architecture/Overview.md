[← Home](../Home.md)

# Architecture Overview

---

## Shape

```
MCP client (Claude Code / Desktop / Copilot)
        │
        ├── stdio ──────► src/stdio-server.js      one process, one session
        │
        └── HTTP/SSE ───► src/server.js            many sessions
                               │
                               ├── SessionStore    bounded, expiring
                               │
                               └── per session:
                                   createMcpServer(client)
                                        │
                                   src/mcp-server-consolidated.js   45 tools, 2 resources
                                        │
                                   src/servicenow-client.js         axios, Basic auth
                                        │
                                   ServiceNow REST + UI APIs
```

## Modules

| File | Lines | Role |
|---|---|---|
| `mcp-server-consolidated.js` | 2,897 | Tool registration and every tool handler |
| `servicenow-client.js` | 1,624 | REST client, update-set and UI-API operations |
| `natural-language.js` | 472 | Plain English → encoded query |
| `script-sync.js` | 428 | Local ↔ ServiceNow script sync **(not exposed as tools)** |
| `resources.js` | 326 | Broader resource surface **(not wired)** |
| `server.js` | ~300 | Express, both HTTP transports, session lifecycle |
| `session-store.js` | ~150 | Bounded, expiring session registry |
| `config-manager.js` | 145 | Multi-instance config, `.env` fallback |
| `stdio-server.js` | 51 | Stdio entry point |

Two modules are implemented but unreachable: `script-sync.js` and most of
`resources.js`. Either wire them up or delete them —
[see why](../06-Governance/Documentation-Standards.md#why-rule-1-exists).

## Session model

Each HTTP session owns a full `createMcpServer()` instance **and its own
`ServiceNowClient`**. That isolation is the point: `SN-Set-Instance` mutates the client,
so a shared client leaked instance switches between users. See
[Security Posture](../06-Governance/Security-Posture.md#what-has-been-fixed).

Sessions live in a [`SessionStore`](../../src/session-store.js) with an idle TTL and a
concurrency cap. Capacity is checked *before* a transport writes any response — checking
afterwards cannot produce a 503, it can only hand the client a session ID that was never
registered.

Stdio needs none of this: one process, one session, one client.

## Metadata-driven tools

At startup the server loads `src/config/comprehensive-table-definitions.json` — metadata
for 94 ServiceNow tables. This is what lets generic tools like `SN-Query-Table` work
against any table without a tool per table, keeping the surface at 45 rather than
hundreds.

The metadata is static. A table absent from it still works through the generic tools;
it just gets no schema enrichment.

## Transports

| | Stdio | SSE (legacy) | Streamable HTTP |
|---|---|---|---|
| Session id | n/a | query string | `Mcp-Session-Id` header |
| Proxy-sensitive | no | **yes** | minimal |
| Use for | Claude Desktop | older clients | preferred for HTTP |

Both HTTP transports share `/mcp` and are distinguished by headers. See
[SSE and Reverse Proxies](../04-Deployment/SSE-and-Reverse-Proxies.md).

## Known weaknesses

- **One 2,897-line file** holds all 45 tool handlers. It is 0% covered by tests and is
  the main obstacle to confident change.
- **No authentication layer** — see [Security Posture](../06-Governance/Security-Posture.md).
- **In-memory sessions** prevent horizontal scaling without sticky sessions.
- **No structured logging or audit trail.**
- Instance switching inside `resources.js` uses mutate-and-restore, which is not safe
  for concurrent requests within a session.