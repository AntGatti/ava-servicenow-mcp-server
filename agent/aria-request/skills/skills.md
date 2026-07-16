---
name: aria-request-skills-manifest
description: Manifest for ARIA Request Agent skills package. Use for skill discovery and packaging metadata.
---

manifest_version: 1
agent: aria-request
skills:
  - file: agent/aria-request/skills/intent-router/SKILL.md
    name: aria-request-intent-router
    description: Classify each request as catalog browsing, request creation, request status, approval handling, or no-match to drive request routing decisions.
  - file: agent/aria-request/skills/identity-enforcer/SKILL.md
    name: aria-request-identity-enforcer
    description: Enforce end-user email scoping and block any request lookup that is not user-owned.
  - file: agent/aria-request/skills/catalog-matcher/SKILL.md
    name: aria-request-catalog-matcher
    description: Find the best user-facing catalog item by meaning and filter out technical or admin-only entries.
  - file: agent/aria-request/skills/order-validator/SKILL.md
    name: aria-request-order-validator
    description: Verify required request details and confirm the approved ordering path before creation.
  - file: agent/aria-request/skills/workflow-explainer/SKILL.md
    name: aria-request-workflow-explainer
    description: Extract the next two workflow steps and provide rough timing in plain language when workflow status is requested.
  - file: agent/aria-request/skills/status-summarizer/SKILL.md
    name: aria-request-status-summarizer
    description: Convert request and task status into plain-language summaries without exposing technical values.
  - file: agent/aria-request/skills/response-redactor/SKILL.md
    name: aria-request-response-redactor
    description: Remove raw technical values from user-facing responses and replace them with safe plain-language text.
  - file: agent/aria-request/skills/hyperlink-builder/SKILL.md
    name: aria-request-hyperlink-builder
    description: Build clickable hyperlinks for requests, tasks, sub-tasks, and catalog items when a safe link exists.
  - file: agent/aria-request/skills/no-match-refusal/SKILL.md
    name: aria-request-no-match-refusal
    description: Produce the polite no-match response when the request is not user-scoped or no valid match exists.