[← Home](../Home.md)

# Troubleshooting

Start here, then follow the links.

| Symptom | Likely cause | Go to |
|---|---|---|
| "Tool not found" | The tool may genuinely not exist | [below](#tool-not-found) |
| `403 Forbidden` | Service account roles | [Permissions and 403s](Permissions-and-403s.md) |
| `401 Unauthorized` | Wrong credentials | [below](#authentication-failures) |
| `400 Invalid or missing session ID` | Session expired, lost, or multi-replica | [below](#session-errors) |
| `503 Server at capacity` | Session cap reached | [below](#session-errors) |
| SSE drops after ~60s | Reverse proxy timeout | [SSE and Reverse Proxies](../04-Deployment/SSE-and-Reverse-Proxies.md) |
| Calls hit the wrong instance | Session instance state | [Multi-Instance Routing](Multi-Instance-Routing.md) |
| Config changes ignored | Instances cached per process | restart the server |
| `npm run test:coverage` fails | **Expected** | [Documentation Standards](../06-Governance/Documentation-Standards.md#testing-honesty) |

---

## Tool not found

Check it exists before debugging anything else:

```bash
npm run smoke:tools   # lists what the server actually advertises
```

Then compare against [Tool Index](../02-Tool-Reference/Tool-Index.md).

Older documentation references **58 tool names that were never implemented**, several
with full worked examples — `SN-NL-Search`, `SN-Update-Incident`, `SN-Watch-Script`,
every `SN-Puppeteer-*`, most `SN-*-Flow`. If the tool is not in the Tool Index, no
amount of configuration will make it appear. See
[Documentation Standards](../06-Governance/Documentation-Standards.md#why-rule-1-exists).

## Authentication failures

```bash
curl -u "$USER:$PASS" \
  "https://your-instance.service-now.com/api/now/table/incident?sysparm_limit=1"
```

- Succeeds here but fails via MCP → configuration problem, check
  [Configuration](../01-Getting-Started/Configuration.md)
- Fails here too → the credentials or the account are the problem
- `401` is authentication; `403` is authorization. They are different problems.

Only **Basic auth** is implemented. `SERVICENOW_AUTH_TYPE` appears in old examples but
does nothing.

## Session errors

**`400 Invalid or missing session ID`**

- The client did not send its session ID, or the session expired
  (`AVANADE_MCP_SESSION_TTL_MS`, default 1h idle)
- Re-initialize to get a new session
- Running **more than one replica without sticky sessions** causes this intermittently —
  sessions are held in memory per process
- Note there is deliberately no fallback to "the only active session"; that behaviour
  was removed because it routed requests into other clients' sessions

**`503 Server at capacity`**

Concurrent sessions hit `AVANADE_MCP_MAX_SESSIONS` (default 100). Either raise it, or
wait for idle sessions to be evicted. Persistent 503s usually mean clients are opening
sessions without closing them — `DELETE /mcp` with the session ID closes one explicitly.

## Server will not start

| Error | Fix |
|---|---|
| `Missing ServiceNow credentials` | No config file and incomplete env vars. See [Configuration](../01-Getting-Started/Configuration.md) |
| `Failed to load ServiceNow instances config` | Malformed `config/servicenow-instances.json` — validate the JSON |
| `Instance 'x' not found` | `SERVICENOW_INSTANCE` names an instance not in the config; the error lists valid names |
| `EADDRINUSE` | Port in use. Change `PORT` or stop the other process |

## Background scripts appear to do nothing

Output does **not** come back in the MCP response. Look in ServiceNow:
**System Logs → System Log → All**, filtered on your `gs.info` text.

A script can fail silently. For update-set record moves, prefer `SN-Update-Record` or
`SN-Batch-Update`, which report failure.

## Verifying a deployment

```bash
npm run contract:verify   # frozen surface intact
npm run smoke:tools       # 45 tools advertised with schemas
npm test                  # 244 tests
curl http://localhost:3000/health
```

The first two need no credentials, network or running server.

## Getting the facts out of a running server

```bash
docker logs -f avanade-servicenow-mcp
curl http://localhost:3000/health
curl http://localhost:3000/instances
```

Logs are unstructured with no correlation IDs, so tracing one client's activity through
a busy server is currently difficult — finding 8 in
[Security Posture](../06-Governance/Security-Posture.md). Setting `DEBUG=true` adds
startup detail but also logs the active instance URL, so avoid it in shared
environments.
