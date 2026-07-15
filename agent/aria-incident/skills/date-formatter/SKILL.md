---
name: aria-date-formatter
description: Format incident dates in user-friendly style with date-only default and optional time based on explicit user request.
---

# ARIA Date Formatter

## Purpose
Enforce consistent date display policy for incident responses.

## When To Use
- Before rendering created/opened/updated dates in user responses.

## Input Contract
- input_datetime: required datetime string
- user_requested_time: required boolean
- user_timezone: optional string
- user_city: optional string

## Output Contract
- formatted_value: required string
- requires_timezone_clarification: boolean
- clarification_question: required when requires_timezone_clarification=true

## Rules
1. Default output must be date only, for example: 15 July 2026.
2. Include time only when user explicitly asks for time.
3. If time is requested and timezone is unknown, request user city first.
4. After timezone is derived, reuse it for the rest of the conversation.
5. Keep formatting human-friendly and locale-consistent.

## Clarification Template
"To show the time correctly, which city are you in?"
