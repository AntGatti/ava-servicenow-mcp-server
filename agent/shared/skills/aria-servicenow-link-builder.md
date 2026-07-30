---
name: aria-servicenow-link-builder
description: Build correctly formatted ServiceNow deep links for incidents, requests, request items, and catalog items using the active instance URL.
---

# ARIA ServiceNow Link Builder

## Purpose
Produce consistently formatted, clickable ServiceNow deep links for all record types used across ARIA agents.

## When To Use
- Before rendering any ServiceNow record reference in a user-facing response.
- When building clickable ticket IDs, request numbers, or catalog item links.

## Input Contract
- record_type: required string — one of: incident | request | request_item | catalog_item | incident_list | request_list
- sys_id: required string (omit for list types)
- display_text: optional string — defaults to record number or type label
- instance_url: required string — active ServiceNow instance base URL (e.g., https://dev123.service-now.com)

## Output Contract
- link_markdown: required string — markdown formatted clickable link
- id_link_markdown: optional string — same value as link_markdown, populated for incident and request record types to satisfy the orchestrator ticket_overview_merge row schema
- url: required string — full resolved URL

## URL Patterns

| record_type | URI |
| --- | --- |
| incident | `now/nav/ui/classic/params/target/incident.do%3Fsys_id%3D<sys_id>` |
| request | `now/nav/ui/classic/params/target/sc_request.do%3Fsys_id%3D<sys_id>` |
| request_item | `now/nav/ui/classic/params/target/sc_req_item.do%3Fsys_id%3D<sys_id>` |
| catalog_item | `now/nav/ui/classic/params/target/cat_item.do%3Fsys_id%3D<sys_id>` |
| incident_list | `now/nav/ui/classic/params/target/incident_list.do` |
| request_list | `now/nav/ui/classic/params/target/sc_request_list.do` |

Full URL format: `<instance_url>/<uri>`

## Rules
1. Always derive instance_url from the active ServiceNow environment context — never hardcode.
2. Render all record links as markdown: `[<display_text>](<full_url>)`.
3. For list types (incident_list, request_list), omit sys_id from the URL.
4. If sys_id is missing for a non-list type, return plain text instead of a broken link.
5. Never expose raw sys_id values as the visible link text.
6. Use the record number (e.g., INC0012345, REQ0001234) as display_text when available.
7. Never fabricate a sys_id — if it has not been retrieved from MCP, resolve it first.
8. When record_type is incident or request, also populate id_link_markdown with the same value as link_markdown.
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.