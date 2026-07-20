---
name: aria-orch-response-policy-enforcer
description: Enforce strict pass-through responses from connected agents and apply controlled fallback when no agent can handle the request.
---

# ARIA Orchestrator Response Policy Enforcer

## Purpose
Ensure the orchestrator does not answer directly when delegation is available and enforces a two-step fallback when no connected agent can handle the request.

## When To Use
- After agent selection and delegation attempt.
- Before sending any user-visible response.

## Input Contract
- delegation_available: required boolean
- connected_agent_response: optional string
- connected_agent_responses: optional ordered list of strings
- fallback_attempt_count: required number (0 or 1 or more)
- last_user_request: required string

## Output Contract
- response_mode: pass_through | ticket_overview_merge | ask_rephrase | polite_no_information
- user_response: required string
- next_fallback_attempt_count: required number

## Rules
1. If ticket-overview delegation produced both incident and request list outputs, return response_mode=ticket_overview_merge.
2. In ticket_overview_merge mode, compose one concise merged table with: Type, ID, Short description, Status, Last update date.
3. In ticket_overview_merge mode, ask one focused follow-up question asking which ticket to inspect in detail.
4. In ticket_overview_merge mode, append the shared menu template with exactly 3 options and the exact ending line.
5. If delegation_available=true and connected_agent_response exists, return response_mode=pass_through.
6. In pass_through mode, return connected_agent_response exactly as-is.
7. Do not rewrite, summarize, translate, reformat, or append content in pass_through mode.
8. If delegation is not available and fallback_attempt_count=0, return response_mode=ask_rephrase with a brief request to rephrase.
9. If delegation is still not available after rephrase (fallback_attempt_count>=1), return response_mode=polite_no_information.
10. Never fabricate an answer when no connected agent can handle the request.
11. Keep fallback responses concise, friendly, and non-technical.
12. In fallback modes, include the shared menu template with exactly 3 options and the exact ending line.
13. If multiple agent responses exist, pass through only the final response in execution order, except in ticket_overview_merge mode.

## Shared Menu Template (Mandatory)
1. {option_1}
2. {option_2}
3. {option_3}
Reply with 1, 2, or 3, or type your own reply.

## Fallback Templates
- ask_rephrase: "I could not map your request to a supported agent. Could you please rephrase your question in a different way?\n1. Try a knowledge question\n2. Check an incident\n3. Check a request\nReply with 1, 2, or 3, or type your own reply."
- polite_no_information: "Thanks for clarifying. I am sorry, but I do not have this information through my connected agents right now.\n1. Ask a knowledge question\n2. Check an incident\n3. Check a request\nReply with 1, 2, or 3, or type your own reply."
