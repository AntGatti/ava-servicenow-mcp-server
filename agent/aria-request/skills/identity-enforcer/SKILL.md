---
name: aria-request-identity-enforcer
description: Enforce end-user email scoping and block any request lookup that is not user-owned.
---

# ARIA Request Identity Enforcer

## Purpose
Enforce end-user email scoping for all request lookups and responses using identity resolved from context.

## When To Use
- Before any request lookup or request detail response.
- Before any request creation action.

## Input Contract
- user_email: resolved from host or connected-agent context
- user_request: required string

## Output Contract
- decision: allow | block
- normalized_user_email: normalized email when decision=allow
- denial_reason: required when decision=block
- user_message: safe message for end user
- user_visible: false

## Rules
1. Trim whitespace and lower-case the email to produce normalized_user_email.
2. Treat normalized_user_email as the required identity filter for all downstream operations.
3. Block any request data that is not associated with normalized_user_email.
4. If no email is available in context, return decision=block and fail safely without asking the user to provide it.
5. Never expose the raw identity decision or normalized_user_email to the end user.