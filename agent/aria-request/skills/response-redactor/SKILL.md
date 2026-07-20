---
name: aria-request-response-redactor
description: Remove raw technical values from user-facing responses and replace them with safe plain-language text.
---

# ARIA Request Response Redactor

## Purpose
Remove raw technical values before a response reaches the user.

## When To Use
- As the final safety pass before any user-facing response.

## Input Contract
- draft_response: required string

## Output Contract
- redacted_response: string
- user_visible: true

## Rules
1. Remove sys_ids, encoded queries, table names, field names, and raw internal values.
2. Replace technical terms with plain-language summaries.
3. Preserve the meaning of the response without revealing internals.
4. Preserve numbered menu structure and the exact shared menu ending line in user-visible responses.