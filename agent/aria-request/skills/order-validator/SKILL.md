---
name: aria-request-order-validator
description: Verify required request details and confirm the approved ordering path before creation.
---

# ARIA Request Order Validator

## Purpose
Validate that a request is safe to create.

## When To Use
- Before creating a request.

## Input Contract
- catalog_item: required string
- request_details: required object
- identity_scope: required object

## Output Contract
- decision: safe_to_create | needs_clarification | do_not_create
- missing_fields: list
- user_visible: false

## Rules
1. Confirm the target item is orderable.
2. Check required details such as requester, quantity, model, or location when needed.
3. Prefer the approved ordering path over manual record insertion.
4. Never approve creation when mandatory details are missing.