---
name: aria-orchestrator-skill-package
description: Use for routing and delegation between ARIA Knowledge and ARIA Incident capabilities. Do not use for direct troubleshooting answers or direct incident data operations.
---

# ARIA Orchestrator Skill Package

Use this skill package when the user request needs orchestration across connected capabilities.

## Included Capability Modules

The package includes orchestration modules under `skills/`:

- `aria-orch-intent-router`
- `aria-orch-capability-gate`
- `aria-orch-delegation-planner`
- `aria-orch-context-builder`
- `aria-orch-agent-selector`
- `aria-orch-pass-through-enforcer`
- `aria-orch-fallback-handler`
- `aria-orch-scope-guard`
- `aria-orch-clarification-controller`
- `aria-orch-response-policy-enforcer`

Manifest file: `skills/skills.md`

## Operational Notes

- This package is orchestration-only.
- It should delegate to connected capabilities and return pass-through responses.
- It must not perform direct non-orchestration tasks.
