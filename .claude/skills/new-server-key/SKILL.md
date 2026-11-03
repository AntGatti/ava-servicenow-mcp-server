---
name: new-server-key
description: Create, list, revoke, check or rotate API keys for the ServiceNow MCP server's HTTP endpoint (used by Copilot Studio and other MCP clients). Use whenever the user asks for a new server key, API key, access key, to rotate or revoke a key, or to check whether a key is valid.
---

# Server API keys

Keys secure `/mcp` and `/instances` when `AVANADE_MCP_AUTH_MODE` is `warn` or `enforce`.
The generator is `scripts/keys.js`, run through `npm run keys --`. Only SHA-256 hashes
are stored, in `config/api-keys.json` (or `AVANADE_MCP_API_KEYS_FILE`); that file is
gitignored. The running server re-reads it on change, so no restart is needed.

## Create a key

1. Ask for a **label** if not given. One key per client: `copilot-studio-prod`,
   `copilot-studio-dev`, `inspector-ant`. The label is what shows in logs.
2. Ask for an expiry only if the user mentions one; suggest 90 days for production.
3. Run:

   ```bash
   npm run keys -- create --label "<label>" [--expires-days 90]
   ```

4. Show the user the key **once**, in your reply. It cannot be recovered afterwards.
   Do not write it to any file, memory, commit message or log.
5. Remind them where it goes. In Copilot Studio, Add MCP server:
   - Authentication: **API key**
   - Parameter type: **Header**
   - Header name: **X-API-Key**
   - Key value: the key

   Never use the "Query string" option; URLs are logged.
6. If the server runs on Azure/Docker rather than this machine, the key file lives
   on that host: run the command there, not locally.

## Rotate a key (no downtime)

1. Create the replacement key with the same label plus a version, e.g. `copilot-studio-prod-v2`.
2. Have the client update its connection to the new key.
3. Confirm nothing still uses the old one (server logs show the key id per rejected or warned request).
4. Revoke the old key: `npm run keys -- revoke <id>`.

## Other commands

```bash
npm run keys -- list            # ids, labels, status, expiry (never secrets)
npm run keys -- revoke <id>     # takes effect immediately
npm run keys -- check <key>     # valid / invalid + reason, exit code 0/1
```

## Rules

- Never print, log or commit a key after the initial creation reply.
- Never edit `config/api-keys.json` by hand to add keys; hashes must come from the CLI.
- If `AVANADE_MCP_AUTH_MODE=enforce` and no keys exist, every request is rejected.
  Create a key before switching the mode.
