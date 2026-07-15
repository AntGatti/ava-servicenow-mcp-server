# ServiceNow Tables — Reference Guide

> **Source:** Discovered via ServiceNow MCP Server (`SN-Get-Table-Schema`, `SN-List-Available-Tables`)  
> **Instance:** accenture — https://accentureservicessrodemo4.service-now.com  
> **Last updated:** 2026-05-19

---

## How to read this guide

Each section covers:
- **When to use** — the decision rule for picking this table
- **Key fields** — identifier and display fields
- **Mandatory fields** — minimum required to create a record
- **Common fields** — fields regularly queried or updated
- **Relations** — foreign keys and parent/child links
- **MCP operations** — supported CRUD via MCP tools

---

## Table Overview Map

```
ITSM (Service Desk)
├── incident            ← Unplanned disruption or degradation
├── problem             ← Root cause investigation
└── change_request      ← Planned change to infrastructure/service
    └── change_task     ← Sub-tasks within a change

Service Catalog (Fulfilment)
├── sc_category         ← Groups catalog items (e.g. "Hardware", "Software")
├── sc_cat_item         ← What a user can order (the catalogue item definition)
├── sc_request  (REQ)   ← The shopping cart / overall request submitted by user
│   └── sc_req_item (RITM) ← Individual line items inside a request
│       └── sc_task         ← Fulfilment tasks assigned to fulfilment teams

CMDB (Configuration)
├── cmdb_ci             ← Base CI record (all configuration items)
├── cmdb_ci_computer    ← Computer-class CIs (workstations, laptops)
├── cmdb_ci_server      ← Server-class CIs
└── cmdb_rel_ci         ← Relationships between CIs
```

---

## 1. Incident (`incident`)

### When to use
Use `incident` when something **is broken or degraded right now** and needs to be restored as fast as possible. Do **not** use it for service requests or planned work.

> Rule: "Something that wasn't supposed to happen happened." → `incident`

### Key fields
| Field | Purpose |
|-------|---------|
| `number` | Human-readable ID (e.g. `INC0012345`). Auto-generated. |
| `short_description` | One-line summary. **Display field.** |
| `sys_id` | Internal GUID. Use as foreign key from other tables. |

### Mandatory fields (minimum to create)
| Field | Type | Notes |
|-------|------|-------|
| `short_description` | String | Required. Max 160 chars. |

### Common fields
| Field | Type | Description |
|-------|------|-------------|
| `caller_id` | Reference → `sys_user` | Who reported the incident |
| `state` | Integer (Choice) | `1`=New, `2`=In Progress, `3`=On Hold, `6`=Resolved, `7`=Closed, `8`=Cancelled |
| `priority` | Integer (Choice) | Calculated from Impact + Urgency. `1`=Critical, `2`=High, `3`=Moderate, `4`=Low |
| `urgency` | Integer (Choice) | `1`=High, `2`=Medium, `3`=Low |
| `impact` | Integer (Choice) | `1`=High, `2`=Medium, `3`=Low |
| `category` | String (Choice) | e.g. `network`, `software`, `hardware` |
| `subcategory` | String (Choice) | Dependent on `category` |
| `assignment_group` | Reference → `sys_user_group` | Group responsible |
| `assigned_to` | Reference → `sys_user` | Individual assignee |
| `description` | String (Long) | Full description / steps to reproduce |
| `work_notes` | Journal | Internal notes (not visible to caller) |
| `comments` | Journal | Customer-visible updates |
| `cmdb_ci` | Reference → `cmdb_ci` | Affected configuration item |
| `resolved_at` | DateTime | When incident was resolved |
| `close_notes` | String | Resolution summary |
| `problem_id` | Reference → `problem` | Linked root cause problem |
| `sys_created_on` | DateTime | Auto-set on creation |
| `sys_updated_on` | DateTime | Auto-updated on every save |

### State lifecycle
```
New (1) → In Progress (2) → On Hold (3) → Resolved (6) → Closed (7)
                                          ↑
                             [Resolution + close_notes required]
```

### Key relations
| Relation | Direction | Table | Purpose |
|----------|-----------|-------|---------|
| Raised by | incident → `sys_user` via `caller_id` | User who opened the ticket |
| Assigned to | incident → `sys_user` via `assigned_to` | Resolver |
| Assignment Group | incident → `sys_user_group` via `assignment_group` | Resolver team |
| Affected CI | incident → `cmdb_ci` via `cmdb_ci` | What is broken |
| Root cause | incident → `problem` via `problem_id` | Problem record |
| Service | incident → `cmdb_ci_service` via `business_service` | Affected service |

### MCP operations
```
SN-List-Incidents       — list with filters
SN-Get-Incident         — get by sys_id or number
SN-Create-Incident      — create new (short_description required)
SN-Assign-Incident      — assign to user/group
SN-Add-Work-Notes       — add internal notes
SN-Close-Incident       — close with resolution notes
SN-Resolve-Incident     — set to Resolved state
```

---

## 2. Service Catalog — REQ and RITM (sometimes called RTI by mistake)

In ServiceNow catalog fulfillment, the core execution objects are:
- `sc_request` = REQ (the parent order envelope)
- `sc_req_item` = RITM (the child line item, sometimes mistyped as RTI)

### 2.0 End-to-end entity model

```
sc_category (catalog grouping)
    │ 1:N
    ▼
sc_cat_item (what can be ordered)
    │ 1:N (ordered as)
    ▼
sc_req_item (RITM line item) ─── 1:N ───► sc_task (fulfillment tasks)
    ▲
    │ N:1 (belongs to)
sc_request (REQ parent order)
    │
    └── references users (requested_for, opened_by)

Optional variable layer:
sc_req_item ─ 1:N ─► sc_item_option_mtom ─ N:1 ─► sc_item_option / item_option_new
```

### 2.1 Lifecycle and ownership

1. User submits one or more catalog items.
2. ServiceNow creates one `sc_request` (REQ).
3. ServiceNow creates one `sc_req_item` (RITM) per selected catalog item.
4. Workflow/Flow generates one or more `sc_task` rows per RITM.
5. Fulfillment works at RITM/task level; approval can exist on both REQ and RITM depending on design.

Rule of thumb:
- Report to requester: REQ.
- Operate/fulfill: RITM and `sc_task`.

---

## 2a. Request (`sc_request`) — parent envelope

### When to use
Use `sc_request` when you need the whole order context: requester, overall approval, and umbrella state.

### Key fields
| Field | Purpose |
|-------|---------|
| `number` | Human-readable ID (e.g. `REQ0010192`). |
| `sys_id` | Primary key used by child RITMs (`sc_req_item.request`). |
| `requested_for` | End user receiving the service. |
| `opened_by` | User who submitted the order. |

### Common fields
| Field | Type | Description |
|-------|------|-------------|
| `state` | Integer | Overall request state |
| `approval` | Choice | Overall approval status |
| `stage` | Choice/String | Request stage |
| `active` | Boolean | Open/closed marker |
| `price` | Currency | Total price |
| `sys_created_on` | DateTime | Creation timestamp |
| `sys_updated_on` | DateTime | Last update timestamp |

### Key relation
| Relation | Direction | Table |
|----------|-----------|-------|
| REQ has many RITMs | `sc_request.sys_id` → `sc_req_item.request` | `sc_req_item` |

### Real example (from live data)
| Field | Value |
|-------|-------|
| `number` | `REQ0010192` |
| `sys_id` | `d3fea3c82b233e1815a9f5685e91bf03` |
| `state` | `4` |
| `approval` | `approved` |
| `sys_created_on` | `2026-03-06 10:05:04` |

### MCP operations
```
SN-Query-Table table_name=sc_request
SN-Get-Record  table_name=sc_request
SN-Update-Record table_name=sc_request
```

---

## 2b. Requested Item (`sc_req_item`) / RITM — execution unit

### When to use
Use `sc_req_item` for operational tracking and fulfillment automation.

### Key fields
| Field | Purpose |
|-------|---------|
| `number` | Human-readable line item ID (e.g. `RITM0010179`). |
| `sys_id` | RITM primary key. |
| `request` | FK to parent REQ (`sc_request.sys_id`). |
| `cat_item` | FK to ordered catalog item (`sc_cat_item.sys_id`). |

### Common fields
| Field | Type | Description |
|-------|------|-------------|
| `state` | Integer | RITM state |
| `approval` | Choice | Item-level approval |
| `stage` | Choice/String | Fulfillment stage |
| `assigned_to` | Reference | Individual owner |
| `assignment_group` | Reference | Fulfillment team |
| `quantity` | Integer | Ordered quantity |
| `price` | Currency | Item price |
| `active` | Boolean | Open/closed marker |
| `short_description` | String | Item-level summary |
| `sys_created_on` | DateTime | Creation timestamp |

### Key relations
| Relation | Direction | Table |
|----------|-----------|-------|
| Parent REQ | `sc_req_item.request` → `sc_request.sys_id` | `sc_request` |
| Ordered item template | `sc_req_item.cat_item` → `sc_cat_item.sys_id` | `sc_cat_item` |
| Fulfillment tasks | `sc_task.request_item` → `sc_req_item.sys_id` | `sc_task` |
| Variable values | `sc_item_option_mtom.request_item` → `sc_req_item.sys_id` | `sc_item_option_mtom` |

### Real linked example (REQ + RITM)
| Field | Value |
|-------|-------|
| `RITM number` | `RITM0010179` |
| `RITM sys_id` | `9ffea3c82b233e1815a9f5685e91bf03` |
| `RITM request` | `d3fea3c82b233e1815a9f5685e91bf03` |
| `Parent REQ number` | `REQ0010192` |
| `RITM cat_item` | `f7a039ec1be4be10f673ea48624bcbbe` |
| `RITM stage` | `Assess or Scope Task` |
| `RITM short_description` | `Request a new laptop` |

### MCP operations
```
SN-Query-Table table_name=sc_req_item
SN-Get-Record  table_name=sc_req_item
SN-Update-Record table_name=sc_req_item
```

---

## 2c. Fulfillment Task (`sc_task`) — task execution layer

### When to use
Use `sc_task` for team work queues, task SLA tracking, and technician execution status.

### Common relationship
| Parent | Child | Link |
|--------|-------|------|
| `sc_req_item` | `sc_task` | `sc_task.request_item = sc_req_item.sys_id` |

### Typical fields to read
`number`, `request_item`, `state`, `assignment_group`, `assigned_to`, `short_description`, `due_date`, `sys_created_on`

### MCP operations
```
SN-Query-Table table_name=sc_task
SN-Get-Record  table_name=sc_task
SN-Update-Record table_name=sc_task
```

---

## 2d. Catalog Item (`sc_cat_item`) and Category (`sc_category`)

### Why they matter for REQ/RITM
- `sc_cat_item` determines what is orderable and what workflow/stages are applied.
- `sc_category` is navigation/grouping only, but often used by filters and reporting.

### Key relation
| Relation | Direction |
|----------|-----------|
| Category to items | `sc_cat_item.category` → `sc_category.sys_id` |

### MCP operations
```
SN-Query-Table table_name=sc_cat_item
SN-Get-Record  table_name=sc_cat_item
SN-Query-Table table_name=sc_category
```

---

## 2e. Variables layer (important for "what user asked for")

For many catalog items, the real business payload is not on REQ/RITM columns but in variable tables.

Primary path:
`sc_req_item` → `sc_item_option_mtom` → `sc_item_option`/`item_option_new`

Use this when you need details like RAM size, laptop model choice, shipping location, etc.

---

## 2f. How REQ and RITM are connected (quick checks)

### Check children for one REQ
```javascript
SN-Query-Table({
  table_name: "sc_req_item",
  query: "request=d3fea3c82b233e1815a9f5685e91bf03",
  fields: "number,request,cat_item,state,approval,stage,assigned_to,assignment_group"
})
```

### Check parent from one RITM
```javascript
SN-Get-Record({
  table_name: "sc_request",
  sys_id: "d3fea3c82b233e1815a9f5685e91bf03"
})
```

---

## 2g. Create REQ + connected RITM from scratch

### Important implementation note
Best-practice creation is through the catalog ordering engine (cart/API/portal), because it automatically handles approvals, variables, and task generation.

Direct table creation with MCP is possible for controlled automation, but may not trigger all standard business logic unless your instance rules are designed for it.

Answer to "what is the right process with MCP to trigger all approvals?":
1. Discover catalog item execution metadata first (flow/workflow/plan).
2. Submit the request through the ordering engine (not raw inserts) so platform logic creates REQ/RITM/tasks/approvals.
3. Validate approval + task artifacts after submission.

### Minimal direct MCP flow (table-level bootstrap)

1. Create parent REQ in `sc_request`.
2. Create child RITM in `sc_req_item` with `request=<REQ.sys_id>` and `cat_item=<catalog item sys_id>`.
3. Optionally create/update `sc_task` rows if your flow does not auto-generate them.
4. Validate linkage by querying `sc_req_item` on `request=<REQ.sys_id>`.

### Example: direct bootstrap with MCP
```javascript
// Step 1: Create REQ
const req = SN-Create-Record({
  table_name: "sc_request",
  data: {
    requested_for: "405cc387fb76be10a5c9ff8165efdce6",
    opened_by: "405cc387fb76be10a5c9ff8165efdce6",
    approval: "requested",
    active: true
  }
});

// Step 2: Create connected RITM
const ritm = SN-Create-Record({
  table_name: "sc_req_item",
  data: {
    request: req.sys_id,
    cat_item: "f7a039ec1be4be10f673ea48624bcbbe",
    short_description: "Request a new laptop",
    quantity: 1,
    approval: "requested",
    active: true
  }
});

// Step 3: Verify connection
SN-Query-Table({
  table_name: "sc_req_item",
  query: "request=" + req.sys_id,
  fields: "number,request,cat_item,state,approval,stage"
});
```

### Production-safe creation checklist
1. Validate `requested_for`, `opened_by`, and `cat_item` sys_ids first.
2. Set `request` on RITM explicitly (this is the core REQ↔RITM link).
3. Verify approval/stage behavior in your instance after create.
4. If needed, attach variable payload in the variable tables.
5. Confirm resulting `sc_task` creation (automatic or manual).

### Recommended MCP-first ordering process (approval-safe)

#### Phase A: Discover what drives fulfillment for the catalog item

For every `cat_item` you automate, run this discovery once and document outputs.

```javascript
SN-Get-Record({
  table_name: "sc_cat_item",
  sys_id: "<CAT_ITEM_SYS_ID>",
  fields: "sys_id,name,active,category,workflow,flow_designer_flow,delivery_plan,fulfillment_automation_level,request_method,no_cart"
})
```

Then discover how that item behaves on a real RITM:

```javascript
SN-Query-Table({
  table_name: "sc_req_item",
  query: "cat_item=<CAT_ITEM_SYS_ID>",
  fields: "sys_id,number,request,approval,state,stage,context,flow_context,cat_item",
  limit: 5
})
```

Check approval records and generated tasks:

```javascript
SN-Query-Table({
  table_name: "sysapproval_approver",
  query: "sysapproval=<RITM_SYS_ID>",
  fields: "sys_id,approver,state,source_table,sysapproval"
})

SN-Query-Table({
  table_name: "sc_task",
  query: "request_item=<RITM_SYS_ID>",
  fields: "number,state,assignment_group,assigned_to,short_description"
})
```

If legacy workflow/Flow Designer links exist, inspect:
- `wf_context` (legacy workflow)
- `sys_flow_context` (Flow Designer)

#### Phase B: Create via ordering engine (preferred)

Use MCP `SN-Execute-Background-Script` to call ServiceNow ordering APIs (Cart/CartJS), not direct inserts. This preserves approval/task generation.

High-level pattern:
1. Create cart.
2. Add catalog item.
3. Set variable values.
4. Place order.
5. Capture returned REQ and RITM ids.

Example script pattern (pseudo-structure):
```javascript
// Pseudocode: execute via SN-Execute-Background-Script
// 1) cart = new Cart()/CartJS
// 2) item = cart.addItem('<cat_item_sys_id>')
// 3) cart.setVariable(item, '<var_name>', '<value>')
// 4) req = cart.placeOrder()
// 5) output req + ritm references
```

#### Phase C: Post-create validation (mandatory)

Immediately validate:
1. REQ exists and linked RITMs exist.
2. RITM `approval` and `stage` progressed as expected.
3. Expected `sysapproval_approver` rows exist.
4. Expected `sc_task` rows exist.

---

### Workflow extraction baseline for this environment (live sample)

Catalog item sample: `f7a039ec1be4be10f673ea48624bcbbe` (`New Laptop Request`)
- `workflow`: empty
- `flow_designer_flow`: empty
- `delivery_plan`: `523da512c611228900811a37c97c2014`

RITM sample: `RITM0010179`
- `approval`: `approved`
- `stage`: `Assess or Scope Task`
- `context`: empty
- `flow_context`: empty

Generated tasks for this RITM:
- `SCTASK0010138` (`Assess or Scope Task`)
- `SCTASK0010139` (`Provide requested service`)

Interpretation: for this item, fulfillment/approval evidence is visible on RITM + `sc_task`, even when direct workflow context fields are empty.

### Additional live examples (REQ and RITM)

REQ examples:
- `REQ0010193` — state `4`, approval `approved`, created `2026-03-06 11:16:33`
- `REQ0010188` — state `4`, approval `approved`, created `2026-03-02 12:20:40`
- `REQ0010184` — state `1`, approval `approved`, created `2026-02-27 14:34:54`

RITM examples:
- `RITM0010179` — short description `Request a new laptop`, stage `Assess or Scope Task`
- `RITM0010172` — short description `Standard Laptop (Lenovo Carbon X1)`, stage `request_approved`
- `RITM0010166` — short description `Development Laptop (PC) - Dell XPS 13`, stage `request_approved`

---

## 3. Related ITSM Tables (brief reference)

### Problem (`problem`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Root cause analysis for recurring incidents |
| **Key field** | `number` (e.g. `PRB0001234`) |
| **Mandatory** | `short_description` |
| **Links to** | `incident` (1:N via `problem_id`), `change_request` (to implement fix) |
| **When to use** | "We keep getting the same incident — investigate the root cause" |

### Change Request (`change_request`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Planned, controlled change to IT infrastructure or services |
| **Key field** | `number` (e.g. `CHG0001234`) |
| **Mandatory** | `short_description` |
| **Links to** | `change_task` (sub-tasks), `cmdb_ci` (affected CIs), `problem` (driving problem) |
| **When to use** | "I need to patch a server / release new software in a controlled way" |

### Change Task (`change_task`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Individual work steps within a change request |
| **Key field** | `sys_id` |
| **Links to** | `change_request` (parent) |
| **When to use** | "I need to assign specific steps of a change to different teams" |

---

## 4. CMDB Tables (brief reference)

| Table | Purpose | When to use |
|-------|---------|-------------|
| `cmdb_ci` | Base configuration item. All CIs extend this. | Lookup any CI by name; use `sys_id` as FK in incidents/changes |
| `cmdb_ci_computer` | Computer-class CIs (laptops, desktops) | Finding end-user devices |
| `cmdb_ci_server` | Server-class CIs | Finding servers for incident/change context |
| `cmdb_rel_ci` | Relationship between two CIs | Understanding dependency topology |

---

## 5. Quick Decision Matrix

| Scenario | Table |
|----------|-------|
| User reports something is broken | `incident` |
| User requests a new laptop | `sc_request` → `sc_req_item` |
| Retrieve what items are orderable | `sc_cat_item` |
| Investigate why incidents keep recurring | `problem` |
| Plan a firmware upgrade across 50 servers | `change_request` + `change_task` |
| Find which server is related to an incident | `cmdb_ci` / `cmdb_ci_server` |
| Check the fulfilment status of a single order line | `sc_req_item` (RITM) |
| Check overall approval of an entire order | `sc_request` (REQ) |
| List categories in the service catalogue | `sc_category` |

---

## 6. MCP Query Examples

```javascript
// List open P1/P2 incidents
SN-Query-Table({
  table_name: "incident",
  query: "active=true^priority<=2^stateNOT IN6,7,8",
  fields: "number,short_description,priority,state,assigned_to,assignment_group",
  limit: 20
})

// Get all RITMs for a specific REQ
SN-Query-Table({
  table_name: "sc_req_item",
  query: "request=<REQ_SYS_ID>",
  fields: "number,name,state,assigned_to,cat_item"
})

// Find catalogue items in a category
SN-Query-Table({
  table_name: "sc_cat_item",
  query: "active=true^category.name=Hardware",
  fields: "sys_id,name,short_description,price"
})

// List all open change requests
SN-Query-Table({
  table_name: "change_request",
  query: "active=true^stateNOT IN3,4",
  fields: "number,short_description,state,assignment_group,start_date,end_date"
})
```

---

*This document is generated from MCP server discovery + ServiceNow platform knowledge. Deep field-level details (choice values, business rules, UI policies) can be retrieved live with `SN-Discover-Table-Schema` once the ServiceNow instance credentials are active.*
