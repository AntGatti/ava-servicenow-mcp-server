[← Home](../Home.md)

# Client Setup

The server name registered with MCP clients is `servicenow-server`. It is
[frozen](../06-Governance/Frozen-Contract.md) — do not rename it in client configs.

---

## Claude Desktop (stdio)

Edit the Claude Desktop config:

- **macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** — `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "servicenow": {
      "command": "node",
      "args": ["/absolute/path/to/servicenow-mcp-server/src/stdio-server.js"],
      "env": {
        "SERVICENOW_INSTANCE_URL": "https://your-instance.service-now.com",
        "SERVICENOW_USERNAME": "svc_mcp",
        "SERVICENOW_PASSWORD": "use-a-real-secret-here"
      }
    }
  }
}
```

If you use `config/servicenow-instances.json`, drop the `env` block entirely and add
`"cwd": "/absolute/path/to/servicenow-mcp-server"` so the config file resolves.

Restart Claude Desktop after editing. The config is read only at startup.

> **Do not paste production credentials into this file.** It is plaintext, unencrypted,
> and frequently shared in screenshots and support threads. Use a dev service account.

---

## Claude Code / HTTP clients (SSE or streamable HTTP)

Start the HTTP server and point the client at it:

```bash
npm start   # http://localhost:3000/mcp
```

Both transports are served from the same path:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/mcp` | SSE stream (legacy), or streamable GET with `Mcp-Session-Id` |
| `POST` | `/mcp` | JSON-RPC messages |
| `DELETE` | `/mcp` | Explicit streamable session teardown |

### Session rules

- Session IDs are **always generated server-side**. A client-supplied
  `Mcp-Session-Id` on first initialize is ignored and replaced.
- A non-initialize request without a valid session ID is rejected with **400**.
  There is no "guess the session" fallback.
- Each session gets its own ServiceNow client, so `SN-Set-Instance` in one session
  never affects another.
- Over `AVANADE_MCP_MAX_SESSIONS` concurrent sessions, initialize returns **503**.
- Sessions idle longer than `AVANADE_MCP_SESSION_TTL_MS` are evicted.

---

## Verifying the connection

```bash
curl http://localhost:3000/health
curl http://localhost:3000/instances
```

Then ask the client to list tools. You should see **45**, every one prefixed `SN-`.
If you see a different number, run `npm run smoke:tools` and compare against
[Tool Index](../02-Tool-Reference/Tool-Index.md).

---

## Common problems

| Symptom | Cause |
|---|---|
| Client shows no tools | Server not running, or wrong path/port |
| "Tool not found" for a documented tool | The tool may not exist. Older docs reference 58 tool names that were never implemented — check [Tool Index](../02-Tool-Reference/Tool-Index.md) |
| Claude Desktop ignores config changes | Config is read at startup only; restart it |
| 400 "Invalid or missing session ID" | Client dropped its session ID, or the session expired. Re-initialize |
| 503 "Server at capacity" | Session cap reached; raise `AVANADE_MCP_MAX_SESSIONS` or wait for idle eviction |
| Connection drops after ~60s behind a proxy | SSE buffering. See [SSE and Reverse Proxies](../04-Deployment/SSE-and-Reverse-Proxies.md) |
| 403 from ServiceNow | Service account roles. See [Permissions and 403s](../05-Operations/Permissions-and-403s.md) |
