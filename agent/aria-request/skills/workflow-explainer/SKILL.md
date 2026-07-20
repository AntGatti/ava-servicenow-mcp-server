---
name: aria-request-workflow-explainer
description: Extract the next two workflow steps and provide rough timing in plain language when workflow status is requested.
---

# ARIA Request Workflow Explainer

## Purpose
Explain request workflow progress and near-term timing.

## When To Use
- When the user asks for next steps, expected timing, or workflow progression.

## Input Contract
- workflow_state: required object
- current_request_context: required object

## Output Contract
- next_step: string
- step_after_next: string
- timing_hint: short string
- user_visible: true
- menu_options: required list of exactly 3 numbered next actions
- free_text_prompt: required string

## Rules
1. Extract the next two workflow steps only.
2. Provide rough timing in plain language when timing is available.
3. If timing is not available, say that it is uncertain.
4. Never invent workflow timing.
5. Include menu_options with exactly 3 concise follow-up choices.
6. Set free_text_prompt to exactly: "Reply with 1, 2, or 3, or type your own reply."