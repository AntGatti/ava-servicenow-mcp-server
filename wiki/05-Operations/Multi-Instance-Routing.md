[← Home](../Home.md)

# Multi-Instance Routing

One server process can target many ServiceNow instances. Routing happens at three
levels, most specific wins.

---

## 1. Per call — `instance` parameter

Every tool accepts an optional `instance`. This is the safest form: explicit, scoped to
one call, no state.

```javascript
SN-Query-Table({ table_name: "incident", limit: 10, instance: "prod" })
SN-Create-Record({ table_name: "sys_properties", data: {...}, instance: "dev" })
```

**Prefer this** in automation and in agent instructions. Nothing to remember, nothing
to reset, no ordering dependency.

## 2. Per session — `SN-Set-Instance`

```javascript
SN-Set-Instance({})                           // list available instances
SN-Set-Instance({ instance_name: "prod" })    // retarget this session
SN-Get-Current-Instance({})                   // confirm
```

Affects **only the calling session**, until changed or the session ends.

`SN-Set-Instance` accepts only names already in the configuration. It cannot be given an
arbitrary URL or credentials, so it is not an SSRF vector.

## 3. Process default

The instance with `"default": true`, or `SERVICENOW_INSTANCE`. If no entry is flagged
default, the **first** in the array is used. See [Configuration](../01-Getting-Started/Configuration.md).

---

## Sessions are isolated

Each MCP session gets **its own ServiceNow client**. `SN-Set-Instance` in one session
cannot affect another.

This is worth stating explicitly because it was not always true. The server previously
shared a single client across all sessions, so one caller switching to prod silently
retargeted every other caller's reads *and writes* — no attacker required, ordinary
concurrent use triggered it. Fixed; see
[Security Posture](../06-Governance/Security-Posture.md#what-has-been-fixed).

If you are running an older deployment, treat `SN-Set-Instance` as process-global and
avoid it in favour of the per-call `instance` parameter.

---

## Listing instances

```javascript
SN-Set-Instance({})   // via MCP
```

```bash
curl http://localhost:3000/instances   # via HTTP
```

Both return name, URL, default flag and description. **Neither returns credentials.**

> `GET /instances` is currently **unauthenticated** — anyone who can reach the port can
> enumerate your instance names and URLs. Finding 6 in
> [Security Posture](../06-Governance/Security-Posture.md).

---

## Working safely across dev and prod

The tool surface is identical on every instance, including destructive operations.
Nothing in the server distinguishes prod from dev.

- Name instances unambiguously — `prod`, not `p` or `main`.
- Pass `instance` explicitly on every write.
- Confirm with `SN-Get-Current-Instance` before a batch operation that relies on
  session state.
- Give each instance its **own service account**. Shared credentials across instances
  defeat the separation entirely.
- Use a narrower-privileged account on prod than on dev.

A production read-only profile is tracked as finding 5 in
[Security Posture](../06-Governance/Security-Posture.md#5-no-tool-level-authorization-).
Until it exists, instance separation is a convention the server does not enforce.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Instance 'x' not found. Available instances: ...` | Name mismatch; the error lists valid names |
| Calls hit the wrong instance | Session state from an earlier `SN-Set-Instance`. Check `SN-Get-Current-Instance` |
| Config changes have no effect | Instances are cached per process after first load — restart the server |
| Works for one instance, 403 on another | Per-instance service account roles differ. See [Permissions and 403s](Permissions-and-403s.md) |
