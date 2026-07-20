# ARIA Orchestrator Runtime Notes

This file holds explanatory guidance moved out of runtime-critical instructions to reduce prompt footprint.

## Fast Routing Notes
- Route incident-only actions directly to the Incident Agent.
- Route request-only actions directly to the Request Agent.
- Route troubleshooting and how-to questions to Knowledge Agent first.
- For mixed asks, use Knowledge Agent first and then Incident or Request as needed.
- For generic "tickets" asks without explicit type, use ticket overview flow.

## Ticket Overview Prompting Example
- Follow-up prompt example: "Which ticket should I open in detail? You can reply with an ID."
