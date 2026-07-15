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
- include_work_note_summary: optional boolean
- work_note_summary: optional string

## Output Contract
- rendered_response: required markdown text

## Single Incident Layout (Mandatory)
- Identifier (clickable incident link)
- Opened date
- Status
- Assigned to (or Not assigned yet)
- Last update date
- Title
- Description
- Work Note Summary

## List Layout (Mandatory)
- Columns only:
  - Incident ID (clickable)
  - Short description
  - Status description
  - Created date
- Do not include priority.

## Rules
1. Use compact, easy-to-scan formatting.
2. Avoid internal field names in user output.
3. Always build links with nav_to.do format:
   - https://<instance>.service-now.com/nav_to.do?uri=incident.do?sys_id=<incident_sys_id>
4. Include incidents landing page link when useful:
   - https://<instance>.service-now.com/nav_to.do?uri=incident_list.do
5. If list is empty, clearly state no incidents were found and provide landing page link.
