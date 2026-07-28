---
name: aria-knowledge-skills-manifest
description: Manifest for ARIA Knowledge skills package. Use for skill discovery and zip packaging metadata.
---

manifest_version: 1
agent: aria-knowledge
skills:
  - file: agent/aria-knowledge/skills/intent-router/SKILL.md
    name: aria-intent-router
    description: Classify the user request into one support domain, set confidence, and choose the next action for knowledge or incident routing.
  - file: agent/aria-knowledge/skills/step-builder/SKILL.md
    name: aria-step-builder
    description: Convert grounded troubleshooting content into compact, user-friendly step-by-step guidance with clear outcomes.
  - file: agent/aria-knowledge/skills/citation-enforcer/SKILL.md
    name: aria-citation-enforcer
    description: Validate citations in knowledge responses and normalize SharePoint links so every reference is clickable and compliant with web=1.
  - file: agent/aria-knowledge/skills/snow-knowledge-check/SKILL.md
    name: aria-snow-knowledge-check
    description: Execute explicit ServiceNow knowledge checks using MCP SN-Natural-Language-Search only, then return concise step-by-step guidance with article source links.
