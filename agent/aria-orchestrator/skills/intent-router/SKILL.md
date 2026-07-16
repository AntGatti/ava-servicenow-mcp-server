---
name: aria-orch-intent-router
description: Classify each request as knowledge, incident, mixed, or out-of-scope to drive routing decisions.
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
- intent: knowledge | incident | mixed | out_of_scope
- confidence: high | medium | low
- rationale: short sentence
- next_action: delegate_knowledge | delegate_incident_direct | delegate_mixed | refuse_or_redirect | ask_clarification
- delegate_to: knowledge_agent | incident_agent | both | none
- user_visible: false

## Rules
1. Return one primary intent.
2. Use mixed when the message combines knowledge plus incident action.
3. Use out_of_scope when request is outside connected-agent capabilities.
4. Keep rationale concise and user-safe.
5. This skill output is internal for orchestration and must not be returned directly to end users.
6. When intent is knowledge, set next_action=delegate_knowledge and delegate_to=knowledge_agent.
7. When intent is incident, set next_action=delegate_incident_direct and delegate_to=incident_agent.
8. When intent is mixed, set next_action=delegate_mixed and delegate_to=both.
9. When intent is out_of_scope, set next_action=refuse_or_redirect and delegate_to=none.
