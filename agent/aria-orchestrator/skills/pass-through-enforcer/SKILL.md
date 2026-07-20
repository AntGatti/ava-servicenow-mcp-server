---
name: aria-orch-pass-through-enforcer
description: Enforce exact pass-through output for delegated responses without rewrite, summarization, or formatting changes.
---

# ARIA Orchestrator Pass-Through Enforcer

## Purpose
Guarantee delegated response integrity.

## When To Use
- After a connected agent returns a response.

## Input Contract
- delegated_response: required string
- source_agent: required value
- delegation_sequence: optional ordered list of knowledge_agent | incident_agent | request_agent
- intent: optional value

## Output Contract
- final_response: required string
- compliance: pass | fail

## Rules
1. Return delegated response exactly as received.
2. Do not rewrite, summarize, translate, reformat, or append content.
3. Apply to knowledge, incident, and request agent responses.
4. If pass-through cannot be honored, return compliance=fail and trigger fallback handler.
5. When multiple agents are invoked, delegated_response must be the last agent response in the sequence.
6. Exception: when intent=ticket_overview, allow orchestrator to merge incident and request list outputs into one concise table and append one focused follow-up question for detail selection.
