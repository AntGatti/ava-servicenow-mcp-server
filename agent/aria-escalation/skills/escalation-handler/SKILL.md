---
name: aria-escalation-handler
description: Create a new escalation request in the SharePoint Escalation Requests list, always linked to a ServiceNow incident. Handles duplicate detection via error response rather than a pre-check query.
---

# ARIA Escalation Handler

## Purpose
Create escalation requests with the correct metadata in the SharePoint Escalation Requests list. Skip the pre-check query — attempt creation directly and handle duplicate errors gracefully.

## When To Use
- After identity enforcement and after all required fields have been collected by the agent.

## SharePoint Target
- Site URL: https://avashowcase.sharepoint.com/sites/SampleITSupport
- List name: Escalation Requests
- List URL: https://avashowcase.sharepoint.com/sites/SampleITSupport/Lists/Escalation%20Requests/AllItems.aspx
- Tool: Work IQ SharePoint
- Tool action: createListItem

## Input Contract
- incident_number: required string — e.g. INC0014931
- incident_link: required string — full ServiceNow URL for the incident
- escalation_description: required string — reason for escalation collected from user
- normalized_user_email: required string — from identity enforcer
- caller_display_name: optional string — display name from identity enforcer, used as Operator

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

## SharePoint Field Mapping

| SharePoint Column | Value | Required |
|---|---|---|
| Title | escalation_description (truncated to ~100 chars if needed) | Yes |
| Description | escalation_description (full text) | Yes |
| Incident | incident_number | Yes |
| Incident Link | incident_link | Yes |
| Operator | caller_display_name | No |
| Status | Created (always) | Yes |

## Execution Steps
1. Confirm incident_number, incident_link, and escalation_description are all present. If any is missing, return action_taken=missing_incident_info.
2. Call Work IQ SharePoint tool `createListItem` with:
   - Site: https://avashowcase.sharepoint.com/sites/SampleITSupport
   - List: Escalation Requests
   - Fields: as per the field mapping table above.
3. If creation succeeds, return action_taken=created with the new record details.
4. If creation fails with a duplicate or conflict error, return action_taken=already_escalated.

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
