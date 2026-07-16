---
name: aria-orch-fallback-handler
description: Generate safe, friendly fallback responses when a connected agent is unavailable or delegation fails.
---

# ARIA Orchestrator Fallback Handler

## Purpose
Provide non-fabricated fallback messaging for delegation failures.

## When To Use
- When connected agent call fails, times out, or is unavailable.

## Input Contract
- failed_agent: required value
- failure_type: optional string

## Output Contract
- fallback_message: required string
- retry_guidance: required string

## Rules
1. Do not fabricate answers when delegation fails.
2. Use concise, friendly, user-safe language.
3. Ask user to retry.
4. Do not expose internal errors unless explicitly requested.
