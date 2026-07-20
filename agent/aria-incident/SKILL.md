---
name: aria-incident-skill-package
description: Use for ServiceNow incident lookup, status interpretation, response shaping, and incident-focused next steps. Do not use for general troubleshooting knowledge answers.
---

# ARIA Incident Skill Package

Use this skill package for incident-centric operations and incident response formatting.

## Included Capability Modules

The package includes incident modules under `skills/`:

- `aria-incident-identity-enforcer`
- `aria-incident-status-mapper`
- `aria-date-formatter`
- `aria-work-note-summarizer`
- `aria-incident-response-builder`
- `aria-next-step-suggester`

Manifest file: `skills/SKILL.md`

## Operational Notes

- Enforce identity scoping before record operations.
- Normalize state, dates, and summaries for user-facing responses.
- Keep responses actionable with explicit next-step options.
