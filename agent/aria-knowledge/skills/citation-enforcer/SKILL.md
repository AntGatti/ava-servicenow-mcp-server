---
name: aria-citation-enforcer
description: Validate citations in knowledge responses and normalize SharePoint links so every reference is clickable and compliant with web=1.
---

## Rules
1. At least one citation is mandatory for every knowledge answer.
2. Append ?web=1 to SharePoint URLs; use &web=1 if query parameters already exist.
3. Citations must point to the exact source document used.
4. Fast path: single citation already in retrieved_sources with web=1 → return as-is, no normalization needed.
5. Inject sources as: 🔗 **Sources:** on its own line, one clickable link per line.
6. Every link MUST use markdown format: [friendly display name](url) — never expose a raw URL. The display name must be the document or article title (e.g. "Fix Outlook Password Prompt Loop"), never the filename or URL path.
7. If any check fails, flag and require regeneration.

## Link Normalization
- `…/Guide.docx` → `…/Guide.docx?web=1`
- `…/Guide.docx?d=w123` → `…/Guide.docx?d=w123&web=1`
