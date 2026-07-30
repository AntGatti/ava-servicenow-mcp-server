---
name: aria-orch-delegation-planner
description: Apply mandatory delegation policy and generate the correct routing plan across connected agents.
---

# ARIA Orchestrator Delegation Planner

## Purpose
Build a routing plan that follows orchestrator delegation order.

## When To Use
- After intent classification and before agent call.

## Input Contract
- intent: required value
- user_message: required string
- policy_snapshot: required object

## Output Contract
- plan_steps: ordered list
- target_agents: list
- selected_agents: ordered list of knowledge_agent | incident_agent | request_agent
- selection_reason: short string
- pass_through_required: boolean
- execute_delegation_now: true

## Rules
1. For knowledge and mixed requests, plan Knowledge Agent as the first step.
2. For incident-only action/status requests, plan Incident Agent as the only delegation step.
3. For request-only action/status requests, plan Request Agent as the only delegation step.
4. For mixed requests with incident actions, plan Incident Agent after Knowledge Agent.
5. For mixed requests with request actions, plan Request Agent after Knowledge Agent.
6. For ticket_overview requests, plan Incident Agent and Request Agent list retrieval, then plan orchestrator merge step into a concise combined table and a one-question detail prompt.
7. Keep plan minimal and deterministic.
8. Preserve pass-through requirement for delegated responses.
9. Planner output is not a final user response.
10. Always set execute_delegation_now=true when at least one connected agent target exists.
11. Only out_of_scope requests may produce a plan with no connected agent targets.
12. Set selected_agents to the execution order that must be invoked.
13. For knowledge intent, selected_agents must be [knowledge_agent].
14. For incident intent, selected_agents must be [incident_agent].
15. For request intent, selected_agents must be [request_agent].
16. For ticket_overview intent, selected_agents must be [incident_agent, request_agent].
17. For mixed intent, selected_agents must start with knowledge_agent and then include incident_agent or request_agent as needed.
18. For escalation intent, selected_agents must be [escalation_agent].
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.