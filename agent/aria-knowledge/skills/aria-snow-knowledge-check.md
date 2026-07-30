---
name: aria-snow-knowledge-check
description: Execute explicit ServiceNow knowledge checks using MCP SN-Natural-Language-Search only, then return concise step-by-step guidance with article source links.
---

## Rules
1. Trigger only on explicit "SNOW knowledge check" or "ServiceNow knowledge check" requests.
2. Use SN-Natural-Language-Search only — no SN-Query-Table or other retrieval methods.
3. Build a natural-language query from the user request (e.g., "published knowledge articles about vpn").
4. Return concise step-by-step guidance with source article link(s).
5. Format every source link as [Article Title](url) — never expose a raw URL.
6. If no reliable article is found, say so clearly and ask one focused follow-up.
7. Do not expose raw technical values.
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.