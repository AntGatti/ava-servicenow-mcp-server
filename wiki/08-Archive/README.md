[← Home](../Home.md)

# Archive and Legacy Documentation Disposition

The original `docs/` tree holds **44 markdown files, ~550 KB**, accumulated over the
project's life. This page records what each file is and what should happen to it.

**Nothing has been deleted.** `docs/` is untouched; this wiki was built alongside it.
Removing files is a separate, reversible step to be taken once this mapping is agreed.

Where the wiki and `docs/` disagree, **the wiki is correct** — see
[Documentation Standards](../06-Governance/Documentation-Standards.md#other-inaccuracies-corrected-in-this-wiki).

---

## Summary

| Disposition | Files | Meaning |
|---|---|---|
| ✅ Superseded | 21 | Content absorbed into the wiki; safe to delete |
| 📦 Archive | 13 | Point-in-time records; keep for provenance, move out of the docs path |
| 🔬 Keep as research | 7 | Durable technical findings; still referenced |
| ⚠️ Action required | 3 | Contains a credential, or describes unbuilt features as real |

---

## ⚠️ Action required

| File | Problem |
|---|---|
| `SETUP_GUIDE.md` | **Contains a live leaked ServiceNow password in two places**, plus a real dev instance hostname. Also documents `npm start:http` / `npm start:stdio`, which do not exist. Superseded by [Installation](../01-Getting-Started/Installation.md) — **delete, and rotate the credential** |
| `PUPPETEER_INTEGRATION_PROPOSAL.md` | 1,322 lines describing 8 `SN-Puppeteer-*` tools that were never built, written in the same voice as shipped features. If kept, retitle explicitly as a rejected/pending proposal |
| `FLOW_DESIGNER_GUIDE.md` | Describes ~20 flow tools that do not exist. Real content survives in [Platform Limitations](../07-Architecture/Platform-Limitations.md) |

The credential is also in git history at commit `d008f8d`. **Deleting the file is not
sufficient** — rotation is required. See
[Security Posture](../06-Governance/Security-Posture.md#2-leaked-credential-).

---

## ✅ Superseded — content absorbed into the wiki

| Legacy file | Replaced by |
|---|---|
| `SETUP_GUIDE.md` | [Installation](../01-Getting-Started/Installation.md) |
| `CLAUDE_DESKTOP_SETUP.md` | [Client Setup](../01-Getting-Started/Client-Setup.md) |
| `MULTI_INSTANCE_CONFIGURATION.md` | [Configuration](../01-Getting-Started/Configuration.md) |
| `INSTANCE_SWITCHING_GUIDE.md` | [Multi-Instance Routing](../05-Operations/Multi-Instance-Routing.md) |
| `API_REFERENCE.md` | [Tool Index](../02-Tool-Reference/Tool-Index.md) — now **generated** |
| `QUICK_REFERENCE.md` | [Tool Index](../02-Tool-Reference/Tool-Index.md) + [Usage Patterns](../02-Tool-Reference/Usage-Patterns.md) |
| `MCP_TOOLS_AND_RESOURCES.md` | [Tool Index](../02-Tool-Reference/Tool-Index.md) + [MCP Resources](../03-Resources/MCP-Resources.md) |
| `CONVENIENCE_TOOLS.md` | [Usage Patterns](../02-Tool-Reference/Usage-Patterns.md) |
| `RESOURCES_ARCHITECTURE.md`, `RESOURCES_IMPLEMENTATION.md`, `RESOURCES_SUMMARY.md` | [MCP Resources](../03-Resources/MCP-Resources.md) — three files, one topic |
| `DOCKER_DEPLOYMENT.md` | [Docker](../04-Deployment/Docker.md) |
| `SSE_DOCKER_SETUP.md` | [SSE and Reverse Proxies](../04-Deployment/SSE-and-Reverse-Proxies.md) |
| `403_TROUBLESHOOTING.md` | [Permissions and 403s](../05-Operations/Permissions-and-403s.md) |
| `MIGRATION_CONTRACT.md` | [Frozen Contract](../06-Governance/Frozen-Contract.md) |
| `UI_OPERATIONS_ARCHITECTURE.md`, `UI_OPERATIONS_DECISION_MATRIX.md`, `UI_OPERATIONS_SUMMARY.md` | [Platform Limitations](../07-Architecture/Platform-Limitations.md) — three files, one topic |
| `research/FLOW_DESIGNER_LIMITATIONS.md`, `research/FLOW_DESIGNER_MCP_FEASIBILITY.md`, `research/WORKFLOW_VS_FLOW_DESIGNER.md` | [Platform Limitations](../07-Architecture/Platform-Limitations.md) |
| `research/CONSOLIDATED-ARCHITECTURE.md`, `research/DYNAMIC_ARCHITECTURE.md` | [Architecture Overview](../07-Architecture/Overview.md) |

## 📦 Archive — point-in-time work records

Not documentation: snapshots of a task being finished. Their value is historical.

`IMPLEMENTATION_COMPLETE.md` · `NATURAL_LANGUAGE_SEARCH_IMPLEMENTATION.md` ·
`CONVENIENCE_TOOLS_SUMMARY.md` · `VALIDATION_SUMMARY.md` ·
`UPDATE_SET_VALIDATION.md` · `UPDATE_SET_VALIDATION_SUMMARY.md` ·
`APPLICATION_SCOPE_VALIDATION.md` · `SSE_FIX_SUMMARY.md` ·
`research/CHANGELOG_2025-09-29.md` · `research/QUICK_FIX.md` ·
`research/TESTING_RECOMMENDATIONS.md` · `research/MICHAELBUCKNER_MCP_EVALUATION.md` ·
`docs/Avanade Employee Self-Service/Solution.md`

Notes:

- The `*_SUMMARY` pattern is the duplication rule being broken — a summary of a document
  that lives beside the document.
- `MICHAELBUCKNER_MCP_EVALUATION.md` evaluates a **third-party** project. Its "License:
  MIT" line is accurate about that project and must not be rebranded.
- `Avanade Employee Self-Service/Solution.md` (29 KB, dated 2026-07-13) is an ESS
  solution document, not MCP server documentation. It belongs with the ARIA/ESS
  materials, not here.

## 🔬 Keep as research

Durable findings that explain why the system is built the way it is:

| File | Why it survives |
|---|---|
| `research/BACKGROUND_SCRIPT_EXECUTION.md` | The `sys_trigger` discovery behind `SN-Execute-Background-Script` |
| `research/UI_API_BREAKTHROUGH.md` | The `concoursepicker` endpoints behind update-set and scope switching |
| `research/WORKFLOW_CREATION.md` | Programmatic classic-Workflow creation |
| `research/README.md` | Research index |

These contain real dev instance hostnames in example `curl` commands. Scrub them when
the credential is rotated.

---

## Recommended sequence

1. **Rotate the credential** in `d008f8d` / `SETUP_GUIDE.md` — independent of everything else
2. Agree this mapping
3. Move 📦 files to `docs/archive/`, scrub hostnames from 🔬 files
4. Delete ✅ superseded files
5. Replace `docs/README.md` with a pointer to this wiki
6. Reconcile `CLAUDE.md`, which documents several non-existent tools and claims
   "480+ tools"
