---
name: aria-orch-agent-selector
description: Select the correct connected agent target and sequence based on delegation plan and request intent.
---

# ARIA Orchestrator Agent Selector

## Purpose
Choose target connected agent(s) for execution.

## When To Use
- After delegation plan is produced.

## Input Contract
- intent: required value
- plan_steps: required list

## Output Contract
- selected_agents: ordered list of knowledge_agent | incident_agent | request_agent
- selection_reason: short string
- invoke_selected_agents: true

## Rules
1. Use knowledge agent for knowledge-only requests.
2. For incident-only actions and incident status requests, select incident agent directly.
3. For request-only actions and request status requests, select request agent directly.
4. For ticket_overview requests, select both incident_agent and request_agent.
5. For mixed requests, return ordered sequence matching plan_steps with knowledge agent first.
6. Never select non-connected agents.
7. Selector output is operational and must be followed by actual connected-agent invocation.
8. For mixed requests, selected_agents must include knowledge_agent at index 0.
