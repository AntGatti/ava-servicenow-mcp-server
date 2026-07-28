---
name: aria-escalation-identity-enforcer
description: Enforce end-user email scoping and block any escalation operation that cannot be tied to a verified user identity.
---

# ARIA Escalation Identity Enforcer

## Purpose
Require end-user identity from context before any escalation operation.

## When To Use
- Before any check or create operation on the Escalation Requests list.

## Identity Resolution (Mandatory)
Resolve user identity from these sources in order — stop at the first match:
1. `System.User.Email` — Copilot Studio authenticated user email (primary source)
2. Connected-agent context payload — when called via orchestrator
3. Conversation context — if email was established earlier in the session

Resolve display name from:
1. `System.User.DisplayName` — Copilot Studio authenticated user display name
2. Connected-agent context payload

Never ask the user for their email or name. Never prompt for identity information.

## Input Contract
- user_email: resolved from System.User.Email or connected-agent context — never from user input
- user_display_name: resolved from System.User.DisplayName or connected-agent context

## Output Contract
- decision: allow | block
- normalized_user_email: normalized email when decision=allow
- caller_display_name: string when decision=allow
- denial_reason: required when decision=block
- user_message: safe message for end user
- user_visible: false

## Rules
1. Trim whitespace and lower-case the email to produce normalized_user_email.
2. If email is missing from all sources, return decision=block and fail safely — do not ask the user.
3. Never expose the identity decision to the end user.
4. Never request or accept email or name from user input.
