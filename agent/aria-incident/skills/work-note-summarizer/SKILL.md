---
name: aria-work-note-summarizer
description: Build a plain-language activity stream summary from comments, work notes, and field updates with latest update first.
---

# ARIA Work Note Summarizer

## Purpose
Generate activity stream sections with the most recent update first, followed by a concise summary of remaining updates.

## When To Use
- After activity stream entries are extracted from sys_journal_field and sys_audit.
- Before final response rendering for incident details.

## Input Contract
- incident_number: required string
- work_note_entries: optional list of objects with sys_created_on, sys_created_by, value
- comment_entries: optional list of objects with sys_created_on, sys_created_by, value
- field_update_entries: optional list of objects with sys_created_on, user, fieldname, oldvalue, newvalue
- current_status: optional string
- previous_latest_timestamp: optional string

## Output Contract
- latest_update_title: always "Latest Update"
- latest_update_text: required string
- activity_summary_title: always "Activity Summary"
- activity_summary_text: required string
- latest_progress: optional string
- resolution_progress: optional string
- no_change_detected: optional boolean

## Rules
1. Merge work notes, comments, and field updates into one timeline.
2. Sort events by timestamp descending and pick the first event as latest update.
3. For same timestamp collisions, prioritize field updates for state/assignment/resolution, then work notes, then comments.
4. Use plain language and avoid internal/system jargon.
5. Mention meaningful actions already performed.
6. If resolution is clear, state current resolution progress.
7. In activity summary, condense the remaining updates without repeating the latest update text.
8. Limit activity summary details to a maximum of 5 events after the latest update.
9. If previous_latest_timestamp equals the current latest event timestamp, set no_change_detected=true and return a compact no-change summary.
10. If no activity exists, clearly state that no activity updates are available yet.
11. Do not fabricate actions or outcomes.

## No-Notes Template
"Latest Update: No activity updates are available yet for this incident."
"Activity Summary: No additional activity updates are available yet."
