[← Home](../Home.md)

# Configuration

Credentials can come from a multi-instance JSON file (preferred) or from environment
variables (single instance, backward compatible).

> **Never commit credentials.** `config/servicenow-instances.json` and `.env` are both
> gitignored. Keep it that way — and see the warning in
> [Security Posture](../06-Governance/Security-Posture.md#credentials-in-the-repository).

---

## Option 1 — multi-instance file (preferred)

`config/servicenow-instances.json`:

```json
{
  "instances": [
    {
      "name": "dev",
      "url": "https://your-dev.service-now.com",
      "username": "svc_mcp_dev",
      "password": "...",
      "default": true,
      "description": "Development"
    },
    {
      "name": "prod",
      "url": "https://your-prod.service-now.com",
      "username": "svc_mcp_prod",
      "password": "...",
      "description": "Production"
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | How tools refer to the instance (`instance: "prod"`) |
| `url` | yes | Trailing slash is stripped automatically |
| `username` | yes | Service account |
| `password` | yes | See the credential-handling note below |
| `default` | no | The instance used when none is specified. If absent on all, the **first** entry wins |
| `description` | no | Shown by `SN-Set-Instance` and `GET /instances` |

Start from the committed template:

```bash
cp config/servicenow-instances.json.example config/servicenow-instances.json
```

---

## Option 2 — environment variables

Used automatically when `config/servicenow-instances.json` is absent. Produces a single
instance named `default`.

```bash
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=svc_mcp
SERVICENOW_PASSWORD=...
SERVICENOW_INSTANCE_NAME=dev      # optional, names the fallback instance
```

Missing any of the first three is a startup error.

---

## All environment variables

The `SERVICENOW_*` names are **frozen** — see [Frozen Contract](../06-Governance/Frozen-Contract.md).
Settings added by the Avanade conversion use the `AVANADE_MCP_` prefix so existing
`.env` files and deployment settings keep working untouched.

| Variable | Default | Purpose |
|---|---|---|
| `SERVICENOW_INSTANCE_URL` | — | Instance URL (env fallback mode) |
| `SERVICENOW_USERNAME` | — | Service account (env fallback mode) |
| `SERVICENOW_PASSWORD` | — | Password (env fallback mode) |
| `SERVICENOW_INSTANCE_NAME` | `default` | Names the env-fallback instance |
| `SERVICENOW_INSTANCE` | — | Selects a named instance from the config file at startup |
| `PORT` | `3000` | HTTP listen port |
| `DEBUG` | `false` | Extra startup logging. **Logs the active instance URL** |
| `SSE_KEEPALIVE_INTERVAL` | `15000` | SSE heartbeat, ms |
| `AVANADE_MCP_MAX_SESSIONS` | `100` | Concurrent MCP session cap; over-limit returns HTTP 503 |
| `AVANADE_MCP_SESSION_TTL_MS` | `3600000` | Idle time before a session is evicted |

---

## Selecting an instance

Three levels, most specific first:

1. **Per call** — every tool accepts an optional `instance` parameter
   ```javascript
   SN-Query-Table({ table_name: "incident", limit: 10, instance: "prod" })
   ```
2. **Per session** — `SN-Set-Instance({ instance_name: "prod" })` retargets the
   current session only. Sessions are isolated; this does **not** affect other users.
3. **Process default** — the `default: true` entry, or `SERVICENOW_INSTANCE`.

`SN-Set-Instance` accepts only names already present in the configuration. It cannot be
given an arbitrary URL or credentials, so it is not an SSRF vector.

See [Multi-Instance Routing](../05-Operations/Multi-Instance-Routing.md).

---

## Credential handling

Today the server authenticates to ServiceNow with **HTTP Basic auth** over TLS, built
once per session and held in memory. There is no OAuth, no token refresh and no
rotation. `SERVICENOW_AUTH_TYPE` appears in some older examples but **is not
implemented** — only basic auth exists.

Consequences worth understanding before a production deployment:

- The service account is typically broadly privileged, because the tool set touches
  `sys_trigger`, `sys_update_set` and `sys_dictionary`.
- **No identity propagation.** Every action is recorded in ServiceNow audit logs as the
  service account, so "who asked for this" is not recoverable from ServiceNow alone.

Both are tracked in [Security Posture](../06-Governance/Security-Posture.md).
