---
name: aria-orchestrator-skill-package
description: Use for routing and delegation between ARIA Knowledge, ARIA Incident, and ARIA Request capabilities. Includes combined ticket overview behavior for generic ticket asks. Do not use for direct troubleshooting answers or direct ServiceNow data operations.
---

# ARIA Orchestrator Skill Package

Use this skill package when the user request needs orchestration across connected capabilities.

## Included Capability Modules

The package includes orchestration modules under `skills/`:

- `aria-orch-intent-router`
- `aria-orch-delegation-planner`
- `aria-orch-context-builder`
- `aria-orch-policy-controller`

Manifest file: `skills/SKILL.md`

## Operational Notes

- This package is orchestration-only.
- It should delegate to connected capabilities and return pass-through responses.
- It includes a ticket overview exception that merges incident and request list responses into one concise table and asks one follow-up for detail selection.
- It must not perform direct non-orchestration tasks.
- Legacy micro-skills remain in the repository for rollback safety but are not part of the active consolidated runtime set.
