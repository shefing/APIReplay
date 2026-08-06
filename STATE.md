# STATE.md

> Living snapshot of the project. Updated after every significant action (AGENTS.md Rule 9).
> The **Session Continuity** block at the bottom is the contract for agent resume — keep it current or multi-agent collaboration breaks.

## Current Position

- **Stage:** 00-LegacyOnboarding
- **Entry door:** Existing (Legacy Step 4)
- **Active plan:** `.junie/plans/migrate-apireplay-to-isdlc.md` (Step 4)
- **Last graduated gate:** Legacy Step 3 (safety net + seams)

## Recent Decisions

<!-- Append-only; link each entry to its ADR. Newest on top. -->

- 2026-04-27 — Adopted steady-state iSDLC contributor loop and merge readiness criteria (`isdlc plan/adr/debt/state/doctor` + npm quality gates) in `README.md` and `CONTRIBUTING.md`.
- 2026-04-26 — Legacy disposition accepted as Retain with incremental modernization path — see `docs/adr/0000-disposition-legacy-system.md`.

## Deferred Issues

<!-- Things explicitly *not* being done now. Link TECH_DEBT.md entries or open issues. -->

- Resolve dependency vulnerability backlog captured in `docs/legacy/SECURITY_BASELINE.md` and `docs/legacy/sbom.cdx.json`. Tracked in `TECH_DEBT.md`.

## Rules Learned This Session

<!-- Domain rules, constraints, or conventions discovered during execution. These are candidates for promotion to SPEC.md / QUIRKS.md / ADRs. -->

- Merge readiness must include both governance (`isdlc doctor`) and product checks (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) — evidence: `README.md`, `CONTRIBUTING.md`.
- Agent execution should prefer MCP reads/writes (`isdlc_getStage`, `isdlc_getPlan`, `isdlc_updateState`, etc.) when server is configured — evidence: `TOOLING.md`.

## Open Questions for the Human

- Should we commit `.junie/mcp.json` as the canonical team-level Junie MCP configuration in this repository?

---

## Session Continuity

> This block is the single source of truth for "where are we?" Any agent reading this should be able to resume work without re-reading the whole repo.

- **Last action completed:** Step 4 workflow docs aligned to iSDLC daily loop and merge gates.
- **Next action expected:** Confirm team-level MCP config decision, then run `isdlc doctor` + npm checks and mark migration Step 4 complete.
- **Blockers:** none
- **Files in flight (uncommitted or WIP):** `README.md`, `CONTRIBUTING.md`, `TOOLING.md`, `STATE.md`, `.junie/plans/migrate-apireplay-to-isdlc.md`.
- **Human confirmation required before proceeding?** Yes — confirm whether `.junie/mcp.json` should be committed for team use.

<!--
  Guardrail: `isdlc state sync` may PREFILL this block from git + ADRs,
  but it must NEVER mark "Human confirmation required?" as No on behalf of the human.
-->
