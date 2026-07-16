# ARIA Request Updates Workflow (Copilot Studio)

## Goal
Run a scheduled flow that retrieves user-scoped request updates and sends a readable email notification.

## Nodes Used (Current Flow)
1. Recurrence
2. Get user profile
3. Agent
4. Send an email

## Agent Node Configuration
### Agent
- ARIA - Requests

### Current Message (keep as-is)
provide the list of my requests, include the most recent updates from comments or work notes. I am [User Principal Name]

### Appended Message Instructions (add after current message)
Also include a concise request digest and produce structured output as JSON for email delivery.

Requirements:
- Scope requests to the current user identity from context.
- Include only requests associated with the current user.
- Prioritize newest updates from comments and work notes.
- Use this fixed recipient for notification delivery: Monty.Roberts@avashowcase.onmicrosoft.com.
- The Agent must not output, suggest, or override recipient values; recipient is controlled only by the flow Send an email node.
- Return a ready-to-send email payload with:
  - subject
  - bodyHtml
- bodyHtml must be rich, human-friendly, and easy to scan.
- Do not expose raw technical values (no sys_ids, table names, internal codes).
- Use clickable links for request numbers when available.

## Recommended Final Agent Message (combined)
provide the list of my requests, include the most recent updates from comments or work notes. I am [User Principal Name]. Also include a concise request digest and produce structured output as JSON for email delivery. Scope requests to the current user identity from context, include only requests associated with the current user, prioritize newest updates from comments and work notes, and return a ready-to-send payload with subject and bodyHtml. bodyHtml must be rich, human-friendly, and easy to scan. Do not expose raw technical values and include clickable links for request numbers when available.

## Structured Output JSON Schema (Agent Node)
Use this schema in the Agent node JSON Schema field.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "subject",
    "bodyHtml"
  ],
  "properties": {
    "subject": {
      "type": "string",
      "description": "Email subject line for the request update digest"
    },
    "bodyHtml": {
      "type": "string",
      "description": "Rich HTML body for the email notification"
    }
  }
}
```

## Expected JSON Output Example
```json
{
  "subject": "Your Request Update Digest - 16 Jul 2026",
  "bodyHtml": "<html><body style=\"font-family:Segoe UI,Arial,sans-serif;color:#1f2937;\"><h2 style=\"margin:0 0 12px;\">Request Updates</h2><p style=\"margin:0 0 16px;\">Here is your latest request summary.</p><table style=\"border-collapse:collapse;width:100%;\"><thead><tr><th style=\"text-align:left;border-bottom:1px solid #d1d5db;padding:8px;\">Request</th><th style=\"text-align:left;border-bottom:1px solid #d1d5db;padding:8px;\">Status</th><th style=\"text-align:left;border-bottom:1px solid #d1d5db;padding:8px;\">Latest update</th></tr></thead><tbody><tr><td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\"><a href=\"https://accentureservicessrodemo4.service-now.com/nav_to.do?uri=sc_request.do?sys_id=[request_sys_id]\">REQ0012345</a></td><td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\">In Progress</td><td style=\"padding:8px;border-bottom:1px solid #e5e7eb;\">Fulfillment team posted a progress update 3 hours ago.</td></tr></tbody></table><p style=\"margin:16px 0 0;color:#6b7280;\">This is an automated update.</p></body></html>"
}
```

## Send an Email Node Mapping
- To: Monty.Roberts@avashowcase.onmicrosoft.com
- Subject: Agent.subject
- Body: Agent.bodyHtml
- Is HTML: true

## Notes
- If no requests are found, send a friendly no-update HTML email body.
- If identity cannot be resolved from context, fail safely and avoid sending unrelated request data.
- Keep output user-friendly and non-technical.
