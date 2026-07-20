---
name: aria-next-step-suggester
description: Append exactly three relevant next-step options plus the shared menu ending line to every incident response.
---

# ARIA Next Step Suggester

## Purpose
Provide actionable follow-up options at the end of each incident response.

## When To Use
- At the end of every user-facing incident response.

## Input Contract
- conversation_state: required object
- last_action: required string
- incident_status: optional string

## Output Contract
- suggested_options: required list of exactly 3 options
- free_text_prompt: required string

## Rules
1. Return exactly 3 next-step options.
2. Options must be relevant to the current conversation and last action.
3. Keep option wording short and user-friendly.
4. Always append the exact shared menu ending line.
5. Do not include technical/internal commands.

## Free-Text Line (Mandatory)
"Reply with 1, 2, or 3, or type your own reply."
