# Phase 5 Skill and Prompt Hygiene Analysis

Date: 2026-07-20
Scope: O-050 and O-051
Goal: Reduce chain depth and prompt overhead while preserving behavior contracts.

## Inventory Summary

1. ARIA Orchestrator
- Skill files: 11
- Total skill lines: 361
- Average lines per skill: 32.8
- Current chain depth risk: High (many policy-only micro-skills)

2. ARIA Incident
- Skill files: 7
- Total skill lines: 280
- Average lines per skill: 40.0
- Current chain depth risk: Medium

3. ARIA Request
- Skill files: 9
- Total skill lines: 294
- Average lines per skill: 32.7
- Current chain depth risk: Medium-High

4. ARIA Knowledge
- Skill files: 5
- Total skill lines: 215
- Average lines per skill: 43.0
- Current chain depth risk: Medium

## Findings by Agent

### Orchestrator
Current structure includes several policy-only micro-skills with overlapping logic:
- scope and capability checks
- pass-through enforcement
- fallback behavior
- clarification gating

Primary overlap cluster:
- capability-gate
- scope-guard
- pass-through-enforcer
- fallback-handler
- clarification-controller
- response-policy-enforcer

Observation:
- response-policy-enforcer already contains pass-through and fallback logic, making separate pass-through and fallback skills partly redundant.

### Incident
Current structure is clean but can be reduced:
- status-mapper and date-formatter are transformation helpers and can be embedded into response-builder contracts.
- next-step-suggester is a small policy block that can be folded into response-builder if menu invariants remain strict.

Potential consolidation cluster:
- status-mapper
- date-formatter
- next-step-suggester
- response-builder

### Request
Current structure has a composition pipeline with multiple small post-processing skills:
- workflow-explainer and status-summarizer have related output responsibilities.
- hyperlink-builder and response-redactor both run near final rendering stage.
- no-match-refusal is a narrow branch that can be folded into a unified response safety module.

Potential consolidation cluster:
- status-summarizer
- workflow-explainer
- hyperlink-builder
- response-redactor
- no-match-refusal

### Knowledge
Current structure is already optimized after Phase 3, but minor simplification is possible:
- keep citation-enforcer separate for compliance safety.
- step-builder and intent-router should remain separate unless routing confidence is stable enough to merge in future.
- snow-knowledge-check should remain branch-specific.

Note:
- skills manifest currently lists three knowledge skills and does not include snow-knowledge-check, which is a maintenance gap.

## Fast-First Restructure Blueprint

### Step 1 (Lowest Risk, High Gain): Orchestrator policy consolidation
Create one consolidated skill:
- aria-orch-policy-controller

Move into this skill:
- scope gating
- capability gating
- clarification decision
- pass-through enforcement
- fallback mode decision

Keep separate:
- intent-router
- delegation-planner
- context-builder

Merge candidate:
- agent-selector into delegation-planner (same decision surface)

Expected impact:
- reduce orchestrator chain transitions by 3 to 5 internal steps
- lower latency variability for ambiguous requests

### Step 2 (Low-Medium Risk): Incident rendering consolidation
Create one consolidated skill:
- aria-incident-response-composer

Move into this skill:
- state mapping
- date formatting policy
- final 3-option menu append
- list/single/ticket table rendering

Keep separate:
- identity-enforcer
- work-note-summarizer

Expected impact:
- reduce incident response chain by 2 to 3 steps
- improve list and detail response time consistency

### Step 3 (Medium Risk): Request response consolidation
Create one consolidated skill:
- aria-request-response-composer

Move into this skill:
- status summarization
- workflow explanation
- hyperlink handling
- no-match branch handling
- redaction final pass

Keep separate:
- intent-router
- identity-enforcer
- catalog-matcher
- order-validator

Expected impact:
- reduce request chain by 2 to 4 steps
- improve perceived speed in status and follow-up flows

### Step 4 (Low Risk): Shared menu template enforcement (O-051)
Create one canonical source file:
- agent/docs/shared-menu-template.md

Template:
1. {option_1}
2. {option_2}
3. {option_3}
Reply with 1, 2, or 3, or type your own reply.

Then:
- keep exact ending line in runtime contracts
- remove long duplicate fallback/menu prose where not needed
- add a hygiene check (grep-based) in docs to detect drift

Expected impact:
- small token savings per skill
- lower drift risk across agents

## Recommended Execution Order

1. O-050A: Orchestrator consolidation first
2. O-050B: Incident consolidation second
3. O-050C: Request consolidation third
4. O-051: Shared menu template unification and drift check

## Guardrails for Implementation

1. Preserve mandatory identity scoping behavior.
2. Preserve ticket_overview merge contract and output schema.
3. Preserve exact shared menu ending line in user-visible outputs.
4. Preserve request catalog-first shortlist and follow-up association gates.
5. Keep citation compliance unchanged for knowledge responses.

## Validation Gates per Consolidation

1. Functional parity
- same routing outcomes
- same refusal and fallback behavior
- same required menu shape

2. Performance
- fewer skill transitions in traces
- lower median response time for top intents

3. Safety
- no exposure of internal technical values
- no cross-user data leakage

## Practical Target for Phase 5

1. Reduce active skill transitions by at least 25 percent in orchestrator-heavy and request-heavy paths.
2. Keep all mandatory behavior contracts intact.
3. Avoid introducing new ambiguous policy wording in consolidated skills.
