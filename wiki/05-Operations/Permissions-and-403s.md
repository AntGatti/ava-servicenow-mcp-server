[← Home](../Home.md)

# Permissions and 403s

A `403 Forbidden` from ServiceNow is almost always the **service account's roles**, not
the MCP server. The server passes the error through unchanged.

---

## Diagnose first

```javascript
// 1. Confirm which instance and account you are actually on
SN-Get-Current-Instance({})

// 2. Try a table you know is readable
SN-Query-Table({ table_name: "incident", limit: 1 })

// 3. Try the table that failed
SN-Query-Table({ table_name: "sys_dictionary", limit: 1 })
```

If step 2 works and step 3 does not, it is a role problem on that table.

Outside the MCP server, the same check with curl:

```bash
curl -u "$USER:$PASS" \
  "https://your-instance.service-now.com/api/now/table/incident?sysparm_limit=1"
```

---

## Roles by table

| Table | Required role | Purpose |
|---|---|---|
| `sys_dictionary` | `personalize_dictionary` | Field definitions |
| `sys_db_object` | `personalize_dictionary` | Table definitions |
| `sys_choice` | `admin` | Choice list values |
| `sys_glide_object` | `admin` | Data type definitions |
| `sys_ui_policy` | `admin` | UI policy definitions |
| `sys_script` | `admin` | Business rules |
| `sys_properties` | `admin` | System properties |
| `sys_trigger` | `admin` | Required by `SN-Execute-Background-Script` |
| `sys_update_set`, `sys_update_xml` | `admin` | Update set tooling |

Tools most often hit by this: `SN-Get-Table-Schema`, `SN-Discover-Table-Schema`,
`SN-Explain-Field`, `SN-List-Available-Tables`, `SN-Execute-Background-Script`.

---

## Fixes, least privilege first

### Grant `personalize_dictionary` (covers most schema 403s)

`User Administration → Users →` your service account `→ Roles → Edit →` add
`personalize_dictionary`.

This is the narrowest fix for the common case and should be tried before anything else.

### A scoped custom role

For anything beyond schema reads, prefer a purpose-built role over `admin`:

1. `User Administration → Roles → New` — e.g. `x_avanade_mcp_integration`
2. Add only the ACLs the deployment genuinely needs
3. Assign it to the service account

### Granting `admin` — understand the trade

`admin` resolves every 403 in the table above, and it is what most existing deployments
use. It also means the MCP server can do **anything** on that instance.

Combine that with the fact that the HTTP server currently has
[no authentication](../06-Governance/Security-Posture.md#1-no-authentication-), and an
`admin` service account means anyone who can reach the port is an instance
administrator. If you must grant `admin`, confirm the server is not reachable from an
untrusted network.

---

## Not actually a permissions problem

| Symptom | Real cause |
|---|---|
| 403 on every call, including `incident` | Wrong credentials, or the account is locked |
| 401 rather than 403 | Authentication failed — check username/password |
| 403 only on writes | Read-only ACL, or the record is in a locked update set |
| Works in the UI, fails via REST | The account lacks the role, or the REST API plugin is restricted |
| "Tool not found" | Not a permissions issue — the tool may not exist. See [Tool Index](../02-Tool-Reference/Tool-Index.md) |

---

## Least privilege, practically

The tool surface is broad by design — generic CRUD over any table. That makes
least-privilege hard to express through roles alone, because a single role has to cover
every table any caller might touch.

The durable answer is **tool-level authorization in the server** — a table allowlist and
a read-only profile for production — so the service account can be narrowed without
breaking callers who never needed the wide surface. That is tracked as finding 5 in
[Security Posture](../06-Governance/Security-Posture.md#5-no-tool-level-authorization-).
