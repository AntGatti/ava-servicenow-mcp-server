[← Home](../Home.md)

# Docker

---

## Build

```bash
docker build -t avanade/servicenow-mcp-server:latest .
```

Multi-stage build on `node:22-alpine`; the production stage installs with
`npm ci --omit=dev`, so the dev-only dependency tree is not shipped.

> The image must not be pushed to Docker Hub or any public registry. See
> [LICENSE](../../LICENSE). Use the Avanade container registry.

## Run

With a multi-instance config file (preferred):

```bash
docker run -d --name avanade-servicenow-mcp \
  -p 3000:3000 \
  -v "$(pwd)/config/servicenow-instances.json:/app/config/servicenow-instances.json:ro" \
  avanade/servicenow-mcp-server:latest
```

With environment variables:

```bash
docker run -d --name avanade-servicenow-mcp \
  -p 3000:3000 \
  -e SERVICENOW_INSTANCE_URL="https://your-instance.service-now.com" \
  -e SERVICENOW_USERNAME="svc_mcp" \
  -e SERVICENOW_PASSWORD="..." \
  avanade/servicenow-mcp-server:latest
```

> Avoid `-e SERVICENOW_PASSWORD=...` outside local development — it is visible in
> `docker inspect`, in shell history and in process listings. Use a mounted file or
> your orchestrator's secret mechanism.

## Compose

```bash
docker compose up -d
```

[docker-compose.yml](../../docker-compose.yml) mounts the instance config read-only and
passes session limits through. Review it before production use.

---

## Configuration

See [Configuration](../01-Getting-Started/Configuration.md) for the full variable list.
Worth setting explicitly in a container:

| Variable | Why |
|---|---|
| `AVANADE_MCP_MAX_SESSIONS` | Bounds memory. Each session holds a full MCP server instance |
| `AVANADE_MCP_SESSION_TTL_MS` | Reclaims abandoned SSE connections |
| `SSE_KEEPALIVE_INTERVAL` | Must sit below your ingress idle timeout |
| `DEBUG` | Leave `false`. When `true` it logs the active instance URL |

## Health check

The image declares a `HEALTHCHECK` against `/health` every 30s.

```bash
curl http://localhost:3000/health
docker inspect --format='{{.State.Health.Status}}' avanade-servicenow-mcp
```

> `/health` returns the configured instance URL and is **unauthenticated**. Do not
> expose it beyond your ingress. Finding 6 in
> [Security Posture](../06-Governance/Security-Posture.md).

---

## Before deploying to a shared environment

The container does not change the server's security position. Read
[Security Posture](../06-Governance/Security-Posture.md) first — in particular:

- **There is no authentication on `/mcp`.** Anyone who can reach port 3000 has full
  MCP access using your ServiceNow service account, including background script
  execution. Network isolation is currently the only control.
- Do not publish port 3000 to the internet. Put it behind your VNet, a private
  endpoint, and ideally a WAF.
- Use a dedicated, least-privileged ServiceNow service account per instance.

## Scaling

Session state is in memory. More than one replica requires sticky sessions, or clients
will intermittently get `400 Invalid or missing session ID`. See
[SSE and Reverse Proxies](SSE-and-Reverse-Proxies.md#azure-app-service--container-apps).

## Logs

```bash
docker logs -f avanade-servicenow-mcp
```

Output is unstructured `console.log` with emoji prefixes — no JSON, no levels, no
correlation IDs, and no per-tool audit trail. Finding 8 in
[Security Posture](../06-Governance/Security-Posture.md).
