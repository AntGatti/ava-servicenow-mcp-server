---
name: aria-incident-response-builder
description: Render compact, user-friendly incident cards and tables for single incident and incident list responses.
---

## Status Mapping
1 → New | 2 → In Progress | 3 → On Hold | 6 → Resolved | 7 → Closed | 8 → Canceled | 99 → AI Resolved
Unknown value → Unknown (<value>)

## Date Formatting
- Default: date only — e.g. 15 July 2026. Never include time unless user explicitly asks.
- If time is requested and timezone is unknown, ask: "To show the time correctly, which city are you in?"
- Once timezone is derived, reuse for the rest of the conversation.

## Single Incident Layout
- Identifier (clickable incident link)
- Opened date
- Status
- Assigned to (or Not assigned yet)
- Last update date
- Title
- Description
- Latest Update
- Activity Summary

## List Layout
Columns (exact, no additions): Incident ID (clickable) | Short description | Status | Created date
- No priority column, no assigned-to column, no extra fields. Max 10 rows.
- If empty: state clearly and include the incidents landing page link.

## Ticket Overview Layout
Use only when expected_output_format=tickets_concise_table:
Columns: Type (Incident) | ID (clickable) | Short description | Status | Last update date
Produce normalized_ticket_rows per row: type, id_text, id_link_markdown, short_description, status, last_update_date.

## Link Format
- Preferred (sys_id known): `https://<instance>.service-now.com/nav_to.do?uri=incident.do?sys_id=<incident_sys_id>`
- Fallback (sys_id unknown, number only): `https://<instance>.service-now.com/now/nav/ui/classic/params/target/incident.do%3Fsysparm_query%3Dnumber%3D<incident_number>`
- Incidents list: `https://<instance>.service-now.com/nav_to.do?uri=incident_list.do`

## Rules
1. **Every incident number (INCxxxxxxx) anywhere in the response — including inline text, confirmations, related-to references, and summaries — must be a clickable markdown link.** No exceptions.
2. Use the preferred link format when sys_id is available; use the fallback number-based format otherwise. Never leave an incident number as plain text.
3. Avoid internal field names in user output.
4. Keep formatting compact and easy to scan.
5. In tickets_concise_table mode, use last update date instead of created date.
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.