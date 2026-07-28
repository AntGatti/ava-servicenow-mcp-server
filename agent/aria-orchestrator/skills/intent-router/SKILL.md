---
name: aria-orch-intent-router
description: Classify each request as knowledge, incident, request, mixed, ticket_overview, or out-of-scope to drive routing decisions.
---

# ARIA Orchestrator Intent Router

## Purpose
Detect the primary request type for orchestration.

## When To Use
- At the start of every user turn.

## Input Contract
- user_message: required string
- conversation_context: optional string

## Output Contract
- intent: knowledge | incident | request | mixed | ticket_overview | escalation | out_of_scope
- confidence: high | medium | low
- rationale: short sentence
- next_action: delegate_knowledge | delegate_incident_direct | delegate_request_direct | delegate_mixed | delegate_ticket_overview | delegate_escalation | refuse_or_redirect | ask_clarification
- delegate_to: knowledge_agent | incident_agent | request_agent | escalation_agent | both | none
- user_visible: false

## Rules
1. Return one primary intent.
2. Use mixed when the message combines knowledge plus incident action.
3. Use out_of_scope when request is outside connected-agent capabilities.
4. Keep rationale concise and user-safe.
5. This skill output is internal for orchestration and must not be returned directly to end users.
6. When intent is knowledge, set next_action=delegate_knowledge and delegate_to=knowledge_agent.
7. When intent is incident, set next_action=delegate_incident_direct and delegate_to=incident_agent.
8. When intent is request, set next_action=delegate_request_direct and delegate_to=request_agent.
9. When intent is ticket_overview, set next_action=delegate_ticket_overview and delegate_to=both.
10. When intent is mixed, set next_action=delegate_mixed and delegate_to=both.
11. When intent is out_of_scope, set next_action=refuse_or_redirect and delegate_to=none.
12. Use ticket_overview when user asks generic ticket language without explicitly choosing incidents or requests (for example: "show my tickets", "list my open tickets").
13. When intent is escalation, set next_action=delegate_escalation and delegate_to=escalation_agent.
14. Use escalation when the user wants to escalate an incident or check an existing escalation (signal words: "escalate", "escalation", "raise an escalation", "this needs escalating", "I need to escalate incident").
