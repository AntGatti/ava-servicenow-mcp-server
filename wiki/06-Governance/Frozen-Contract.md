[← Home](../Home.md)

# Frozen Contract

**Status:** FROZEN · **Contract version:** 1
**Manifest:** [contract/mcp-tool-contract.v1.json](../../contract/mcp-tool-contract.v1.json)
**Enforced by:** `npm run contract:verify` · `npm run smoke:tools`

---

## Why

This server is a rebrand of an **already-deployed** MCP server. Live agents, IDE
configurations and the ARIA agent suite bind to the identifiers below by name.
Renaming one does not fail at build time — it fails inside an agent conversation as
"tool not found", far from the commit that caused it.

Rebranding is therefore scoped to **packaging and presentation**: package name, author,
licence, documentation, container image, repository URL. It does not touch the protocol
surface.

---

## The five frozen items

### 1. Tool names — 45

All keep the `SN-` prefix. It is **not** rebranded to `AVA-`. The authoritative list is
[Tool Index](../02-Tool-Reference/Tool-Index.md), generated from the live server.

Tool **input schemas** are part of the contract too. Adding an optional parameter is
safe. Renaming a parameter, or promoting an optional one to required, is breaking.

### 2. MCP server identity

| Field | Frozen value |
|---|---|
| `name` | `servicenow-server` |
| `version` | `2.0.0` |

Deliberately not Avanade-branded. Avanade identity lives in the package name, the
description and this wiki.

> The npm package version is independent of the MCP handshake `version` and may be
> bumped freely.

### 3. HTTP endpoints

```
GET    /mcp          SSE transport + streamable GET
POST   /mcp          JSON-RPC messages
DELETE /mcp          streamable session teardown
GET    /health       health probe
GET    /instances    instance enumeration
```

Paths and methods are frozen. Response **bodies** may be hardened — trimming the
instance URL out of `/health`, or requiring auth on `/instances` — because that changes
the payload, not the route.

### 4. Environment variable names

```
SERVICENOW_INSTANCE_URL   SERVICENOW_USERNAME   SERVICENOW_PASSWORD
SERVICENOW_INSTANCE       SERVICENOW_INSTANCE_NAME
PORT                      DEBUG                 SSE_KEEPALIVE_INTERVAL
```

New settings use `AVANADE_MCP_*` so existing configuration keeps working.

### 5. CLI binary name

`servicenow-mcp-server` → `src/stdio-server.js`

Retained even though the package is now scoped `@avanade/servicenow-mcp-server`,
because stdio client configs invoke the binary by this name.

---

## How changes are allowed

The verifier treats the contract as a **floor, not an exact match**:

| Change | Result |
|---|---|
| Adding a tool, endpoint or env var | ⚠️ warning, allowed |
| Removing or renaming any of them | ❌ build fails |
| Changing server name, server version or bin name | ❌ build fails |

This is what lets the hardening work add `AVANADE_MCP_*` settings and new routes freely
while making a regression on the existing surface impossible to merge by accident.

### If a break is genuinely required

1. Raise it as an explicit migration decision. **Do not edit the manifest to go green.**
2. Ship the replacement *alongside* the old identifier, old delegating to new.
3. Announce a deprecation window to consumers, including the ARIA agents.
4. Only once every client has migrated, bump to `mcp-tool-contract.v2.json` and
   regenerate with `npm run contract:write`.

---

## The two checks

```bash
npm run contract:verify   # static: reads the source text
npm run smoke:tools       # dynamic: boots the server, inspects real wire output
```

They are complementary. `contract:verify` catches a rename in source.
`smoke:tools` catches a tool that silently fails to register — which static analysis
cannot see. It is what validated the 1.25 → 1.32 MCP SDK upgrade as safe.

Neither needs credentials, a network or a running server, and both are independent of
the Jest suite — deliberately, because
[the Jest suite proves very little right now](Documentation-Standards.md#testing-honesty).
