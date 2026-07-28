---
name: aria-orch-policy-controller
description: Unified orchestrator policy controller for scope and capability gating, clarification decisions, pass-through enforcement, and controlled fallback handling.
---

# ARIA Orchestrator Policy Controller

## Purpose
Enforce all user-visible orchestration policy decisions in one skill to reduce chain depth and keep behavior deterministic.

## When To Use
- After intent routing and delegation planning.
- Before sending any user-visible response.

## Input Contract
- intent: required value
- user_request: required string
- routing_confidence: optional value
- clarification_needed: optional boolean
- delegation_available: required boolean
- connected_agent_response: optional string
- connected_agent_responses: optional ordered list of strings
- ticket_overview_rows_incidents: optional list
- ticket_overview_rows_requests: optional list
- fallback_attempt_count: required number (0 or 1 or more)

## Output Contract
- policy_decision: in_scope | out_of_scope_redirect | ask_clarification | pass_through | ticket_overview_merge | ask_rephrase | polite_no_information
- user_response: required when policy_decision is user-visible mode
- selected_response: optional string (for pass-through)
- next_fallback_attempt_count: required number

## Rules
1. Allow only connected-agent scope: knowledge, incident, request, mixed, ticket_overview, and escalation.
2. For explicit capability questions, mention only connected-agent capabilities.
3. If intent is out_of_scope, return out_of_scope_redirect with concise supported-use redirect and shared menu.
4. If routing_confidence is low and clarification_needed=true, ask one focused clarification question.
5. If delegation_available=true and a delegated response exists, return pass_through and the selected response exactly as received.
6. In pass_through mode, do not rewrite, summarize, translate, reformat, or append content.
7. When multiple delegated responses exist, select only the final response in execution order for pass-through.
8. For ticket_overview, merge incident and request rows into one concise table with: Type, ID, Short description, Status, Last update date.
9. In ticket_overview_merge mode, sort by last update date descending and show at most 10 rows.
10. In ticket_overview_merge mode, ask one focused follow-up question asking which ticket to inspect in detail.
11. If delegation is unavailable and fallback_attempt_count=0, return ask_rephrase.
12. If delegation remains unavailable after rephrase (fallback_attempt_count>=1), return polite_no_information.
13. Never fabricate answers when delegation is unavailable.
14. In non-pass-through user-visible modes, include exactly 3 menu options and the exact shared ending line.
15. In ticket_overview_merge mode, ID must be rendered from id_link_markdown as clickable markdown for both incident and request rows.
16. Do not emit plain unlinked ticket IDs in ticket_overview_merge output.

## Shared Menu Template (Mandatory)
1. {option_1}
2. {option_2}
3. {option_3}
Reply with 1, 2, or 3, or type your own reply.
