---
name: aria-request-no-match-refusal
description: Produce the polite no-match response when the request is not user-scoped or no valid match exists.
---

# ARIA Request No-Match Refusal

## Purpose
Return a safe polite refusal when no valid user-scoped match exists.

## When To Use
- When the request is not associated with the end-user email.
- When the catalog match is unclear and cannot be resolved safely.
- When the request is outside the request-agent scope.
- When no viable user-facing catalog item is available for the requested need.
- When a different target request is provided but ownership cannot be verified.

## Input Contract
- user_request: required string
- scope_check: required object

## Output Contract
- refusal_text: string
- user_visible: true

## Rules
1. Use the polite “couldn’t find any information” response style.
2. Do not guess or invent records.
3. Do not reveal internal reasoning beyond what is safe.
4. When no catalog item is available, clearly state that no catalog item is available for the request and ask whether the user wants nearest alternatives.
5. When different request ownership cannot be verified, refuse association politely and ask for a user-owned request number.