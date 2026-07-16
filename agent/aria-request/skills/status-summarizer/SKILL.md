---
name: aria-request-status-summarizer
description: Convert request and task status into plain-language summaries without exposing technical values.
---

# ARIA Request Status Summarizer

## Purpose
Translate request and task state into user-friendly status text.

## When To Use
- When the user asks for a request status or update.

## Input Contract
- request_state: required object
- activity_updates: optional list

## Output Contract
- summary: string
- status_label: string
- user_visible: true

## Rules
1. Convert request and task states into plain language.
2. Do not expose raw state codes or internal workflow labels.
3. Keep the summary short and practical.