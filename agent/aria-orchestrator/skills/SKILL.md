---
name: aria-orchestrator-skills-manifest
description: Manifest for ARIA Orchestrator skills package. Use for skill discovery and zip packaging metadata.
---

manifest_version: 1
agent: aria-orchestrator
skills:
  - file: agent/aria-orchestrator/skills/intent-router/SKILL.md
    name: aria-orch-intent-router
    description: Classify each request as knowledge, incident, mixed, or out-of-scope to drive routing decisions.
  - file: agent/aria-orchestrator/skills/capability-gate/SKILL.md
    name: aria-orch-capability-gate
    description: Enforce connected-agent-only capability disclosure and block claims outside orchestrator scope.
  - file: agent/aria-orchestrator/skills/delegation-planner/SKILL.md
    name: aria-orch-delegation-planner
    description: Apply mandatory delegation policy and generate the correct routing plan across connected agents.
  - file: agent/aria-orchestrator/skills/context-builder/SKILL.md
    name: aria-orch-context-builder
    description: Build compact, complete delegation payloads with user details and request context for connected agents.
  - file: agent/aria-orchestrator/skills/agent-selector/SKILL.md
    name: aria-orch-agent-selector
    description: Select the correct connected agent target and sequence based on delegation plan and request intent.
  - file: agent/aria-orchestrator/skills/pass-through-enforcer/SKILL.md
    name: aria-orch-pass-through-enforcer
    description: Enforce exact pass-through output for delegated responses without rewrite, summarization, or formatting changes.
  - file: agent/aria-orchestrator/skills/fallback-handler/SKILL.md
    name: aria-orch-fallback-handler
    description: Generate safe, friendly fallback responses when a connected agent is unavailable or delegation fails.
  - file: agent/aria-orchestrator/skills/scope-guard/SKILL.md
    name: aria-orch-scope-guard
    description: Enforce orchestration-only boundaries and block unsupported tasks outside connected-agent scope.
  - file: agent/aria-orchestrator/skills/clarification-controller/SKILL.md
    name: aria-orch-clarification-controller
    description: Ask minimal clarification questions only when routing ambiguity remains after knowledge-first evaluation.
  - file: agent/aria-orchestrator/skills/response-policy-enforcer/SKILL.md
    name: aria-orch-response-policy-enforcer
    description: Enforce strict pass-through responses from connected agents and apply controlled fallback when no agent can handle the request.
