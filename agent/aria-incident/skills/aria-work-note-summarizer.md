---
name: aria-work-note-summarizer
description: Build a plain-language activity stream summary from comments, work notes, and field updates with latest update first.
---

## Rules
1. Merge work notes, comments, and field updates into one timeline sorted descending by timestamp.
2. Use the first event as "Latest Update"; summarize the remainder as "Activity Summary" (max 5 events).
3. Same-timestamp collisions: field updates > work notes > comments.
4. Plain language — no internal system jargon.
5. Mention meaningful actions already performed; if resolution is clear, state progress.
6. Do not repeat the latest update text inside the activity summary.
7. If previous_latest_timestamp equals the current latest event timestamp, set no_change_detected=true and return a compact no-change summary.
8. If no activity exists, use the no-notes template.
9. Never fabricate actions or outcomes.

## No-Notes Template
"Latest Update: No activity updates are available yet for this incident."
"Activity Summary: No additional activity updates are available yet."
## Transparency
Before taking any action, send a `user-immediate-feedback` status message in plain language. Send another after each meaningful step completes.