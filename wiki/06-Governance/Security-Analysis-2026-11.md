[← Home](../Home.md) · [Security Posture](Security-Posture.md)

# Security Analysis — November 2026

**Date:** 2026-11-04
**Scope:** this repository, and the one app it owns — **`app-ava-servicenow-mcp-itn-01`** (`rg-ava-servicenow-mcp-itn-01`).
**Explicitly out of scope:** any other deployment of this code. Other apps built from this source are managed by a different repository and a different owner; they are not assessed, not referenced and not to be changed from here.
**Method:** full source read of the HTTP surface and every module it reaches; dependency audit; git-history secret scan; authenticated `az` inspection and black-box probing of the AVA app.
**Agreed appetite:** P0 only. Everything else is recorded as an accepted risk in §5.

---

## 1. Verification of the AVA app

Checked 2026-11-04. **All three requirements pass.**

### HTTPS ✅

| Check | Result |
|---|---|
| `httpsOnly` | `true` |
| `http://` request | `301` → `https://app-ava-servicenow-mcp-itn-01.azurewebsites.net/health` |
| Minimum TLS | `1.3` |
| FTPS | `Disabled` |
| HTTP/2 | Enabled |
| Certificate | Platform cert on `*.azurewebsites.net`; no custom domain bound |

### API key authentication ✅

| Check | Result |
|---|---|
| `AVANADE_MCP_AUTH_MODE` | `enforce` |
| `AVANADE_MCP_API_KEYS_FILE` | `/home/data/api-keys.json` |
| Keys present | **1 active key**, per the startup banner |
| `GET /instances` with no key | `401` |
| `POST /mcp` with no key | `401` |
| `POST /mcp` with a well-formed but unknown key | `401` |
| `GET /health` | `200`, status and timestamp only — no instance disclosure |
| Positive path | Session `325a4d24…` established 2026-11-03T22:36:51Z with a valid key |

Both directions are proven: a valid key works, and three different failure modes are all
rejected. The startup banner is the decisive evidence that the key file is actually
loaded:

```
🔐 Auth mode: enforce (1 keys in /home/data/api-keys.json)
```

Earlier restarts that day logged `enforce (0 keys …)` together with the server's own
warning that every request would be rejected. That window is closed — the key was added
at 22:26 and the first authenticated session followed ten minutes later.

### Deployment ✅

| Check | Result |
|---|---|
| Deployed commit | `34de16a`, OneDeploy 2026-11-03T22:22:40Z, active, succeeded |
| Workflow run | `Deploy AVA ServiceNow MCP` — success |
| Ancestor of `main` | Yes |
| `src/`, `package.json`, `package-lock.json`, `LICENSE` vs `main` | **Identical** |
| API-key commit `6d0f146` in the deployed tree | Yes |
| Runtime | `NODE\|22-lts`, Always On enabled, app Running |
| Health | `200` |

`main` is currently `2c37a3d`, one commit ahead of what is deployed. That commit touches
only a workflow file, not `src/`, so the deployed application code is byte-identical to
`main`. **Nothing is pending deployment.**

### Two observations from the verification

**Unidentified caller.** At 2026-11-04T03:33:38Z the app logged seven `POST /mcp`
rejections in under a second, all `missing` — no key presented. That is not a probe of
mine (mine are at 06:31 and 12:30). It is either a client that has not been given its key
yet, or an internet scanner. Enforcement held in both cases, which is the point of the
check, but it is worth knowing someone is knocking.

**The key file lives outside the deployment.** `/home/data/api-keys.json` is on App
Service persistent storage, not in the deployment package — correct, because it survives
deploys, but it also means it is not in source control and not backed up. If the app is
ever recreated the key is gone and every client breaks until new keys are issued. One
key exists today; its label and expiry are in that file, which I have not opened.

---

## 2. Scoring key

| Axis | Scale |
|---|---|
| **Priority** | P0 live exploitable · P1 exploitable once exposed · P2 defence-in-depth · P3 hygiene |
| **Complexity** | S ≤ half a day · M 1–3 days · L 1–2 weeks · XL multi-sprint |
| **Breakage** | 🟢 none expected · 🟡 config change clients may notice · 🔴 behavioural change, clients will notice |

Breakage is judged against the [frozen contract](Frozen-Contract.md): tool names, server
identity and the wire surface are fixed, so changing any of them is a client-visible break.

---

## 3. Findings

The AVA app is correctly configured, so nothing here is *live* exploitable against it.
The findings below are in the **code** and in the **deployment practice** around it —
they describe what a valid key gets you, and what would happen on the next deployment
that forgets a setting.

### 3.1 Summary table

| # | Finding | Priority | Complexity | Breakage | Status |
|---|---|---|---|---|---|
| C2 | `SN-Create-Fix-Script` path traversal → arbitrary file write on the server | **P0** | S | 🟢 | ✅ **Fixed** |
| C1' | `AVANADE_MCP_AUTH_MODE` defaulted to `off` — a deployment that forgets the setting was wide open | **P0** | S | 🔴 | ✅ **Fixed** |
| C3 | `SN-Execute-Background-Script` is ungated RCE by design | P1 | M | 🔴 | Accepted (R3) |
| C16 | `javascript:` tokens in encoded queries are a *second* server-side execution channel | P1 | M | 🔴 | Accepted (R3) |
| C4 | No tool-level authorization — any table, any field, no read-only mode | P1 | L | 🔴 | Accepted (R3) |
| C11 | ServiceNow auth is Basic-only; every action audits as the service account | P1 | XL | 🟡 | Accepted (R6) |
| I2 | ServiceNow password is a plain app setting, passed on the `az` command line | P1 | M | 🟡 | Accepted (R2) |
| I1 | No IaC — the app's configuration is not reproducible or verified | P1 | L | 🟢 | Accepted (R7) |
| I3 | CI authenticates with a long-lived publish profile, not OIDC | P1 | M | 🟡 | Accepted (R7) |
| I5 | Public endpoint, "Allow all" access restrictions, no WAF | P1 | M | 🔴 | Accepted (R4) |
| C5 | Unbounded request-body read in `readJsonBody` → memory DoS | P2 | S | 🟢 | Accepted |
| C6 | No `Origin`/`Host` validation, no CORS policy → DNS-rebinding | P2 | S | 🟡 | Accepted |
| C7 | No rate limiting, no security response headers | P2 | S | 🟢 | Accepted |
| C9 | `/instances` discloses instance URLs to any valid key | P2 | S | 🟡 | Accepted |
| C13 | API keys have no scopes; `warn` mode lets unauthenticated traffic through | P2 | M | 🟡 | Accepted (R3) |
| C15 | `SN-Set-Instance` lets any session retarget to any configured instance | P2 | M | 🔴 | Accepted (R3) |
| C12 | No tool-invocation audit trail, no correlation IDs | P2 | M | 🟢 | Accepted (R6) |
| I6 | Docker image bakes `config/*.json` — the `.dockerignore` exclusion line is empty | P2 | S | 🟢 | Accepted |
| I7 | `.azure/deploy_*.py` zip the whole repo, shipping real credentials in the artifact | P2 | S | 🟢 | Accepted |
| I12 | Key file is unmanaged state — not backed up, lost if the app is recreated | P2 | S | 🟢 | Accepted |
| I8 | No CI security gates — no audit, secret scan, SAST, SBOM or Dependabot | P2 | M | 🟢 | Accepted |
| C14 | `zod` v3 held with a high advisory; `qs` moderate | P3 | M | 🔴 | Accepted (R5) |
| C17 | Table and sys_id interpolated into the API path without `encodeURIComponent` | P3 | S | 🟢 | Accepted |
| C10 | `SERVICENOW_USERNAME` exposed through instance-info output | P3 | S | 🟡 | Accepted |
| I9 | In-memory sessions — cannot scale past one replica | P3 | L | 🟡 | Accepted |
| I10 | Subscription ID and resource names committed in `.azure/*.py` | P3 | S | 🟢 | Accepted |

### 3.2 The two P0s

**C2 — path traversal in `SN-Create-Fix-Script`**
([src/mcp-server-consolidated.js:2019](../../src/mcp-server-consolidated.js#L2019)).
`script_name` goes straight into `path.join(scriptsDir, name + '_' + timestamp + '.js')`
with no sanitisation, so `../../../../tmp/evil` resolves outside the intended directory —
verified locally. The timestamp suffix prevents exact overwrite of an existing file, so
this is arbitrary *file creation* with attacker-chosen content rather than direct
overwrite-to-RCE. On the AVA app it is reachable by any valid key holder, and writes
anywhere under `/home` the process can reach — including `/home/data/`, where the key
file lives. Fix: `path.basename()` plus a character allowlist.

**C1' — unsafe default.** `AVANADE_MCP_AUTH_MODE` defaulted to `off`. The AVA app sets
it explicitly, so it was safe — but that safety lived in one app setting, not in the
code, and no IaC asserts it (I1). The default is now `enforce`: a deployment that omits
the setting fails closed. `off` is an explicit opt-in for local development.

### 3.3 Notes on the accepted findings

**C3 and C16 are two execution channels, not one.** Gating
`SN-Execute-Background-Script` would not close server-side execution on its own.
ServiceNow evaluates `javascript:` tokens inside encoded queries, and `SN-Query-Table`
passes `query` through untouched — the client itself relies on this at
[servicenow-client.js:186](../../src/servicenow-client.js#L186)
(`user=javascript:gs.getUserID()`). If C3 is ever picked up, C16 has to go with it.

**C5 — unbounded body.** `readJsonBody` ([src/server.js:86](../../src/server.js#L86))
concatenates the whole request stream before parsing, with no cap. `express.json()` is
never mounted, so the SDK's own body limits do not apply on this path. Note this is
reachable *before* authentication only in `off` mode; under `enforce` a caller needs a
valid key first.

**I2 — secret handling.** `.azure/deploy_linux_webapp.py:81` interpolates the live
ServiceNow password into an `az ... --settings` argument. Command-line arguments are
visible to other processes and land in shell history and CLI telemetry. The value sits
as a plain app setting on the AVA app, readable by anyone with Contributor on the
resource group.

**I6 — Docker.** `.dockerignore` has a `# Config with credentials` comment with **nothing
under it**, while the `Dockerfile` does `COPY config/ ./config/`. A clean checkout is
fine, but any developer who builds locally after configuring the server bakes
`servicenow-instances.json` and `api-keys.json` into the image layers. The image also
runs as root — no `USER node`.

**I8 — supply chain.** CI runs tests, `contract:verify` and `smoke:tools`, but no
`npm audit`, no secret scanning, no SAST, no SBOM, no Dependabot. Current production
audit: 2 vulnerabilities — 1 high (`zod` memory exhaustion, fixed only in a major bump)
and 1 moderate (`qs`, via Express). The dev tree adds ~20 more through the Jest
toolchain; they do not ship but they do run in CI on every push.

### 3.4 Closed since the last review

The credential in git history: `start-mcp.sh` no longer appears as an addition anywhere
in history, and a scan of the last 60 revisions finds only placeholder values. History
appears to have been rewritten.

---

## 4. Agreed scope

Decisions taken 2026-11-04 by ant.gatti. Appetite is **P0 only**; everything else is an
accepted risk in §5.

| Decision | Answer |
|---|---|
| Authentication model | **Scoped API keys only** — no Entra ID, no identity propagation |
| Secret storage | **Accept as risk** — no Key Vault, no managed identity |
| Safe default | **Enforce is required; no endpoint ships without a key** |
| Appetite | **P0 only** |
| Scope | **This repo and the AVA app only.** Other deployments belong to another repository and owner. |

### Work items

| Step | Action | Finding | Status |
|---|---|---|---|
| A3 | `path.basename()` + character allowlist on `script_name` | C2 | ✅ **Done** |
| A5 | Default `AVANADE_MCP_AUTH_MODE` to `enforce`; `off` becomes explicit opt-in | C1' | ✅ **Done** |
| A6 | Remove the workflow in this repo that deploys to an app outside this scope | — | ⬜ Needs your call — see §6 |

**A3** sanitises `script_name` with `path.basename()` plus an
`[a-zA-Z0-9_.-]` allowlist, rejects a name that reduces to nothing usable, and keeps a
containment assertion on the resolved path so a future change to the naming scheme
cannot silently reintroduce an escape. The sanitised name is also what goes into the
generated file header, and a `*/` in `description` is neutralised so free text cannot
close the header comment and land in executable position.

**A5** changes the `resolveAuthMode` fallback from `off` to `enforce` and documents the
opt-out in `.env.example`, `docker-compose.yml` and
[API Keys](../05-Operations/API-Keys.md). It is 🔴 only for a deployment that relied on
the old default; the AVA app sets the value explicitly, so this is a no-op there.

Verification: **288 tests pass** (up from 274), frozen contract intact — 45 tools,
server identity unchanged — and the wire-surface smoke test passes. The 14 new tests
include a suite that drives the real MCP server over an in-memory transport, so the
traversal cases exercise the actual handler rather than a mock.

The AVA app itself needs **no configuration change**: HTTPS, API key enforcement and
deployment are all already correct.

---

## 5. Accepted risks

Recorded as decisions rather than oversights. Each needs a named owner and a review date.

| # | Risk accepted | Consequence carried |
|---|---|---|
| R2 | Secrets stay plain | The ServiceNow password remains readable by anyone with Contributor on the resource group, and remains in `az` CLI history and telemetry wherever the deploy scripts have been run. |
| R3 | A key is all-or-nothing | A valid key grants every tool on every table, including `sys_user`, `sys_properties` and `sys_script`, plus both server-side execution channels. One leaked key equals full ServiceNow admin. Today there is exactly one key, so it is a single point of total compromise. |
| R4 | No network isolation | The app stays on the public internet with "Allow all". The key is the only control — as the 03:33 probe shows, it is being tested. |
| R5 | `zod` high advisory | Memory-exhaustion advisory stays in the production tree. |
| R6 | No identity propagation | Every action audits in ServiceNow as the service account. "Who asked for this?" remains unanswerable. |
| R7 | No IaC, publish-profile CI | The app's correct configuration is unverified and unreproducible; a long-lived deployment credential sits in GitHub secrets. C1' is mitigated in code instead. |

### Dependency outside this scope

The AVA app's ServiceNow service account is **also configured on at least one
deployment owned elsewhere** (the account name and instance hostname are deliberately
not written here — see the `docs/` note in `.gitignore`; read them from the app
settings when you need them). This is stated once because it has a practical
consequence for this app and no other: **rotating that credential cannot be done
unilaterally from here** — it would need coordinating with the other owner, or the AVA
app breaks. No assessment of, or change to, that other deployment is implied or
recommended by this document.

---

## 6. Open item: a workflow pointing outside this scope

`.github/workflows/azure-webapp-deploy.yml` in this repository deploys `src/` to an app
that you have placed outside this scope. It is active — it triggers on every push to
`main` that touches `src/**`, `package.json` or `package-lock.json`, and it ran
successfully as recently as 2026-11-03T22:34.

While it stays, this repository keeps shipping code to a deployment it does not own, and
that app's `AVANADE_MCP_AUTH_MODE` is not set by anything here either. If ownership has
moved to another repository, this workflow and its `AZURE_WEBAPP_PUBLISH_PROFILE` secret
should be removed from this one, so there is exactly one repository deploying to each
app. That is item A6, and it needs your go-ahead because deleting it stops those
deployments.

---

## 7. Tracking

| Item | Status | Owner | Evidence |
|---|---|---|---|
| AVA app — HTTPS | ✅ Verified 2026-11-04 | | §1 |
| AVA app — API key enforcement | ✅ Verified 2026-11-04 | | §1 |
| AVA app — deployment matches `main` | ✅ Verified 2026-11-04 | | §1 |
| A3 — C2 path traversal | ✅ Done | | `tests/fix-script-path.test.js`, 10 cases |
| A5 — C1' safe default | ✅ Done | | `tests/api-keys.test.js`, fail-closed cases |
| A6 — out-of-scope workflow | ⬜ Awaiting decision | | §6 |
| R2–R7 — accepted risks | ⬜ Need owner and review date | | §5 |

Legend: ⬜ not started · 🏗 in progress · ✅ done · ❌ accepted as risk
