---
name: aria-request-skill-package
description: Use for safe catalog browsing, request lookup, request creation, approval handling, hyperlink generation, and redacted user responses. Do not use for incidents or non-request tasks.
---

# ARIA Request Skill Package

Use this skill package when the user request needs request-oriented ServiceNow support.

## Included Capability Modules

The package includes request modules under `skills/`:

- `aria-request-intent-router`
- `aria-request-identity-enforcer`
- `aria-request-catalog-matcher`
- `aria-request-order-validator`
- `aria-request-workflow-explainer`
- `aria-request-status-summarizer`
- `aria-request-response-redactor`
- `aria-request-hyperlink-builder`
- `aria-request-no-match-refusal`

Manifest file: `skills/skills.md`

## Operational Notes

- This package is request-only.
- It should support catalog browsing, request lookup, request creation, and approval handling with user-scoped identity enforcement.
- It must not perform incident, problem, or change operations.