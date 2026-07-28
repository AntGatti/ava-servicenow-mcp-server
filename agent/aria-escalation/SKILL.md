---
name: aria-escalation-skill-package
description: Use for escalation requests linked to existing ServiceNow incidents. Checks for duplicates and creates new escalation entries in the SharePoint Escalation Requests list.
---

# ARIA Escalation Skill Package

Use this skill package for all escalation check and create operations against the SharePoint Escalation Requests list.

## Included Capability Modules

The package includes escalation modules under `skills/`:

- `aria-escalation-identity-enforcer`
- `aria-escalation-handler`

Manifest file: `skills/SKILL.md`

## Operational Notes

- Always enforce identity before any list operation.
- Always check for an existing escalation before creating a new one.
- A valid incident_number and incident_link are mandatory inputs.
- Default escalation status is Created.
