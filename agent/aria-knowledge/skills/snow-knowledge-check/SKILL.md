---
name: aria-snow-knowledge-check
description: Execute explicit ServiceNow knowledge checks using MCP SN-Natural-Language-Search only, then return concise step-by-step guidance with article source links.
---

# ARIA SNOW Knowledge Check

## Purpose
Handle explicit SNOW or ServiceNow knowledge-check requests using ServiceNow MCP retrieval.

## When To Use
- Only when the user explicitly asks for SNOW knowledge check or ServiceNow knowledge check.

## Do Not Use
- Generic knowledge questions that do not explicitly request SNOW or ServiceNow knowledge check.

## Required Retrieval Method
- MCP method allowed: SN-Natural-Language-Search only.
- Do not use SN-Query-Table or other MCP retrieval methods in this skill.

## Input Contract
- user_message: required string
- normalized_query: optional string

## Output Contract
- short_summary: 1-2 lines
- steps: ordered list of practical steps
- sources: list of clickable knowledge article links

## Rules
1. Build a natural-language retrieval prompt from the user request.
2. Execute SN-Natural-Language-Search against ServiceNow knowledge content.
3. Return concise, practical, step-by-step guidance.
4. Include source links to the knowledge article(s) used.
5. If no reliable article is found, say so clearly and ask one focused follow-up.
6. Do not expose raw technical values.

## Retrieval Example
Natural-language query example:
- published knowledge articles about vpn

## Response Pattern
1. Short summary (1-2 lines)
2. Step-by-step guidance
3. Source links (knowledge article URLs)
