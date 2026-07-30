---
name: aria-request-catalog-matcher
description: Find the best user-facing catalog item by meaning and filter out technical or admin-only entries.
---

# ARIA Request Catalog Matcher

## Purpose
Match the user need to the best catalog item.

## When To Use
- When the user wants to browse the catalog or identify the right item.

## Input Contract
- user_intent: required string
- catalog_results: required list

## Output Contract
- best_match: catalog item or none
- alternates: list
- shortlist: ordered list of up to 5 user-facing candidate items
- match_confidence: high | medium | low
- requires_user_selection: boolean
- no_catalog_item_available: boolean
- user_visible: false

## Rules
1. Prefer user-facing items over technical or admin-only entries.
2. Match by meaning, not only by title.
3. If there are close matches, return alternates and require clarification.
4. Never recommend an item unless it is confirmed as orderable.
5. Always produce a concise shortlist before request creation flows.
6. Set requires_user_selection=true when at least one shortlist item exists.
7. Set no_catalog_item_available=true when no viable user-facing item is found.
8. Do not allow implicit auto-selection for generic asks (for example: laptop, software, access).
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.