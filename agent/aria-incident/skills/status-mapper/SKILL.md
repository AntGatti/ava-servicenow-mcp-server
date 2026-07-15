---
name: aria-incident-status-mapper
description: Convert raw incident state values into user-friendly status labels with a safe unknown fallback.
---

# ARIA Incident Status Mapper

## Purpose
Map raw ServiceNow incident state values to user-friendly status text.

## When To Use
- Any time incident records include a raw state value.
- Before building user-facing responses.

## Input Contract
- state_value: required number or string

## Output Contract
- status_description: required string

## Mapping Table
- 1 -> New
- 2 -> In Progress
- 3 -> On Hold
- 6 -> Resolved
- 7 -> Closed
- 8 -> Canceled
- 99 -> AI Resolved

## Rules
1. Apply exact mapping above.
2. If value is unknown, return: Unknown (<value>).
3. Do not expose raw value alone in user output.
