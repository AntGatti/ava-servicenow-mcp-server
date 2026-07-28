---
name: aria-escalation-handler
description: Create a new escalation request in the SharePoint Escalation Requests list, always linked to a ServiceNow incident. Handles duplicate detection via error response rather than a pre-check query.
---

# ARIA Escalation Handler

## Purpose
Create escalation requests with the correct metadata in the SharePoint Escalation Requests list. Skip the pre-check query — attempt creation directly and handle duplicate errors gracefully.

## When To Use
- After identity enforcement and incident prerequisite check.

## SharePoint Target
- Site: avashowcase.sharepoint.com/sites/SampleITSupport
- List: Escalation Requests
- Tool: Work IQ SharePoint

## Input Contract
- incident_number: required string — e.g. INC0014931
- incident_link: required string — full ServiceNow URL for the incident
- normalized_user_email: required string — from identity enforcer
- caller_display_name: optional string — used as Operator
- escalation_description: optional string — reason for escalation; defaults to "Escalation requested for [incident_number]"

## Output Contract
- action_taken: created | already_escalated | missing_incident_info
- escalation_record: object — populated for created and already_escalated
  - title: string
  - description: string
  - incident_number: string
  - incident_link: string
  - operator: string
  - status: string
  - sharepoint_item_url: string (when available)
- user_message: required string

## Execution Steps
1. Validate incident_number and incident_link are present. If either is missing, return action_taken=missing_incident_info.
2. Attempt to create a new list item with these field values:
   - Title: escalation_description or "Escalation — [incident_number]"
   - Description: escalation_description or "Escalation requested for incident [incident_number]"
   - Incident: incident_number
   - Incident Link: incident_link
   - Operator: caller_display_name (if available, otherwise leave blank)
   - Status: Created
3. If creation succeeds, return action_taken=created with the new record details.
4. If creation fails with a duplicate or conflict error, return action_taken=already_escalated with a user-safe message.

## Rules
1. Do not run a pre-check query before creating — attempt creation directly.
2. Always set Status to "Created" on new records — never use any other value at creation time.
3. Incident Link is a required field — never submit without it.
4. Use plain language in user_message; do not expose SharePoint field names or internal query syntax.
5. If the SharePoint operation fails for any reason other than duplicate, return a safe error message and suggest the user try again.
6. Never fabricate escalation IDs, item URLs, or status values.

## User Message Templates
- created: "Your escalation request has been created for [incident_number]. I've logged it with status Created and linked it to your incident."
- already_escalated: "This incident has already been escalated. No new request was created."
- missing_incident_info: "I need the incident number and the ServiceNow link before I can raise an escalation. Can you provide those?"
