[← Home](../Home.md)

# Documentation Standards

Rules for this wiki, and the evidence for why they exist.

---

## The rules

1. **Tool documentation is generated, never hand-written.**
   [Tool-Index.md](../02-Tool-Reference/Tool-Index.md) comes from `npm run docs:tools`.
   To change it, change the tool definition in the source.

2. **One topic, one page.** No `X.md` plus `X_SUMMARY.md` plus `X_IMPLEMENTATION.md`.
   If a summary is worth having it is the top section of the page.

3. **No status documents.** "Implementation Complete", "Validation Summary" and dated
   changelogs are work records, not documentation. They belong in the commit history
   or in [Archive](../08-Archive/README.md).

4. **Proposals are labelled as proposals** and never describe unbuilt tools in the same
   voice as built ones.

5. **No credentials, ever** — not even for a dev instance, not even "expired" ones.

6. **State what is not true.** Known gaps, failing thresholds and unimplemented features
   are documented openly. A wiki that hides them trains people to distrust it.

---

## Why rule 1 exists

An audit of the previous `docs/` tree compared every `SN-*` name mentioned in
documentation against the 45 tools the server actually registers.

**58 documented tool names do not exist.** Against 45 that do — more than half of the
documented tool surface was fiction.

| Source of the fiction | Count | Examples |
|---|---|---|
| Unimplemented Puppeteer proposal | 8 | `SN-Puppeteer-Create-Flow`, `SN-Puppeteer-Screenshot` |
| Aspirational Flow Designer tooling | ~20 | `SN-Create-Flow`, `SN-Execute-Flow`, `SN-Export-Flow` |
| Workflow tools never built | ~6 | `SN-Execute-Workflow`, `SN-Cancel-Workflow` |
| Catalog / knowledge / request tools | ~10 | `SN-List-CatalogueItems`, `SN-Search-Knowledge` |
| **Genuine drift from renames** | several | `SN-NL-Search` (real name: `SN-Natural-Language-Search`), `SN-Update-Incident`, `SN-Search-Incidents`, `SN-Sync-Script-To-Local`, `SN-Watch-Script` |

The drift group is the dangerous one. `SN-Sync-Script-To-Local` and `SN-Watch-Script`
are documented in `CLAUDE.md` with full worked examples, and the backing module
(`src/script-sync.js`) genuinely exists — but the tools were never registered. An agent
reading that documentation will confidently call a tool that is not there.

Going the other way: **0 implemented tools were undocumented.** The problem was purely
additive fiction.

This is why the tool page is generated. It cannot drift.

---

## Other inaccuracies corrected in this wiki

| Claim in old docs | Reality |
|---|---|
| "8 read-only MCP resources" | **2** are wired (`servicenow://instance`, `servicenow://tables/all`). The other 10 exist in `src/resources.js` but are not registered — see [MCP Resources](../03-Resources/MCP-Resources.md) |
| `npm start:http`, `npm start:stdio` | Do not exist. Use `npm start`, `npm run stdio` |
| "480+ tools" (CLAUDE.md), "34 tools", "40+ tools" | **45** |
| `SERVICENOW_AUTH_TYPE` selects an auth mode | Not implemented; only Basic auth exists |
| Setup guide credentials | A **real leaked credential** — see [Security Posture](Security-Posture.md#2-leaked-credential-) |

---

## Testing honesty

`npm test` passes: 244 tests, 10 suites. That number is not evidence the server works.

Coverage of `src/` is **~11%**. Before the current work it was 0.95%, and only one of
seven test files imported a production module at all — the rest asserted against mocks
and against logic reimplemented inside the test file itself.

| Module | Coverage |
|---|---|
| `config-manager.js` | 100% |
| `session-store.js` | 100% |
| `servicenow-client.js` | 6.9% |
| `mcp-server-consolidated.js` | 0% (2,897 lines) |
| `natural-language.js` | 0% |
| `resources.js` | 0% |

The 80% `coverageThreshold` is kept as a target, so `npm run test:coverage` **fails by
design**. That failure is an accurate signal. Do not silence it by lowering the
threshold.

The practical consequence: [`contract:verify` and `smoke:tools`](Frozen-Contract.md#the-two-checks)
are currently the only automated statement about whether this server behaves correctly,
which is why they are deliberately independent of Jest.

---

## Adding a page

1. Put it in the right numbered section.
2. Add it to [`_Sidebar.md`](../_Sidebar.md) and, if it is an entry point, to
   [`Home.md`](../Home.md).
3. Start with a `[← Home](../Home.md)` breadcrumb.
4. If it touches a tool name, endpoint, env var, the server name or the bin name,
   read [Frozen Contract](Frozen-Contract.md) and run `npm run contract:verify`.
