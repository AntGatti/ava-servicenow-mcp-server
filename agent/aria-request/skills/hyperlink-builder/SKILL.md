---
name: aria-request-hyperlink-builder
description: Build clickable hyperlinks for requests, tasks, sub-tasks, and catalog items when a safe link exists.
---

# ARIA Request Hyperlink Builder

## Purpose
Create safe clickable links for request-related references.

## When To Use
- When a request, task, sub-task, or catalog item is mentioned.

## Input Contract
- reference_text: required string
- reference_type: request | task | sub_task | catalog_item
- safe_link_target: optional string
- instance_url: optional string
- record_sys_id: optional string

## Output Contract
- linked_text: string
- user_visible: true
- id_link_markdown: optional string for normalized ticket overview rows

## Rules
1. Use clickable hyperlinks for request and catalog references when a safe target exists.
2. Do not expose unsafe technical identifiers in link text.
3. If a safe link cannot be formed, keep the reference in plain language.
4. When used for tickets_concise_table output, return id_link_markdown so orchestrator merge can render ID as clickable text.
5. For request references, prefer nav_to.do format with sys_id:
	- https://<instance>.service-now.com/nav_to.do?uri=sc_request.do?sys_id=<request_sys_id>
6. For request item references (task or sub-task), prefer:
	- https://<instance>.service-now.com/nav_to.do?uri=sc_req_item.do?sys_id=<ritm_sys_id>
7. If safe_link_target is missing for a request or request item but instance_url and record_sys_id are available, construct the link directly.
8. For request and request item references, do not emit non-clickable ID text when link inputs are available.