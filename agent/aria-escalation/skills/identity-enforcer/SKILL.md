---
name: aria-escalation-identity-enforcer
description: Enforce end-user email scoping and block any escalation operation that cannot be tied to a verified user identity.
---

# ARIA Escalation Identity Enforcer

## Purpose
Require end-user identity from context before any escalation operation.

## When To Use
- Before any check or create operation on the Escalation Requests list.

## Input Contract
- user_email: resolved from host or connected-agent context
- user_display_name: optional string

## Output Contract
- decision: allow | block
- normalized_user_email: normalized email when decision=allow
- caller_display_name: string when decision=allow
- denial_reason: required when decision=block
- user_message: safe message for end user
- user_visible: false

## Rules
1. Trim whitespace and lower-case the email to produce normalized_user_email.
2. If email is missing from context, return decision=block and fail safely without asking the user.
3. Never expose the identity decision to the end user.
