[← Home](../Home.md)

# MCP Resources

MCP *resources* are read-only, addressable payloads a client can fetch without calling a
tool. This server's resource surface is **much smaller than older documentation claims**.

---

## What is actually wired — 2

Registered by the `ListResources` handler in
[src/mcp-server-consolidated.js](../../src/mcp-server-consolidated.js) and available to
clients today:

| URI | Returns |
|---|---|
| `servicenow://instance` | Server identity and active instance metadata |
| `servicenow://tables/all` | The full table-metadata payload (94 tables) loaded at startup |

> ⚠️ **`servicenow://instance` discloses `SERVICENOW_USERNAME`** in its payload, readable
> by any connected client. Tracked as finding 7 in
> [Security Posture](../06-Governance/Security-Posture.md).

---

## What is defined but **not** wired — 10

[src/resources.js](../../src/resources.js) implements a much broader surface via
`createResourceHandlers()`. **None of it is registered by the consolidated server**, so
requesting any of these fails.

Global:

| URI | Would return |
|---|---|
| `servicenow://instances` | All configured instances |
| `servicenow://tables` | Table list |

Instance-scoped, where `[instance]` is a configured name:

| URI | Would return |
|---|---|
| `servicenow://[instance]/info` | Instance details and capabilities |
| `servicenow://[instance]/incidents` | Active incidents |
| `servicenow://[instance]/incidents/[number]` | One incident |
| `servicenow://[instance]/users` | Users |
| `servicenow://[instance]/groups` | Assignment groups |
| `servicenow://[instance]/update-sets` | Update sets |
| `servicenow://[instance]/update-sets/[sys_id]` | One update set |
| `servicenow://[instance]/change-requests` | Active change requests |

### Why this matters

Documentation claiming "8 read-only resources" refers to **this unwired set**. Clients
cannot use them. Either register them deliberately or delete the module — leaving
working code unreachable behind inaccurate documentation is how the
[58 ghost tools](../06-Governance/Documentation-Standards.md#why-rule-1-exists) happened.

### A caveat before wiring them up

`createResourceHandlers` implements instance switching by calling `setInstance()` on the
client, then restoring the original in a `finally` block. Since
[session isolation](../06-Governance/Security-Posture.md#what-has-been-fixed) each
session owns its client, so this no longer leaks across users — but two concurrent
resource reads *within one session* could still interleave and read the wrong instance.
Wiring these up should replace switch-and-restore with a per-request client.

---

## Resources vs tools

| Use a resource when | Use a tool when |
|---|---|
| The data is read-only and stable | The call writes, or takes parameters |
| The client should cache it | Freshness matters |
| It is reference material (schemas, instance list) | It is an operation |

In practice, prefer [`SN-Query-Table`](../02-Tool-Reference/Tool-Index.md) for anything
record-shaped. The wired resources are best used for the table metadata, which is large
and changes rarely.
