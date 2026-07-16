---
name: aria-citation-enforcer
description: Validate citations in knowledge responses and normalize SharePoint links so every reference is clickable and compliant with web=1.
---

# ARIA Citation Enforcer

## Purpose
Ensure every knowledge answer contains valid, clickable SharePoint references.

## When To Use
- After the response draft is prepared and before sending to the user.

## Input Contract
- draft_answer: required string
- retrieved_sources: required list of source URLs

## Output Contract
- validated_answer: final answer text with normalized links
- citations: normalized list of final links
- compliance: pass | fail
- issues: empty when pass, otherwise list of failures

## Rules
1. At least one citation is mandatory for every knowledge answer.
2. Every SharePoint citation must include web=1.
3. If the URL already contains query parameters, append &web=1 instead.
4. Citations must point to the exact source document used.
5. If citation checks fail, return compliance=fail with issues and require regeneration.
6. Fast path: if exactly one citation exists, it is in retrieved_sources, and already has web=1, return compliance=pass without additional normalization work.

## Link Normalization
- Input: https://contoso.sharepoint.com/sites/it/Shared%20Documents/Guide.docx
- Output: https://contoso.sharepoint.com/sites/it/Shared%20Documents/Guide.docx?web=1

- Input: https://contoso.sharepoint.com/sites/it/Shared%20Documents/Guide.docx?d=w123
- Output: https://contoso.sharepoint.com/sites/it/Shared%20Documents/Guide.docx?d=w123&web=1

## Failure Cases
- No source references in answer.
- Reference not present in retrieved_sources.
- SharePoint URL missing web=1.
- Non-clickable or malformed URL.
