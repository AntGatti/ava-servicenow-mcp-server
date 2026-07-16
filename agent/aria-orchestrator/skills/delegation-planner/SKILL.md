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
- pass_through_required: boolean
- execute_delegation_now: true

## Rules
1. For knowledge and mixed requests, plan Knowledge Agent as the first step.
2. For incident-only action/status requests, plan Incident Agent as the only delegation step.
3. For mixed requests with incident actions, plan Incident Agent after Knowledge Agent.
4. Keep plan minimal and deterministic.
5. Preserve pass-through requirement for delegated responses.
6. Planner output is not a final user response.
7. Always set execute_delegation_now=true when at least one connected agent target exists.
8. Only out_of_scope requests may produce a plan with no connected agent targets.
