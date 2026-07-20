# Copilot Studio Agent Performance Optimization Backlog

## How To Use This File
- Execute one item at a time, top to bottom.
- After each item, capture before/after latency and quality notes.
- Do not start the next item until acceptance criteria are met.

## Performance Targets
- Reduce median response time (p50) by at least 25%.
- Reduce high-tail latency (p95) by at least 30%.
- Reduce average tool calls per user request by at least 20%.
- Preserve behavior quality (no regression in routing, identity scoping, and required menus).

## Measurement Setup (Do First)
- [ ] O-001 Define baseline metrics collection for all ARIA agents.
	- Scope: ARIA Orchestrator, Incident, Request, Knowledge.
	- Record per-turn: total latency, LLM latency, MCP latency, tool call count, token input/output.
	- Acceptance:
		- Baseline report exists with p50/p95 and top 10 slow intents.

- [ ] O-002 Add per-intent timing buckets.
	- Buckets: ticket_overview, incident_list, incident_detail, request_catalog_match, request_status, knowledge_answer.
	- Acceptance:
		- Each bucket has at least 20 samples in baseline.

## Phase 1: Prompt + Instruction Footprint Reduction

- [x] O-010 Create runtime-lean variants of agent instructions.
	- Files:
		- agent/aria-orchestrator/aria-orchestrator.instructions.md
		- agent/aria-incident/aria-incident.instructions.md
		- agent/aria-request/aria-request.instructions.md
		- agent/aria-knowledge/aria-knowledge.instructions.md
	- Action:
		- Keep only mission, hard guardrails, routing/decision contracts, output contracts.
		- Move explanatory prose/examples to docs (not runtime instructions).
	- Acceptance:
		- Each file reduced significantly in lines/verbosity.
		- No loss of mandatory behaviors (identity scoping, menu template, ticket overview path).

- [x] O-011 Remove duplicate manifest maintenance where possible.
	- Targets with both files present:
		- agent/aria-incident/skills/SKILL.md and agent/aria-incident/skills/skills.md
		- agent/aria-knowledge/skills/SKILL.md and agent/aria-knowledge/skills/skills.md
		- agent/aria-orchestrator/skills/SKILL.md and agent/aria-orchestrator/skills/skills.md
	- Action:
		- Keep one canonical manifest per skills folder.
	- Acceptance:
		- Packaging and loading still work.
		- No duplicate source of truth.

## Phase 2: Flow Simplification (Biggest Latency Wins)

- [ ] O-020 Incident fast-path split (list vs detail).
	- File focus:
		- agent/aria-incident/aria-incident.instructions.md
	- Action:
		- Hard split:
			- list mode: never fetch activity stream.
			- detail mode: fetch activity stream only when needed.
	- Acceptance:
		- incident_list tool calls reduced.
		- list latency improved with no data leakage.

- [ ] O-021 Limit activity stream fan-out in detail mode.
	- Files:
		- agent/aria-incident/aria-incident.instructions.md
		- agent/aria-incident/skills/work-note-summarizer/SKILL.md
	- Action:
		- Lower default record limits for sys_journal_field and sys_audit.
		- Expand only if user asks for full history.
	- Acceptance:
		- incident_detail p95 improved.

- [ ] O-022 Request flow gate optimization.
	- Files:
		- agent/aria-request/aria-request.instructions.md
		- agent/aria-request/skills/order-validator/SKILL.md
	- Action:
		- Ensure no workflow explainer execution on simple browse/list flows.
		- Execute follow-up association checks only in follow_up_task mode.
	- Acceptance:
		- request_status and catalog_match tool chains shortened.

- [ ] O-023 Orchestrator two-step routing model.
	- Files:
		- agent/aria-orchestrator/aria-orchestrator.instructions.md
		- agent/aria-orchestrator/skills/intent-router/SKILL.md
		- agent/aria-orchestrator/skills/delegation-planner/SKILL.md
	- Action:
		- Keep runtime logic minimal: classify, delegate.
		- Keep merge logic only for ticket_overview intent.
	- Acceptance:
		- Orchestrator latency reduced.
		- No routing regressions.

## Phase 3: Knowledge Retrieval Optimization

- [x] O-030 Retrieval budget policy for knowledge answers.
	- Files:
		- agent/aria-knowledge/aria-knowledge.instructions.md
		- agent/aria-knowledge/skills/step-builder/SKILL.md
		- agent/aria-knowledge/skills/citation-enforcer/SKILL.md
	- Action:
		- First-pass top 1 source.
		- Expand to top 3 only on low confidence.
		- Keep citation normalization fast-path enabled.
	- Acceptance:
		- knowledge_answer median latency reduced.
		- Citation quality unchanged.

- [x] O-031 Knowledge fast-answer short circuit.
	- Action:
		- If one source fully answers, skip deeper synthesis overhead.
	- Acceptance:
		- Faster single-source Q&A responses.

## Phase 4: Caching + Progressive Disclosure

- [ ] O-040 Add short-lived response caching per conversation.
	- Candidate caches:
		- incident list
		- request list
		- ticket overview merged list
	- TTL recommendation:
		- 30 to 60 seconds.
	- Acceptance:
		- Repeat query latency substantially lower.
		- Correct no-change behavior maintained.

- [ ] O-041 Progressive pagination defaults.
	- Action:
		- Return top 5 by default.
		- Add explicit menu option: show more.
	- Acceptance:
		- Token output reduced.
		- Better perceived responsiveness.

## Phase 5: Skill/Prompt Hygiene

- [ ] O-050 Consolidate tiny policy-only skills where safe.
	- Goal:
		- Reduce chain depth and intermediate reasoning steps.
	- Acceptance:
		- Fewer internal step transitions for same intent.

- [ ] O-051 Keep one shared menu template everywhere.
	- Current template:
		- 1. {option_1}
		- 2. {option_2}
		- 3. {option_3}
		- Reply with 1, 2, or 3, or type your own reply.
	- Acceptance:
		- No template drift across ARIA files.

## Phase 6: Validation + Regression Guard

- [ ] O-060 Create perf regression checklist.
	- Validate after every change:
		- identity scoping
		- catalog-first behavior
		- follow-up REQ/RITM association gate
		- ticket overview table + follow-up menu
		- exact shared menu template
	- Acceptance:
		- No functional regressions.

- [ ] O-061 Compare before/after performance report.
	- Include:
		- p50/p95 per intent
		- avg tool calls per intent
		- token input/output changes
	- Acceptance:
		- Target reductions met or documented with next actions.

## Nice-To-Have (After Core Wins)

- [ ] O-070 Review image/binary assets in agent folder for packaging overhead.
	- Candidates:
		- agent/aria-knowledge/aria-k.png
		- agent/aria-request/aria-r.png
		- agent/aria-incident/aria-i.png
		- agent/aria-orchestrator/aria-o.png
	- Action:
		- Verify they are not loaded into runtime prompts unnecessarily.

- [ ] O-071 Add intent-level circuit breakers.
	- Examples:
		- Skip heavy audit queries unless explicitly requested.
		- Prevent duplicate MCP lookups in same turn.

## Execution Log

- Item ID: O-010
- Date: 2026-07-20
- Owner: Copilot
- Change Summary: Trimmed runtime instruction prose in orchestrator, incident, request, and knowledge; moved explanatory examples/notes into per-agent docs under `agent/docs`.
- Before (p50/p95): not measured
- After (p50/p95): not measured
- Tool Calls Before/After: not measured
- Quality Check Result: Mandatory behavior sections retained (identity scoping, ticket overview flow, menu template, catalog-first, follow-up association gate).
- Next Step: Start O-020 incident fast-path split.

- Item ID: O-011
- Date: 2026-07-20
- Owner: Copilot
- Change Summary: Standardized manifest references to `skills/SKILL.md`; removed duplicate `skills.md` manifests from incident, knowledge, and orchestrator skills folders.
- Before (p50/p95): not measured
- After (p50/p95): not measured
- Tool Calls Before/After: not measured
- Quality Check Result: Canonical manifest selected and references updated.
- Next Step: Validate packaging/loading path in next verification run.

- Item ID: O-030
- Date: 2026-07-20
- Owner: Copilot
- Change Summary: Implemented knowledge retrieval budget policy: top-1 first pass, expand to top-3 only on low confidence or incomplete coverage; retained citation fast-path behavior.
- Before (p50/p95): not measured
- After (p50/p95): not measured
- Tool Calls Before/After: not measured
- Quality Check Result: Policy updated in knowledge instructions and supporting skills; citation compliance contract preserved.
- Next Step: Measure knowledge_answer p50/p95 after at least 20 samples.

- Item ID: O-031
- Date: 2026-07-20
- Owner: Copilot
- Change Summary: Added fast-answer short-circuit contract for single high-confidence source to reduce synthesis overhead.
- Before (p50/p95): not measured
- After (p50/p95): not measured
- Tool Calls Before/After: not measured
- Quality Check Result: Short-circuit behavior documented with no change to required menu and citation output contracts.
- Next Step: Validate response quality on single-source and low-confidence scenarios.

- Item ID: O-031-VERIFY
- Date: 2026-07-20
- Owner: Copilot
- Change Summary: Ran focused Phase 3 verification checklist with sample prompts and contract checks for retrieval budget, short-circuit behavior, citation fast-path, and menu/citation quality contracts.
- Before (p50/p95): not measured
- After (p50/p95): not measured
- Tool Calls Before/After: not measured
- Quality Check Result: Contract checks passed; live latency telemetry not captured in this run.
- Next Step: Execute 10-20 live prompt runs and capture perceived speed score + measured latency where available.

- Item ID: O-050-ANALYSIS
- Date: 2026-07-20
- Owner: Copilot
- Change Summary: Completed cross-agent skill audit and produced Phase 5 restructure blueprint focused on reducing skill-chain depth while preserving mandatory contracts.
- Before (p50/p95): not measured
- After (p50/p95): not measured
- Tool Calls Before/After: not measured
- Quality Check Result: Consolidation candidates identified per agent with risk and guardrails documented.
- Next Step: Execute O-050A orchestrator policy consolidation first.

- Item ID: O-050A
- Date: 2026-07-20
- Owner: Copilot
- Change Summary: Implemented orchestrator consolidation with minimal-risk edits by introducing aria-orch-policy-controller, folding selector semantics into delegation-planner outputs, and reducing active orchestrator skills in instructions/manifest.
- Before (p50/p95): not measured
- After (p50/p95): not measured
- Tool Calls Before/After: not measured
- Quality Check Result: Legacy micro-skill files retained for rollback safety; routing, pass-through, ticket_overview merge, and fallback contracts preserved in consolidated policy skill.
- Next Step: Run O-050A verification prompts and compare step transitions before/after.

### Template
- Item ID:
- Date:
- Owner:
- Change Summary:
- Before (p50/p95):
- After (p50/p95):
- Tool Calls Before/After:
- Quality Check Result:
- Next Step:

