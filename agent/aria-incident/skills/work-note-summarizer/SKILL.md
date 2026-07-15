---
name: aria-work-note-summarizer
description: Build a plain-language Work Note Summary from incident journal entries and highlight current progress or resolution.
---

# ARIA Work Note Summarizer

## Purpose
Generate the mandatory Work Note Summary section in clear end-user language.

## When To Use
- After work notes are extracted from sys_journal_field.
- Before final response rendering for incident details.

## Input Contract
- incident_number: required string
- work_note_entries: required list of objects with sys_created_on, sys_created_by, value
- current_status: optional string

## Output Contract
- section_title: always "Work Note Summary"
- summary_text: required string
- latest_progress: optional string
- resolution_progress: optional string

## Rules
1. Summarize chronologically with emphasis on latest updates.
2. Use plain language and avoid internal/system jargon.
3. Mention meaningful actions already performed.
4. If resolution is clear, state current resolution progress.
5. If no notes exist, state clearly that no work notes are available yet.
6. Do not fabricate actions or outcomes.

## No-Notes Template
"Work Note Summary: No work notes are available yet for this incident."
