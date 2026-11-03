[← Home](../Home.md)

# Platform Limitations

What ServiceNow itself prevents, regardless of how the MCP server is written. These are
the constraints behind several design decisions — and behind a large amount of
aspirational tooling in old documentation that was never built because it could not be.

---

## Flow Designer cannot be created via REST

**There is no public REST API for creating or modifying flows.** Flow Designer is
designed for UI-based authoring.

The underlying tables are readable over REST:

| Table | Holds |
|---|---|
| `sys_hub_flow` | Flow records |
| `sys_hub_flow_logic` | Flow logic and action definitions |
| `sys_hub_flow_logic_definition` | Action mappings |
| `sys_hub_action_instance` | Action instances |
| `sys_hub_step_instance` | Step configuration |
| `sys_hub_flow_variable` | Variables |
| `sys_hub_flow_input` / `_output` | Input and output definitions |

But writing to them does not produce a working flow. Flows require **compilation**,
which only the Flow Designer UI performs. The failure mode is nasty:

> The flow appears created, shows no error, and fails only at runtime — with debugging
> possible only through the Flow Designer UI.

That silent-failure property is why this server exposes **no flow-creation tools**.
Old documentation describes roughly twenty (`SN-Create-Flow`, `SN-Execute-Flow`,
`SN-Export-Flow` …). None exist. See
[Documentation Standards](../06-Governance/Documentation-Standards.md#why-rule-1-exists).

### What you can do

| Goal | Approach |
|---|---|
| Run an existing flow | Server-side script via `SN-Execute-Background-Script` — executes only, cannot create or modify |
| Read flow configuration | `SN-Query-Table` against the `sys_hub_*` tables |
| Move flows between instances | Update sets |
| Automate the logic | **Use classic Workflow instead** — see below |

---

## Classic Workflow *can* be built programmatically

Unlike Flow Designer, classic Workflow has no compilation step, so it can be created
entirely through the API. This server exposes four tools for it:

```javascript
SN-Create-Workflow({ ... })
SN-Create-Activity({ ... })
SN-Create-Transition({ ... })
SN-Publish-Workflow({ ... })
```

| | Classic Workflow | Flow Designer |
|---|---|---|
| Programmatic creation | ✅ | ❌ |
| Compilation required | no | yes, UI only |
| ServiceNow's strategic direction | legacy | current |

The trade is real: Workflow is the automatable option but the legacy one. Choose it when
automation matters more than following the platform roadmap; otherwise author flows in
the UI and move them with update sets.

---

## Operations that need the UI API

Some operations have no REST equivalent and are performed against internal UI endpoints
with an authenticated session:

| Operation | Endpoint |
|---|---|
| Set current update set | `PUT /api/now/ui/concoursepicker/updateset` |
| Set current application scope | `PUT /api/now/ui/concoursepicker/application` |

These are **internal, undocumented endpoints**. They work, and `SN-Set-Update-Set` and
`SN-Set-Current-Application` depend on them, but ServiceNow may change them in any
release without notice. `SN-Set-Update-Set` falls back to a `sys_trigger` background
script if the UI call fails.

Treat both as a supported-but-fragile dependency: if either tool breaks after a platform
upgrade, this is the first place to look.

---

## UI Policy Actions

Fields on `catalog_ui_policy_action` — notably `ui_policy` and `catalog_variable` —
**cannot be set through the REST API**. They require `setValue()` from a server-side
script.

This is the one documented case where
[`SN-Execute-Background-Script`](../02-Tool-Reference/Usage-Patterns.md#background-scripts--last-resort)
is the correct first choice rather than a fallback: create the record with
`SN-Create-Record`, then set the linking fields with a background script.

---

## Summary

| Capability | Via this server |
|---|---|
| Generic CRUD on any table | ✅ |
| Update set management | ✅ (UI API, with script fallback) |
| Application scope switching | ✅ (UI API) |
| Classic Workflow creation | ✅ |
| Background script execution | ✅ (`sys_trigger`) |
| Flow Designer creation | ❌ platform limitation |
| Flow compilation | ❌ UI only |
| UI Policy Action field linking | ⚠️ background script required |
