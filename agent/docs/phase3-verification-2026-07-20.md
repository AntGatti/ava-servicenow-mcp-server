# Phase 3 Verification Checklist (Focused)

Date: 2026-07-20
Scope: O-030 and O-031 (Knowledge retrieval budget + fast-answer short circuit)
Files verified:
- agent/aria-knowledge/aria-knowledge.instructions.md
- agent/aria-knowledge/skills/step-builder/SKILL.md
- agent/aria-knowledge/skills/citation-enforcer/SKILL.md

## Verification Method
- Contract verification against runtime instruction and skill rules.
- Focused sample-prompt suite for live perception checks.
- Static validation only in this run (no end-to-end latency telemetry captured yet).

## Contract Checks

1. Retrieval budget policy present
- Check: first pass top 1, expand to top 3 only on low confidence/incomplete coverage.
- Result: PASS
- Evidence: aria-knowledge.instructions core behavior section.

2. Fast-answer short circuit present
- Check: single high-confidence source bypasses deeper synthesis.
- Result: PASS
- Evidence: aria-knowledge.instructions + step-builder rule 4.

3. Step-builder supports fast path signals
- Check: retrieval_confidence and source_count accepted in input contract.
- Result: PASS
- Evidence: step-builder input contract.

4. Citation fast path preserved
- Check: single valid source with web=1 passes without extra normalization.
- Result: PASS
- Evidence: citation-enforcer rule 6.

5. Citation compliance unchanged
- Check: at least one citation required; all SharePoint links include web=1.
- Result: PASS
- Evidence: citation-enforcer rules 1-3.

6. Response quality contract retained
- Check: concise step-by-step structure + exact 3-option menu + exact ending line.
- Result: PASS
- Evidence: knowledge instructions + step-builder output/rules.

## Focused Sample Prompts (for live run)

Use these prompts in order and capture perceived latency, answer quality, and formatting compliance.

### A. Fast-answer path (single-source expected)
1. "How do I reset my Microsoft Authenticator app on a new phone?"
2. "How do I clear Teams cache on Windows?"

Expected:
- Retrieval stays on top-1 source when confidence is high.
- 2-4 concise steps possible in fast path.
- At least one clickable SharePoint link with web=1.
- Exact 3-option menu and exact ending line.

### B. Expansion path (top-3 on low confidence)
3. "My VPN is connected but SharePoint and Outlook both fail randomly."
4. "OneDrive sync is stuck after password reset and MFA update."

Expected:
- Expansion from top-1 to up to top-3 sources when coverage is incomplete.
- Clear uncertainty handling and safe next action.
- Citations remain compliant with web=1.

### C. Citation normalization checks
5. "Show me the policy source for mailbox delegation setup."

Expected:
- If source URL has query params, link ends with &web=1.
- If no query params, link ends with ?web=1.

### D. Guardrail and trigger checks
6. "Run a ServiceNow knowledge check for incident assignment policy."
7. "Write me a Python script to scrape SharePoint."

Expected:
- Prompt 6 triggers SNOW knowledge-check path only.
- Prompt 7 receives polite out-of-scope refusal and redirection.

## Perceived-Speed Scoring Sheet (quick)
Score each prompt from 1-5:
- Speed perception (time-to-first-useful-answer)
- Clarity (easy to follow)
- Completeness (enough steps to act)
- Citation trust (clear source link)

Target pass:
- Average speed perception >= 4.0
- No citation compliance failures
- No menu template drift

## Result Summary (this run)
- Contract verification: PASS
- Runtime latency measurement: NOT EXECUTED in this run
- Next recommended action: Run 10-20 live prompt samples and record p50/p95 perception + measured latency if telemetry is available.
