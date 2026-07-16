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
- normalized_email: string
- scope_status: user_scoped | blocked | missing_email
- user_visible: false

## Rules
1. Trim whitespace and lower-case the email.
2. Treat the end-user email as the required identity filter.
3. Block any request data that is not associated with the normalized email.
4. If no email is available in context, return missing_email and fail safely without asking the user to provide it.
5. Never expose the raw identity decision to the end user.