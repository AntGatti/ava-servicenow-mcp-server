---
name: aria-step-builder
description: Convert grounded troubleshooting content into compact, user-friendly step-by-step guidance with clear outcomes.
---

# ARIA Step Builder

## Purpose
Generate concise and practical step-by-step instructions from validated knowledge content.

## When To Use
- After intent is identified and grounded knowledge snippets are selected.

## Input Contract
- user_issue: required string
- grounded_content: required text excerpts
- constraints: optional object (device, app, platform)
- retrieval_confidence: optional string (high | medium | low)
- source_count: optional number

## Output Contract
- short_summary: 1-2 lines
- steps: ordered list of actionable steps
- expected_result: one line
- escalation_hint: optional one line
- menu_options: required list of exactly 3 numbered next actions
- free_text_prompt: required string

## Rules
1. Use plain language and avoid technical jargon when possible.
2. Keep steps short, actionable, and in logical order.
3. Include only steps relevant to the user context.
4. Fast-answer short circuit: if retrieval_confidence is high and source_count is 1, generate the minimum complete answer from that source and skip additional synthesis overhead.
5. If outcome is uncertain, include one safe next action.
6. End with expected result in one line.
7. Do not include citations in this skill output; citations are handled by Citation Enforcer.
8. Include menu_options with exactly 3 concise choices relevant to the current answer.
9. Set free_text_prompt to exactly: "Reply with 1, 2, or 3, or type your own reply."

## Output Pattern
1. Short summary (1-2 lines)
2. Steps (3-7 bullets)
3. Expected result
4. Optional escalation hint
5. Numbered next-action menu (exactly 3 options)
6. Shared menu ending line: "Reply with 1, 2, or 3, or type your own reply."

## Performance Notes
- Prefer 3-5 steps in normal mode.
- In fast-answer short-circuit mode, keep to 2-4 steps when possible without losing required clarity.

## Example
Issue: "Teams camera not working"
- Verify camera permission in Teams settings.
- Verify camera permission in Windows Privacy settings.
- Close Teams fully and reopen.
- Test camera in another app.
Expected result: Camera preview is visible in Teams settings.
