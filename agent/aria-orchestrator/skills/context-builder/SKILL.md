---
name: aria-orch-context-builder
description: Build compact, complete delegation payloads with user details and request context for connected agents.
---

# ARIA Orchestrator Context Builder

## Purpose
Prepare clean handoff context for downstream agents.

## When To Use
- Immediately before each delegation call.

## Input Contract
- user_display_name: optional string
- user_email: optional string
- intent: required string
- incident_number: optional string
- expected_output_format: optional string
- conversation_summary: optional string

## Output Contract
- context_payload: required object

## Rules
1. Include user display name and user email when available.
2. Include incident number and desired output format when relevant.
3. Keep payload compact and omit irrelevant fields.
4. Never inject unsupported assumptions.
