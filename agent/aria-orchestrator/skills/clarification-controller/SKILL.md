---
name: aria-orch-clarification-controller
description: Ask minimal clarification questions only when routing ambiguity remains after knowledge-first evaluation.
---

# ARIA Orchestrator Clarification Controller

## Purpose
Minimize clarification while preserving routing accuracy.

## When To Use
- After intent routing confidence is low or mixed with unresolved ambiguity.

## Input Contract
- routing_confidence: required value
- ambiguity_reason: optional string
- prior_clarification_count: required number

## Output Contract
- should_ask: boolean
- clarification_question: required when should_ask=true

## Rules
1. Ask one focused clarification question first.
2. Ask a second clarification only if still ambiguous.
3. Keep question short and directly tied to routing.
4. If enough context exists, do not ask and proceed with delegation.
5. For ambiguous ticket requests, prefer: "Do you want incidents, requests, or both?"
