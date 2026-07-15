---
name: aria-intent-router
description: Classify the user request into one support domain, set confidence, and choose the next action for knowledge or incident routing.
---

# ARIA Intent Router

## Purpose
Classify user requests into a single support domain with confidence and the required next action.

## When To Use
- Any new user request before retrieval or response generation.

## Input Contract
- user_message: required string
- conversation_context: optional string

## Output Contract
- intent: one domain value from the supported list
- confidence: high | medium | low
- rationale: short sentence
- next_action: answer_directly | ask_clarification | route_incident
- clarification_question: required only when next_action is ask_clarification

## Rules
1. Return exactly one primary intent.
2. Use only these domain values:
	- Access Requests
	- Applications
	- Audio/Video
	- Email & Collaboration
	- Endpoint Management
	- Files & Storage
	- Hardware
	- Identity & Access
	- Networking & Remote Access
	- Printing
	- Productivity
	- Security
	- Security & Device Protection
	- Software
3. If intent confidence is low, set next_action to ask_clarification and return one focused question.
4. If the request is incident operation oriented (status, update, close, assign, comment, work notes, incident number), set next_action to route_incident.
5. Keep rationale concise and user-safe.

## Examples
- "Outlook keeps asking for password" -> Email & Collaboration, high, answer_directly
- "VPN connected but no internet" -> Networking & Remote Access, high, answer_directly
- "What is the status of INC0014723" -> Incident operation, high, route_incident
