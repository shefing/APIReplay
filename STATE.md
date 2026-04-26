# STATE.md

> Living snapshot of the project. Updated after every significant action (AGENTS.md Rule 9).
> The **Session Continuity** block at the bottom is the contract for agent resume — keep it current or multi-agent collaboration breaks.

## Current Position

- **Stage:** 01-Goals
- **Entry door:** New  <!-- New | Existing (Legacy Step N) -->
- **Active plan:** (none yet — run `isdlc plan new`)
- **Last graduated gate:** (none)

## Recent Decisions

<!-- Append-only; link each entry to its ADR. Newest on top. -->

- 2026-04-26 — Project scaffolded with `isdlc init` — see `docs/adr/0000-record-architecture-decisions.md`.

## Deferred Issues

<!-- Things explicitly *not* being done now. Link TECH_DEBT.md entries or open issues. -->

- — — deferred because —. Tracked in —.

## Rules Learned This Session

<!-- Domain rules, constraints, or conventions discovered during execution. These are candidates for promotion to SPEC.md / QUIRKS.md / ADRs. -->

- — — evidence: —.

## Open Questions for the Human

- —

---

## Session Continuity

> This block is the single source of truth for "where are we?" Any agent reading this should be able to resume work without re-reading the whole repo.

- **Last action completed:** Project scaffolded
- **Next action expected:** Draft GOALS.md and first plan (Stage 01)
- **Blockers:** none
- **Files in flight (uncommitted or WIP):** none
- **Human confirmation required before proceeding?** Yes | No — Human must confirm before the first build.

<!--
  Guardrail: `isdlc state sync` may PREFILL this block from git + ADRs,
  but it must NEVER mark "Human confirmation required?" as No on behalf of the human.
-->
