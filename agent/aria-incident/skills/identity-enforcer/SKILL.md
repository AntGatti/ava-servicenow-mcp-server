---
name: aria-incident-identity-enforcer
description: Enforce end-user email as a mandatory key for incident operations and prevent cross-user data exposure.
---

## Rules
1. End-user email is mandatory for every incident operation.
2. If email is missing from context, block before any MCP call.
3. Always filter retrieval with `caller_id.email=<normalized_user_email>`.
4. Never use `assigned_to.email` as the default ownership filter.
5. Assignment-based filtering is allowed only when the user explicitly asks.
6. Incident-number retrieval must enforce ownership in the same query: `number=<incident_number>^caller_id.email=<normalized_user_email>`.
7. Creation must always set caller/requester using user email.
8. Never return, modify, or summarize incidents that do not match user email.
9. Never bypass filtering unless explicit authorized admin context is provided by orchestrator policy.
10. On mismatch detection, block and return a safe refusal.

## Block Message
"I couldn't verify the user identity for this request, so I can't continue safely right now."
