[← Home](../Home.md)

# SSE and Reverse Proxies

Server-Sent Events connections are long-lived and idle between messages. Most reverse
proxies kill them at 60 seconds by default. Nearly every "the connection drops after a
minute" report is proxy configuration, not the server.

---

## What the server already does

| Measure | Where |
|---|---|
| `Cache-Control: no-cache, no-transform` | SSE response headers |
| `X-Accel-Buffering: no` | Disables nginx buffering |
| `Connection: keep-alive` | SSE response headers |
| Socket timeouts disabled (`setTimeout(0)`) | SSE request and response |
| Heartbeat comment every `SSE_KEEPALIVE_INTERVAL` ms (default 15000) | Keeps intermediaries from seeing an idle socket |

The heartbeat is the important one: it writes a `: keepalive` comment so the connection
is never idle long enough to be reaped.

> Unbounded socket lifetime is only safe because sessions are now capped and expired —
> see [Configuration](../01-Getting-Started/Configuration.md) for
> `AVANADE_MCP_MAX_SESSIONS` and `AVANADE_MCP_SESSION_TTL_MS`.

---

## nginx

```nginx
location /mcp {
    proxy_pass http://servicenow-mcp:3000;
    proxy_http_version 1.1;

    proxy_buffering off;                    # critical - do not buffer SSE
    proxy_cache off;
    proxy_read_timeout 86400s;              # default 60s kills SSE
    proxy_connect_timeout 60s;
    proxy_send_timeout 86400s;

    proxy_set_header Host $host;
    proxy_set_header Connection '';
    proxy_set_header Cache-Control 'no-cache';
    proxy_set_header X-Accel-Buffering 'no';
}
```

`proxy_buffering off` and `proxy_read_timeout` are the two that matter. The default
60-second read timeout is the single most common cause of dropped sessions.

## HAProxy

```
backend servicenow_mcp
    timeout server 86400s
    timeout tunnel 86400s
    server mcp1 servicenow-mcp:3000 check
```

## Azure App Service / Container Apps

Both terminate idle connections by default. Keep `SSE_KEEPALIVE_INTERVAL` well below the
platform idle timeout (15s against a 230s App Service default is comfortable).

> **Scaling caveat:** sessions are held **in memory**. Across more than one replica a
> client can land on an instance that does not know its session and get a `400 Invalid
> or missing session ID`. Either pin to a single replica or enable sticky sessions until
> session state is externalised.

---

## Streamable HTTP instead

The newer streamable HTTP transport is served from the same `/mcp` path and is far less
sensitive to proxy behaviour, because it does not hold a long-lived idle stream. If your
client supports it, prefer it — most proxy tuning above becomes unnecessary.

---

## Diagnosing a dropped connection

```bash
# Watch raw SSE - you should see ": keepalive" every 15s
curl -N -H "Accept: text/event-stream" http://localhost:3000/mcp

# Direct to the container, bypassing the proxy
curl -N -H "Accept: text/event-stream" http://servicenow-mcp:3000/mcp
```

| Observation | Conclusion |
|---|---|
| Keepalives direct, drops through proxy | Proxy timeout or buffering |
| Drops in both | Server or network, not the proxy |
| No keepalives at all | `SSE_KEEPALIVE_INTERVAL` misconfigured, or the stream never opened |
| Drops at exactly 60s | nginx `proxy_read_timeout` default |
| Drops only under load | Session cap reached — look for `503` and `⛔ Session limit reached` in logs |
| Nothing arrives until the connection closes | Buffering: `proxy_buffering off` |
