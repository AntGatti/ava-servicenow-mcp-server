---
name: aria-incident-list
description: Retrieve the user's top 10 open incidents with total open count in a single optimised pass. Open = any state except Resolved (6) and Closed (7).
---

## Open Incident Definition
- **Open**: state NOT IN 6, 7, 8 — includes New (1), In Progress (2), On Hold (3), AI Resolved (99).
- **Closed/Done**: Resolved (6), Closed (7), Canceled (8) — excluded from this query entirely.

## Execution (Single Pass)
Run these two calls **in parallel**:

**Call 1 — Top 10 list:**
- Tool: SN-List-Incidents or SN-Query-Table
- Query: `caller_id.email=<normalized_user_email>^stateNOT IN6,7,8^ORDERBYDESCsys_created_on` *(ServiceNow encoded format — no space between `state` and `NOT IN`)*
- Fields: `number, short_description, state, sys_created_on, sys_id`
- Limit: 10

**Call 2 — Total count:**
- Tool: SN-Query-Table
- Query: same as Call 1
- Limit: 1
- Request count only (sysparm_count=true if supported, otherwise use result to confirm existence)

## Rules
1. Always run both calls in parallel — never sequentially.
2. Never retry or reformulate the query. If Call 1 returns 0 results, report no open incidents found.
3. Do not query sys_journal_field or sys_audit in list mode.
4. Pass the result list and total_count to aria-incident-response-builder for rendering.
5. If total_count > 10, include the remainder count and a brief note about older incidents not shown.
6. Never return closed or resolved incidents in the list.
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.