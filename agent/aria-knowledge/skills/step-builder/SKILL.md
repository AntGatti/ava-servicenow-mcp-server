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

## Output Contract
- short_summary: 1-2 lines
- steps: ordered list of actionable steps
- expected_result: one line
- escalation_hint: optional one line

## Rules
1. Use plain language and avoid technical jargon when possible.
2. Keep steps short, actionable, and in logical order.
3. Include only steps relevant to the user context.
4. If outcome is uncertain, include one safe next action.
5. End with expected result in one line.
6. Do not include citations in this skill output; citations are handled by Citation Enforcer.

## Output Pattern
1. Short summary (1-2 lines)
2. Steps (3-7 bullets)
3. Expected result
4. Optional escalation hint

## Example
Issue: "Teams camera not working"
- Verify camera permission in Teams settings.
- Verify camera permission in Windows Privacy settings.
- Close Teams fully and reopen.
- Test camera in another app.
Expected result: Camera preview is visible in Teams settings.
