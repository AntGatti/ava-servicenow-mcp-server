---
name: aria-incident-identity-enforcer
description: Enforce end-user email as a mandatory key for incident operations and prevent cross-user data exposure.
---

# ARIA Incident Identity Enforcer

## Purpose
Require end-user identity from context before any incident action and enforce strict per-user data isolation.

## When To Use
- Before list/get/create/update/assign/comment/resolve/close operations.
- Before rendering any incident details to the user.

## Input Contract
- intent: required string
- user_email: resolved from host or connected-agent context
- requested_action: required string
- query_or_payload: optional object

## Output Contract
- decision: allow | block
- normalized_user_email: normalized email when allow
- filtered_query_or_payload: payload/query with mandatory user email filter
- denial_reason: required when block
- user_message: safe message for end user

## Rules
1. End-user email is mandatory for every incident operation.
2. If email is missing from context, return decision=block and fail safely before any MCP call.
3. Retrieval must always include user email filter.
4. Creation must always set caller/requester using user email.
5. Never return, modify, or summarize incidents that do not match user email.
6. Never bypass filtering unless explicit authorized admin context is provided by orchestrator policy.
7. On mismatch detection, block output and return a safe refusal.

## Block Message Template
"I couldn't verify the user identity for this request, so I can't continue safely right now."
