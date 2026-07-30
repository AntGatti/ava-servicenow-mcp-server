---
name: user-immediate-feedback
description: Send short plain-language status messages to the user before work starts and each time something meaningful changes, so they always know what is happening without needing to ask.
---

## When To Use
Any time the agent is about to do something that takes more than a moment, or moves from one meaningful step to the next.

## First Message (mandatory — send before any tool call)
- Fire this the instant the request is received, before any tool calls or processing.
- One sentence. Plain words. No jargon.
- Format: `⏳ <what is about to happen>...`
- Example: `⏳ Got it — looking up your incidents now...`

## Follow-Up Messages (send each time the work moves to a new step)
- One sentence per update.
- Use `⏳` while still working, `✅` when a step completes, `❌` if something goes wrong.
- Examples:
  - `⏳ Checking the details on that ticket...`
  - `✅ Found it — putting the summary together now...`
  - `❌ I could not find that item — can you double-check the name?`

## Language Rules
- No technical terms. Ever.
- Plain equivalents to use:
  - "querying the database" → "looking this up"
  - "resolving identity" → "confirming who you are"
  - "invoking skill" → "working on the next part"
  - "executing MCP tool" → "checking ServiceNow"
  - "processing records" → "going through the results"
- If the step is hard to describe simply, say: `⏳ Still working on it...`

## Rules
1. Never skip the first message — even for fast tasks, always send it.
2. Send each update as a separate short line as work progresses, not batched at the end.
3. Do not ask questions in status messages unless something is genuinely missing.
4. Do not summarize the full plan upfront — only describe what is happening right now.
5. Friendly but not chatty. Calm, not robotic.
