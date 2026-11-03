# Avanade ServiceNow MCP Server — Wiki

Internal engineering wiki for the Avanade ServiceNow MCP Server: a multi-instance
Model Context Protocol server that connects Claude, GitHub Copilot or any MCP client
to one or many ServiceNow instances.

**45 tools · 2 wired MCP resources · generic CRUD over any ServiceNow table.**

> **Proprietary — Avanade internal.** See [LICENSE](../LICENSE). Do not publish this
> repository or its container images to any public registry.

---

## Start here

| I want to… | Go to |
|---|---|
| Install and run it locally | [Installation](01-Getting-Started/Installation.md) |
| Point it at my ServiceNow instances | [Configuration](01-Getting-Started/Configuration.md) |
| Connect Claude Desktop / Claude Code / Copilot | [Client Setup](01-Getting-Started/Client-Setup.md) |
| Look up a tool and its parameters | [Tool Index](02-Tool-Reference/Tool-Index.md) |
| See worked examples | [Usage Patterns](02-Tool-Reference/Usage-Patterns.md) |
| Deploy it | [Docker](04-Deployment/Docker.md) · [SSE and Reverse Proxies](04-Deployment/SSE-and-Reverse-Proxies.md) |
| Fix a 403 | [Permissions and 403s](05-Operations/Permissions-and-403s.md) |
| Rename something | **Stop.** Read [Frozen Contract](06-Governance/Frozen-Contract.md) first. |
| Understand the security position | [Security Posture](06-Governance/Security-Posture.md) |

---

## The two rules

**1. The client-facing surface is frozen.**
45 tool names, the server name `servicenow-server`, the bin name, five HTTP endpoints
and eight environment variable names are contractually frozen. Deployed agents — including
the ARIA agent suite — bind to them by name. Renaming one is not a refactor, it is an
outage. See [Frozen Contract](06-Governance/Frozen-Contract.md).

```bash
npm run contract:verify   # static check against the frozen manifest
npm run smoke:tools       # boots the server, checks what a client actually receives
```

**2. Tool documentation is generated, not written.**
[Tool-Index.md](02-Tool-Reference/Tool-Index.md) is produced from the live server by
`npm run docs:tools`. Hand-maintained tool docs drifted badly in the past — see
[Documentation Standards](06-Governance/Documentation-Standards.md) for what that cost.

---

## Map

| Section | Contents |
|---|---|
| [01 Getting Started](01-Getting-Started/) | Install, configure, connect a client |
| [02 Tool Reference](02-Tool-Reference/) | All 45 tools with parameters; usage patterns |
| [03 Resources](03-Resources/) | The MCP resource surface and what is actually wired |
| [04 Deployment](04-Deployment/) | Container, SSE transport, reverse proxies |
| [05 Operations](05-Operations/) | Instance routing, permissions, troubleshooting |
| [06 Governance](06-Governance/) | Frozen contract, security posture, doc standards |
| [07 Architecture](07-Architecture/) | How it is built; platform limitations |
| [08 Archive](08-Archive/) | Superseded point-in-time reports, kept for provenance |

---

## Status

This wiki is the curated, maintained documentation. The older `docs/` tree is being
consolidated into it and contains material that is duplicated, point-in-time, or
inaccurate. Where the two disagree, **the wiki wins**.

Known gaps are tracked openly rather than hidden:

- The HTTP server has **no authentication** — see [Security Posture](06-Governance/Security-Posture.md).
- Test coverage of `src/` is ~11%.
- `zod` is held at v3 pending a deliberate v4 migration.
