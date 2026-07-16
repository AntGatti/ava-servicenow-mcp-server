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
- response_mode: pass_through | ask_rephrase | polite_no_information
- user_response: required string
- next_fallback_attempt_count: required number

## Rules
1. If delegation_available=true and connected_agent_response exists, return response_mode=pass_through.
2. In pass_through mode, return connected_agent_response exactly as-is.
3. Do not rewrite, summarize, translate, reformat, or append content in pass_through mode.
4. If delegation is not available and fallback_attempt_count=0, return response_mode=ask_rephrase with a brief request to rephrase.
5. If delegation is still not available after rephrase (fallback_attempt_count>=1), return response_mode=polite_no_information.
6. Never fabricate an answer when no connected agent can handle the request.
7. Keep fallback responses concise, friendly, and non-technical.
8. If multiple agent responses exist, pass through only the final response in execution order.

## Fallback Templates
- ask_rephrase: "I could not map your request to a supported agent. Could you please rephrase your question in a different way?"
- polite_no_information: "Thanks for clarifying. I am sorry, but I do not have this information through my connected agents right now."
