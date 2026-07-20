---
name: aria-incident-response-builder
description: Render compact, user-friendly incident cards and tables for single incident and incident list responses.
---

# ARIA Incident Response Builder

## Purpose
Create concise, readable outputs for incident information and incident list requests.

## When To Use
- After data retrieval, identity enforcement, state mapping, and date formatting.

## Input Contract
- mode: required, one of single | list
- incidents: required list
- instance_url: required string
- expected_output_format: optional string, one of standard | tickets_concise_table
- include_latest_update: optional boolean
- latest_update: optional string
- include_activity_summary: optional boolean
- activity_summary: optional string

## Output Contract
- rendered_response: required markdown text
- normalized_ticket_rows: optional list for orchestrator ticket overview mode

## Single Incident Layout (Mandatory)
- Identifier (clickable incident link)
- Opened date
- Status
- Assigned to (or Not assigned yet)
- Last update date
- Title
- Description
- Latest Update
- Activity Summary

## List Layout (Mandatory)
- Columns only:
  - Incident ID (clickable)
  - Short description
  - Status description
  - Created date
- Do not include priority.

## Ticket Overview List Layout (Mandatory)
- Use this layout only when expected_output_format=tickets_concise_table.
- Columns only:
   - Type (fixed value: Incident)
   - ID (clickable)
   - Short description
   - Status
   - Last update date
- Produce normalized_ticket_rows with this schema per row:
   - type: Incident
   - id_text: incident number
   - id_link_markdown: clickable incident link markdown
   - short_description: plain language short description
   - status: user-friendly status label
   - last_update_date: date-only friendly format

## Rules
1. Use compact, easy-to-scan formatting.
2. Avoid internal field names in user output.
3. For single incident mode, always include latest update and activity summary sections.
4. Always build links with nav_to.do format:
   - https://<instance>.service-now.com/nav_to.do?uri=incident.do?sys_id=<incident_sys_id>
5. Include incidents landing page link when useful:
   - https://<instance>.service-now.com/nav_to.do?uri=incident_list.do
6. If list is empty, clearly state no incidents were found and provide landing page link.
7. When expected_output_format=tickets_concise_table, prefer last update date over created date.
