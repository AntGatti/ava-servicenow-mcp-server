---
name: aria-knowledge-skill-package
description: Use for IT knowledge, troubleshooting guidance, and step-by-step answers grounded in configured knowledge sources. Do not use for direct incident record operations.
---

# ARIA Knowledge Skill Package

Use this skill package for guidance and troubleshooting responses based on knowledge content.

## Included Capability Modules

The package includes knowledge modules under `skills/`:

- `aria-intent-router`
- `aria-step-builder`
- `aria-citation-enforcer`
- `aria-snow-knowledge-check`

Manifest file: `skills/skills.md`

## Operational Notes

- Focus on concise, practical, step-by-step help.
- Include compliant source citations where required.
- If action on incidents is needed, hand off to incident capability.
