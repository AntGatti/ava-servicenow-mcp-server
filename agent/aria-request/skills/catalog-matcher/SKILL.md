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
- match_confidence: high | medium | low
- user_visible: false

## Rules
1. Prefer user-facing items over technical or admin-only entries.
2. Match by meaning, not only by title.
3. If there are close matches, return alternates and require clarification.
4. Never recommend an item unless it is confirmed as orderable.