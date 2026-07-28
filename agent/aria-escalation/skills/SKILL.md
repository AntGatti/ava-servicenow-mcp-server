---
name: aria-escalation-skills-manifest
description: Manifest for ARIA Escalation Manager skills package. Use for skill discovery and zip packaging metadata.
---

manifest_version: 1
agent: aria-escalation
skills:
  - file: agent/aria-escalation/skills/identity-enforcer/SKILL.md
    name: aria-escalation-identity-enforcer
    description: Enforce end-user email scoping and block any escalation operation that cannot be tied to a verified user identity.
  - file: agent/aria-escalation/skills/escalation-handler/SKILL.md
    name: aria-escalation-handler
    description: Check the SharePoint Escalation Requests list for an existing escalation and create a new one if none exists, always linked to a ServiceNow incident.
