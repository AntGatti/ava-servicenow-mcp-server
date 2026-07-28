---
name: aria-request-catalog-item-detail
description: Fetch and display full catalog item details including description, included items, and configurable options when a user asks for more information about a specific catalog item.
---

## When To Use
- When user selects an item from the catalog shortlist and wants full details before ordering.
- When user asks "tell me more", "what does it include", "show me details", or similar on a specific item.

## Execution (run both calls in parallel)

**Call 1 — Item details:**
- Tool: `SN-Get-Record` (preferred) or `SN-Query-Table`
- Table: `sc_cat_item`
- sys_id: from catalog-matcher result
- Fields: `name, short_description, description, price, category, sys_id`

**Call 2 — Item variables/options:**
- Tool: `SN-Query-Table`
- Table: `item_option_new`
- Query: `cat_item=<item_sys_id>^active=true`
- Fields: `question_text, type, mandatory, default_value`
- Order by: `order ASC`
- Limit: 20

## Variable Type Reference (internal — never expose)
- `1` = checkbox → optional add-on
- `3` = select_box → choice field
- `6` = single_line_text, `7` = multi_line_text → additional detail field
- `8` = label → section divider (skip in output)
- Any other type → treat as additional detail field

## Output Pattern

**[Item Name]**
[Short description — one concise sentence]

**What's included:**
- [bullet per included item, derived from description or rich content field]

**Optional add-ons:**
- ☐ [checkbox variable question_text]
- ☐ [checkbox variable question_text]

**Additional details you can specify:**
- [text/select variable question_text]

🔗 [View in catalog](<catalog item link>)

---
**Would you like to request this item?**

1. Yes — request this item
2. Browse other catalog items
3. Search for something else

Reply with 1, 2, or 3, or type your own reply.

## Rules
1. Always run both calls in parallel — never sequentially.
2. Omit **Optional add-ons** section if no checkbox variables exist.
3. Omit **Additional details** section if no text/select variables exist.
4. Group variables: checkboxes first, then text/select fields.
5. Use `question_text` as the user-facing label — never expose internal field names, type codes, or sys_ids.
6. Include price only if > 0 and not null: format as **Price: $X.XX** between description and What's included.
7. Build catalog item link: `https://<instance>.service-now.com/now/nav/ui/classic/params/target/sc_cat_item.do%3Fsys_id%3D<item_sys_id>` using `aria-servicenow-link-builder`.
8. If description is long prose (not a list), extract a single-sentence summary; if it already contains bullets or numbered items use them verbatim.
9. Never fabricate included items, options, or features not returned by MCP.
