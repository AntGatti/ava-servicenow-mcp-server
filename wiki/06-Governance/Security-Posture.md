[← Home](../Home.md)

# Security Posture

> **Superseded in part.** The current findings, scoring and remediation plan live in
> [Security Analysis — November 2026](Security-Analysis-2026-11.md). The table below
> predates the API-key work, the CI gates and the src-only deploy package, and no
> longer reflects what is deployed.

Honest statement of where this server stands. Written so that nobody deploys it
believing it is hardened when it is not.

**Summary: API key authentication now ships and is enforced on the AVA app, which is
verified correct as of 2026-11-04.** A valid key is still all-or-nothing: it grants every
tool on every table, including both server-side execution channels. Treat a key as
equivalent to ServiceNow admin.

---

## Open findings

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | HTTP server has no authentication of any kind | 🔴 Critical | ✅ **Fixed** — API keys, `enforce` on the AVA app |
| 2 | Leaked credential in git history | 🔴 Critical | ✅ History rewritten — **rotation not performed, accepted as risk** |
| 3 | ServiceNow auth is Basic only; no identity propagation | 🟠 High | Open |
| 4 | `SN-Execute-Background-Script` is RCE by design, ungated | 🟠 High | Open |
| 5 | No tool-level authorization: any table, any field | 🟡 Medium | Open |
| 6 | `/health` and `/instances` disclose instance URLs | 🟡 Medium | ✅ **Fixed** under `enforce` — `/health` returns status only, `/instances` needs a key |
| 7 | `servicenow://instance` resource exposes `SERVICENOW_USERNAME` | 🟡 Medium | Open |
| 8 | No structured logging, correlation IDs or tool audit trail | 🟡 Medium | Open |
| 9 | `zod` held at v3 with a known high advisory | 🟡 Medium | Deferred by decision |
| — | Shared mutable client leaked instance switches across sessions | 🔴 Critical | ✅ **Fixed** |
| — | Session fixation via client-supplied session ID | 🟠 High | ✅ **Fixed** |
| — | Sessionless requests routed into another client's session | 🟠 High | ✅ **Fixed** |
| — | Unbounded session growth | 🟠 High | ✅ **Fixed** |
| — | 14 production dependency vulns (1 critical, 11 high) | 🟠 High | ✅ **Fixed** — now 2 |

---

## 1. No authentication 🔴

[src/server.js](../../src/server.js) registers no auth middleware. Every route is open:

- `POST /mcp` — anyone who can reach the port gets **full MCP access**, executing with
  the server's stored ServiceNow service-account credentials. That includes
  `SN-Create-Record`, `SN-Update-Record` and `SN-Execute-Background-Script`.
- `GET /instances` — unauthenticated enumeration of every configured instance.
- `GET /health` — discloses the live instance URL.

Until this is closed, the server must only be reachable from a trusted network.
Planned: Entra ID JWT validation behind `AVANADE_MCP_AUTH_MODE`, defaulting to current
behaviour so existing clients are unaffected until the flag is flipped.

## 2. Leaked credential 🔴

A ServiceNow admin password for a dev instance was committed in `start-mcp.sh` at commit
`d008f8d`. The file has been deleted, **but deleting a file does not remove it from git
history**, and the same credential is still present in plaintext in
`docs/SETUP_GUIDE.md`.

**The credential must be rotated.** Removing the text is not sufficient — anyone with
innersource read access already has it.

## 3. Basic auth and no identity propagation 🟠

[servicenow-client.js](../../src/servicenow-client.js) builds a static
`Basic base64(user:pass)` header. No OAuth, no refresh, no revocation.
`SERVICENOW_AUTH_TYPE` exists in old examples but is not implemented.

The consequence that matters most: **every action lands in ServiceNow audit logs as the
service account.** You cannot answer "who asked for this?" from ServiceNow alone. For an
agent platform acting on behalf of named employees, that is a significant gap — and it
is why finding 8 (audit trail) is ranked higher than its CVSS would suggest.

## 4. Background script execution 🟠

`SN-Execute-Background-Script` accepts arbitrary server-side JavaScript and runs it on
ServiceNow via the `sys_trigger` table. This is a legitimate, documented feature — and,
combined with finding 1, an unauthenticated RCE primitive against your ServiceNow
instance.

It is **not** slated for removal; that would break the
[frozen contract](Frozen-Contract.md). It will become policy-gated: off by default in
production profiles, fully audited when on. Same for `SN-Create-Fix-Script`.

## 5. No tool-level authorization 🟡

There is no allowlist, denylist, RBAC or read-only mode. `SN-Query-Table` and
`SN-Create-Record` work on *any* table, including `sys_user`, `sys_user_has_role`,
`sys_properties` and `sys_script`. No field-level redaction, no destructive-operation
confirmation, no rate limiting.

---

## What has been fixed

**Session isolation.** The server previously built one `ServiceNowClient` at startup and
shared it across every session. `SN-Set-Instance` mutates the client, so one caller
switching to prod silently retargeted every other caller's reads *and writes*. With
concurrent agents this needed no attacker — ordinary use triggered it. Each session now
builds its own client.

**Session integrity.** Session IDs are now always server-generated (client-supplied IDs
are ignored, closing a fixation path). A request with no valid session ID is rejected
with 400 instead of being routed into whichever session happened to be active.

**Session bounds.** Sessions now live in a store with an idle TTL and a concurrency cap,
with eviction that clears keepalive timers and closes transports. Previously they
accumulated for the process lifetime, each holding a full MCP server instance.

**Dependencies.** Production vulnerabilities went from 14 (1 critical, 11 high) to 2.
The MCP SDK moved 1.25.3 → 1.32.2, which matters beyond hygiene: 1.32.0 fixes
`GHSA-rvq5-wwqv-78pq` (bearer auth accepting tokens issued for another service) and
two unbounded-request-body advisories — all on the surface the auth work will build on.

---

## Infrastructure

Deployed to Azure App Service via GitHub Actions. Current gaps:

- CI authenticates with a **publish profile** (long-lived credential) rather than OIDC
  federated identity.
- **No CI gates** — no tests, no audit, no lint, no secret scanning, no SBOM.
  `contract:verify` and `smoke:tools` are not yet wired in.
- The deployment zip is **the whole repo**, shipping `.azure/` (with a subscription ID),
  docs and tests into production.
- Secrets are plain app settings; no Key Vault + Managed Identity.
- **No network isolation** — no VNet integration, Private Endpoint, or WAF. Combined
  with finding 1, the app may be publicly reachable with no gate.
- Infrastructure was provisioned by ad-hoc Python scripts in `.azure/`. No IaC.
- In-memory sessions mean the app cannot safely scale past one replica without sticky
  sessions.

---

## Reporting

Raise security concerns through the normal Avanade channel. Do not open a public issue
— this repository is proprietary and must not be published.
