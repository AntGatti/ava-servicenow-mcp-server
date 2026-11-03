[← Home](../Home.md)

# API Keys

Authentication for the HTTP endpoint (`/mcp`, `/instances`). Stdio is unaffected.

## Modes

`AVANADE_MCP_AUTH_MODE`:

| Mode | Behaviour |
|---|---|
| `off` (default) | No checks. Current behaviour. |
| `warn` | Validates and logs failures, lets the request through. Use to find clients without a key. |
| `enforce` | Missing or invalid key returns `401`. `/health` stays open but no longer returns the instance URL. |

## Managing keys

The generator is [scripts/keys.js](../../scripts/keys.js). In Claude Code, the
`new-server-key` skill wraps it.

```bash
npm run keys -- create --label "copilot-studio-prod" --expires-days 90
npm run keys -- list
npm run keys -- revoke <id>
npm run keys -- check <key>
```

Keys look like `avmcp_<id>_<secret>`. The secret is shown once; only its SHA-256 hash is
stored in `config/api-keys.json` (override with `AVANADE_MCP_API_KEYS_FILE`; gitignored).
The server re-reads the file when it changes, so create, rotate and revoke need no restart.
Run the CLI on the host where the server runs.

## Client configuration

Send the key in `X-API-Key`, or `Authorization: Bearer <key>`. A bare key in
`Authorization` is also accepted. Keys in the query string are never read.

Copilot Studio, Add MCP server: Authentication = API key, Parameter type = Header,
Header name = `X-API-Key`, Key value = the key.

## Rotation

1. Create a new key. 2. Update the client connection. 3. Check logs show no traffic on the old key id. 4. Revoke the old key.

## Limits

A key identifies a client, not a person: ServiceNow still sees the service account
([finding 3](../06-Governance/Security-Posture.md)). Key files are per host, so multiple
replicas need a shared file or a shared store.

## CI/CD (GitHub Actions)

[.github/workflows/deploy-ava-servicenow-mcp.yml](../../.github/workflows/deploy-ava-servicenow-mcp.yml)
deploys to `app-ava-servicenow-mcp-itn-01` (`rg-ava-servicenow-mcp-itn-01`).

- **Deploy:** runs on push to `main` only when `src/**`, `package.json` or
  `package-lock.json` change, after tests, `contract:verify` and `smoke:tools`. It then
  polls `/health`. It can also be run manually with action `deploy`.
- **Rotate key:** run manually with action `rotate-key` and a `key_label`. It adds a key to
  the key file on the app and stores the plaintext as repository secret
  `AVA_MCP_KEY_<run number>`. GitHub secrets cannot be read back, so use the key only from
  workflows, or create keys with `npm run keys` where you need to see them.
- **Secrets required:** `AZURE_WEBAPP_PUBLISH_PROFILE_AVA` (publish profile) and
  `GH_SECRETS_TOKEN` (a PAT allowed to write repository secrets; `GITHUB_TOKEN` cannot).
