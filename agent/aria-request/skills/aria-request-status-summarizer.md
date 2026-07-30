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
- mode: optional, one of single | list
- request_records: optional list
- expected_output_format: optional string, one of standard | tickets_concise_table
- instance_url: optional string

## Output Contract
- summary: string
- status_label: string
- user_visible: true
- normalized_ticket_rows: optional list for orchestrator ticket overview mode
- menu_options: required list of exactly 3 numbered next actions
- free_text_prompt: required string

## Rules
1. Convert request and task states into plain language.
2. Do not expose raw state codes or internal workflow labels.
3. Keep the summary short and practical.
4. When expected_output_format=tickets_concise_table and mode=list, produce normalized_ticket_rows with this schema per row:
	- type: Request
	- id_text: request number
	- id_link_markdown: clickable request link markdown
	- short_description: plain language short description
	- status: user-friendly status label
	- last_update_date: date-only friendly format
5. In tickets_concise_table mode, prefer last update date over created date.
6. Include menu_options with exactly 3 concise, context-aware next actions.
7. Set free_text_prompt to exactly: "Reply with 1, 2, or 3, or type your own reply."
8. For every request row in normalized_ticket_rows, id_link_markdown must be a clickable ServiceNow request link.
9. Build request links using nav_to.do format:
	- https://<instance>.service-now.com/nav_to.do?uri=sc_request.do?sys_id=<request_sys_id>
10. If a request row is missing sys_id or instance context, re-resolve those values before rendering.
11. Do not return unlinked request IDs in tickets_concise_table mode.
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.