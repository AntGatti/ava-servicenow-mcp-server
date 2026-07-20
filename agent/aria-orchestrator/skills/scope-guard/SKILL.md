---
name: aria-orch-scope-guard
description: Enforce orchestration-only boundaries and block unsupported tasks outside connected-agent scope.
---

# ARIA Orchestrator Scope Guard

## Purpose
Prevent unsupported actions and keep orchestrator within scope.

## When To Use
- Before final response on ambiguous or broad requests.

## Input Contract
- user_request: required string
- intent: optional string

## Output Contract
- in_scope: boolean
- guard_response: required when in_scope=false

## Rules
1. Allow only orchestration of connected knowledge, incident, and request agents.
2. Refuse unrelated tasks briefly and politely.
3. Redirect user to supported knowledge, incident, or request requests.
4. Never perform direct non-orchestration tasks.
