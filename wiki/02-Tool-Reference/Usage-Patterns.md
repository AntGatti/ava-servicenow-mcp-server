[← Home](../Home.md)

# Usage Patterns

Worked examples. For exact parameters see the generated
[Tool Index](Tool-Index.md).

---

## Discovery before action

Do not guess table or field names.

```javascript
SN-List-Available-Tables({ category: "core_itsm" })
SN-Get-Table-Schema({ table_name: "change_request" })
SN-Explain-Field({ table_name: "incident", field_name: "urgency" })
```

`SN-Discover-Table-Schema` goes further and includes relationships. Both schema tools
read `sys_dictionary`, so a 403 here is a role problem — see
[Permissions and 403s](../05-Operations/Permissions-and-403s.md).

---

## Querying

```javascript
// Encoded query - precise, fast
SN-Query-Table({
  table_name: "incident",
  query: "active=true^priority=1^assigned_toISEMPTY",
  fields: "number,short_description,state",   // always narrow the payload
  limit: 10
})

// Natural language - good for exploration
SN-Natural-Language-Search({
  table_name: "incident",
  query: "active high priority incidents that are unassigned",
  limit: 10
})
```

The natural-language tool is `SN-Natural-Language-Search`. Older documentation calls it
`SN-NL-Search` and references an `SN-NL-Query-Builder`; **neither exists**.

Guidance:

| Use natural language | Use an encoded query |
|---|---|
| Exploring, prototyping | Automation and scheduled work |
| Communicating intent to a stakeholder | Performance-sensitive paths |
| You do not know the field names yet | Complex `OR` conditions |

Always pass `fields`. Without it ServiceNow returns every column plus reference links,
which is slow and floods an agent's context.

---

## Writing records

```javascript
SN-Create-Record({
  table_name: "sys_properties",
  data: { name: "x_custom.setting", value: "enabled" }
})

SN-Update-Record({
  table_name: "incident",
  sys_id: "abc123...",
  data: { state: "2" }
})
```

For ITSM work prefer the convenience tools — they take a number rather than a `sys_id`:

```javascript
SN-Assign-Incident({ number: "INC0010001", assigned_to: "admin" })
SN-Add-Work-Notes({ number: "INC0010001", work_notes: "Investigating" })
SN-Resolve-Incident({ number: "INC0010001", resolution_notes: "Restarted service" })
SN-Close-Incident({ number: "INC0010001", close_notes: "Confirmed with user" })
```

---

## Update sets and scoped applications

Set context **before** making configuration changes, or they land in the wrong place.

```javascript
SN-Set-Current-Application({ app_sys_id: "..." })   // scoped app work
SN-Set-Update-Set({ update_set_sys_id: "..." })     // then the update set

// ... make changes ...

// Verify capture
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=<update_set_sys_id>",
  fields: "sys_id,type,name"
})
```

Records in the wrong set are recoverable:

```javascript
SN-Move-Records-To-Update-Set({ ... })
SN-Inspect-Update-Set({ update_set_sys_id: "..." })
```

Prefer `SN-Update-Record` or `SN-Batch-Update` over a background script for this —
direct API calls report failure, scripts can fail silently.

---

## Batching

```javascript
SN-Batch-Update({
  updates: [
    { table: "sys_update_xml", sys_id: "id1", data: { update_set: "target" } },
    { table: "sys_update_xml", sys_id: "id2", data: { update_set: "target" } }
  ]
})
```

Several independent tool calls can also be issued in parallel in a single message.

---

## Background scripts — last resort

```javascript
SN-Execute-Background-Script({
  script: "gs.info('hello');",
  description: "Why this is necessary"
})
```

Runs server-side JavaScript via the `sys_trigger` table, executing in about a second.

Reach for it **only** when no tool can do the job — documented cases are
`catalog_ui_policy_action` field linking, which REST cannot set. Try the tools first,
including batch operations.

> ⚠️ This is arbitrary remote code execution against your ServiceNow instance. Combined
> with the fact that the HTTP server has
> [no authentication](../06-Governance/Security-Posture.md#1-no-authentication-), anyone
> who can reach the port can run it. Treat every use as privileged, and confirm the
> deployment is not reachable from an untrusted network.

Script output goes to ServiceNow **System Logs → All**, not to the MCP response.

---

## Tools that do not exist

These appear in older documentation with worked examples. **None are implemented:**

`SN-NL-Search` · `SN-NL-Query-Builder` · `SN-Sync-Script-To-Local` ·
`SN-Sync-Local-To-Script` · `SN-Watch-Script` · `SN-Update-Incident` ·
`SN-Search-Incidents` · every `SN-Puppeteer-*` · most `SN-*-Flow` tools

Full account: [Documentation Standards](../06-Governance/Documentation-Standards.md#why-rule-1-exists).
If a tool is not in [Tool Index](Tool-Index.md), it does not exist.
