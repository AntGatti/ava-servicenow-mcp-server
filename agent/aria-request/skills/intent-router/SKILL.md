---
name: aria-request-intent-router
description: Classify each request as catalog browsing, request creation, request status, approval handling, or no-match to drive request routing decisions.
---

# ARIA Request Intent Router

## Purpose
Classify the user request for request-agent routing.

## When To Use
- At the start of every user turn.

## Input Contract
- user_message: required string
- conversation_context: optional string

## Output Contract
- intent: catalog_browsing | request_creation | request_status | approval_handling | no_match
- confidence: high | medium | low
- rationale: short sentence
- next_action: delegate_catalog | delegate_request | delegate_status | delegate_approval | require_catalog_selection | refuse_or_redirect | ask_clarification
- user_visible: false

## Rules
1. Return one primary intent.
2. Use request_status when the user asks for progress, updates, or timing.
3. Use approval_handling when the user wants to approve or understand approvals.
4. Use no_match when the request is outside request-agent scope or no valid user-owned match exists.
5. Keep rationale concise and user-safe.
6. This output is internal and must not be returned directly to end users.
7. For generic request creation asks (for example laptop, software, access, device), set next_action=require_catalog_selection.
8. In require_catalog_selection flows, catalog shortlist and explicit user selection are mandatory before create.