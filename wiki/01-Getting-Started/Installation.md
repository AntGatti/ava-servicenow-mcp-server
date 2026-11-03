[← Home](../Home.md)

# Installation

## Requirements

- **Node.js 18+** (CI and the container image use Node 22)
- A ServiceNow instance and a service account with the roles your tools need
  — see [Permissions and 403s](../05-Operations/Permissions-and-403s.md)

## Install

```bash
git clone https://github.com/ava-innersource/servicenow-mcp-server.git
cd servicenow-mcp-server
npm install
```

Then configure credentials — the server will not start without them.
See [Configuration](Configuration.md).

## The two transports

The server runs in one of two modes. They are separate entry points and can run
at the same time without conflicting.

| | HTTP / SSE | Stdio |
|---|---|---|
| Entry point | `src/server.js` | `src/stdio-server.js` |
| Start with | `npm start` | `npm run stdio` |
| Port | 3000, or `PORT` | none |
| Use for | Claude Code, Copilot, remote clients, testing | Claude Desktop, local CLI clients |

```bash
npm start        # HTTP server on :3000
npm run dev      # same, with nodemon reload
npm run stdio    # stdio transport
```

> **Note:** older documentation refers to `npm start:http` and `npm start:stdio`.
> Those scripts do not exist. Use `npm start` and `npm run stdio`.

## Verify it works

```bash
curl http://localhost:3000/health
```

```json
{ "status": "healthy", "instance_name": "dev", "timestamp": "..." }
```

Then confirm the tool surface is intact — neither command needs credentials,
a network connection or a running server:

```bash
npm run contract:verify   # frozen tool/endpoint/env-var surface
npm run smoke:tools       # boots the server in-memory, checks the wire output
```

Expected:

```
✅ Contract intact: 45 tools, 5 endpoints, 8 env vars, server "servicenow-server" v2.0.0
✅ Wire surface intact: "servicenow-server" v2.0.0 advertised 45 tools, 45/45 with input schemas
```

## Tests

```bash
npm test             # 244 tests across 10 suites
npm run test:coverage
```

`npm run test:coverage` **fails by design.** Coverage of `src/` is ~11% against an
80% threshold that is kept as a target. The failure is an accurate signal, not a
broken build — do not silence it by lowering the threshold.
See [Documentation Standards](../06-Governance/Documentation-Standards.md#testing-honesty).

## Next

- [Configuration](Configuration.md) — credentials and instances
- [Client Setup](Client-Setup.md) — wiring up Claude Desktop, Claude Code, Copilot
- [Docker](../04-Deployment/Docker.md) — container deployment
