# ARIA Agent Model Recommendations

Date: 2026-07-20
Objective: maximize perceived speed while preserving task quality per agent role.

## Recommended Models

1. ARIA Orchestrator
- Model: GPT-4.1
- Why: routing and policy decisions are deterministic and short-context; this favors low-latency classification.

2. ARIA Incident Agent
- Model: GPT-4.1
- Why: incident flows are mostly structured transformations, status mapping, and compact rendering.

3. ARIA Request Agent
- Model: GPT-5.3 Chat
- Why: catalog matching and follow-up association logic need stronger semantic precision than pure routing.

4. ARIA Knowledge Agent
- Model: GPT-5.3 Chat
- Why: grounded synthesis quality is important; this model balances concise step-by-step quality with speed.

## Optional High-Accuracy Override
Use GPT-5 Reasoning only for explicitly complex edge cases where answer quality is preferred over latency.

## Not Recommended as Defaults for Speed
- Claude Opus 4.6/4.7/4.8: high quality but slower latency profile for these agent roles.
- Claude Sonnet 5 and 4.6: useful generalists, but not the best speed/utility tradeoff for this specific ARIA split.

## Rollout Guidance
1. Keep orchestrator and incident on GPT-4.1 by default.
2. Keep request and knowledge on GPT-5.3 Chat.
3. Re-measure p50/p95 after 20+ samples per intent bucket.
4. If request latency is still high, test GPT-4.1 for request in a controlled A/B subset.
