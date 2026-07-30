---
name: aria-next-step-suggester
description: Append exactly three relevant next-step options plus the shared menu ending line to every incident response.
---

## Rules
1. Return exactly 3 next-step options, relevant to the current conversation and last action.
2. Keep option wording short and user-friendly — no technical or internal commands.
3. Always append the exact free-text line as the final line.

## Free-Text Line (Mandatory)
"Reply with 1, 2, or 3, or type your own reply."
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.