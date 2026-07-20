---
name: aria-orchestrator-skills-manifest
description: Manifest for ARIA Orchestrator skills package. Use for skill discovery and zip packaging metadata.
---

manifest_version: 1
agent: aria-orchestrator
skills:
  - file: agent/aria-orchestrator/skills/intent-router/SKILL.md
    name: aria-orch-intent-router
    description: Classify each request as knowledge, incident, request, mixed, ticket_overview, or out-of-scope to drive routing decisions.
  - file: agent/aria-orchestrator/skills/delegation-planner/SKILL.md
    name: aria-orch-delegation-planner
    description: Apply mandatory delegation policy, generate target agents, and set final execution order.
  - file: agent/aria-orchestrator/skills/context-builder/SKILL.md
    name: aria-orch-context-builder
    description: Build compact, complete delegation payloads with user details and request context for connected agents.
  - file: agent/aria-orchestrator/skills/policy-controller/SKILL.md
    name: aria-orch-policy-controller
    description: Unified policy controller for scope and capability gating, clarification, pass-through enforcement, ticket overview merge, and fallback handling.
