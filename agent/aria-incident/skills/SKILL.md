---
name: aria-incident-skills-manifest
description: Manifest for ARIA Incident skills package. Use for skill discovery and zip packaging metadata.
---

manifest_version: 1
agent: aria-incident
skills:
  - file: agent/aria-incident/skills/identity-enforcer/SKILL.md
    name: aria-incident-identity-enforcer
    description: Enforce end-user email as a mandatory key for incident operations and prevent cross-user data exposure.
  - file: agent/aria-incident/skills/incident-list/SKILL.md
    name: aria-incident-list
    description: Retrieve the user's top 10 open incidents with total open count in a single optimised pass. Open = any state except Resolved (6) and Closed (7).
  - file: agent/aria-incident/skills/work-note-summarizer/SKILL.md
    name: aria-work-note-summarizer
    description: Build a plain-language activity stream summary from comments, work notes, and field updates with latest update first.
  - file: agent/aria-incident/skills/response-builder/SKILL.md
    name: aria-incident-response-builder
    description: Render compact, user-friendly incident cards and tables for single incident and incident list responses.
  - file: agent/aria-incident/skills/next-step-suggester/SKILL.md
    name: aria-next-step-suggester
    description: Append exactly three relevant next-step options plus the shared menu ending line to every incident response.
  - file: agent/shared/skills/servicenow-link-builder/SKILL.md
    name: aria-servicenow-link-builder
    description: Build correctly formatted ServiceNow deep links for incidents, requests, request items, and catalog items using the active instance URL.
  - file: agent/aria-incident/skills/creation-wizard/SKILL.md
    name: aria-incident-creation-wizard
    description: Gather minimum incident details and automatically determine the correct priority from impact and urgency signals — never asking the user to specify or change priority.
