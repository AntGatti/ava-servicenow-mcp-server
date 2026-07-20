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
- shortlist: optional list
- user_selected_item: optional string
- creation_mode: optional string, one of initial_request | follow_up_task
- association_choice: optional string, one of same_req | different_req | new_req
- target_request_number: optional string
- target_request_owner_verified: optional boolean

## Output Contract
- decision: safe_to_create | needs_clarification | selection_required | do_not_create
- missing_fields: list
- user_visible: false

## Rules
1. Confirm the target item is orderable.
2. Check required details such as requester, quantity, model, or location when needed.
3. Prefer the approved ordering path over manual record insertion.
4. Never approve creation when mandatory details are missing.
5. If shortlist exists and user_selected_item is missing, return decision=selection_required.
6. Do not proceed to creation until user_selected_item is explicit.
7. If creation_mode=follow_up_task and association_choice is missing, return decision=needs_clarification.
8. For association_choice=different_req, require target_request_number and target_request_owner_verified=true before safe_to_create.
9. Never assume same request association when user choice is missing.