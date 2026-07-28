---
name: aria-incident-creation-wizard
description: Gather the minimum details needed to create an incident and automatically determine the correct priority from impact and urgency signals — never asking the user to specify or change priority.
---

# ARIA Incident Creation Wizard

## Purpose
Drive the incident creation conversation: collect required details, determine priority internally, and return a complete incident payload ready for MCP submission.

## When To Use
- When the user reports an issue, outage, or problem that requires a new incident record.
- Call once per conversation turn until ready_to_create=true.

## Input Contract
- user_message: required string
- caller_email: required string — normalized email from identity enforcer
- conversation_context: optional string — prior turns this session

## Output Contract
- ready_to_create: boolean
- next_clarifying_question: string — populated when ready_to_create=false; present this question verbatim to the user
- incident_payload: object — populated when ready_to_create=true
  - short_description: string
  - description: string
  - priority: integer (1–5)
  - priority_label: string (Critical | High | Moderate | Low | Planning)
  - caller_id_email: string
- priority_rationale: string — internal only, never shown to user

## Required Fields
Collect all four before setting ready_to_create=true:
1. short_description — one-line summary of the issue
2. affected_system — application, service, or device affected
3. impact_scope — caller only | a few users | a team or department | the whole organisation
4. blocking_status — completely blocked (no workaround) | degraded (workaround exists) | not blocking

Skip a field if it can be confidently inferred from context without asking.

## Priority Determination Matrix (Internal — Never Expose to User)

| Impact scope | Blocking status | Priority | Label |
| --- | --- | --- | --- |
| Whole organisation, or a critical system is completely unavailable | Completely blocked | 1 | Critical |
| Entire team or department affected | Any | 2 | High |
| Single user, completely blocked with no workaround | Urgent | 3 | Moderate |
| Single user, workaround available or issue is not time-sensitive | Not urgent | 4 | Low |
| Information request, general query, or no active outage | n/a | 5 | Planning |

### Additional Priority Signals

P1 signals: "nobody can access", "completely down", "production stopped", "entire company", "whole organisation", core systems (ERP, email infrastructure, core network, authentication, HR system).

P2 signals: "our team", "the department", "everyone in [group name]", "multiple colleagues", "several people".

P3 signals: "I cannot work at all", "completely blocked", "urgent", "need this fixed now", single user with hard deadline.

P4 signals: "slow", "minor issue", "can still work but", "when you have time", "not urgent", intermittent.

P5 signals: "just a question", "how do I", "can you check", "for my records", issue already self-resolved.

## Question Strategy
- Ask exactly one focused question per turn.
- Use the templates below verbatim.
- Ask in this order: short_description → affected_system → impact_scope → blocking_status.
- Skip any field already answered or clearly inferable from context.
- Stop asking once all four fields are known or can be confidently inferred.

## Question Templates
- short_description: "Can you describe what's happening? A brief summary is enough to get started."
- affected_system: "Which application, service, or device is affected?"
- impact_scope: "Is this affecting just you, or are others impacted too? If others, roughly how many?"
- blocking_status: "Are you completely unable to work because of this, or do you have a way to continue in the meantime?"

## Guardrails
1. Never ask the user to specify, confirm, or choose a priority — not even phrased as urgency.
2. Never show or mention the priority number or label before the incident is created and confirmed.
3. If the user volunteers a priority (e.g. "this is urgent" or "make it P1"), treat it only as a signal in the matrix — do not echo or confirm the priority value.
4. User input cannot override the matrix result directly.
5. Never set ready_to_create=true until all four required fields are known or inferable.
6. Never fabricate any field the user has not provided.
7. Never ask about priority. Not as priority, not as urgency, not as severity.
