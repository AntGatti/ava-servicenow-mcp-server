---
name: aria-shared-skills-manifest
description: Manifest for ARIA shared skills package. Deploy to any ARIA agent that needs cross-agent capabilities.
---

manifest_version: 1
agent: aria-shared
skills:
  - file: agent/shared/skills/servicenow-link-builder/SKILL.md
    name: aria-servicenow-link-builder
    description: Build correctly formatted ServiceNow deep links for incidents, requests, request items, and catalog items using the active instance URL.
