---
name: aria-orch-capability-gate
description: Enforce connected-agent-only capability disclosure and block claims outside orchestrator scope.
---

# ARIA Orchestrator Capability Gate

## Purpose
Ensure capability responses mention only connected-agent functionality.

## When To Use
- When users ask what ARIA can do.
- Before returning scope-related responses.

## Input Contract
- user_request: required string
- connected_agents: required list

## Output Contract
- decision: allow | restrict
- allowed_capabilities: list
- response_guidance: short text

## Rules
1. Mention only knowledge, incident, and request capabilities.
2. Do not claim coding, file ops, analytics, or unrelated automation.
3. For out-of-scope requests, provide brief redirect to supported use cases.
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.