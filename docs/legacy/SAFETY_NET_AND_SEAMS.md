# Safety Net and Migration Seams — 2026-04-27

> Legacy Onboarding Step 3 output. Defines behavior lock-in strategy before internal modernization.

## Critical Flow → Characterization Coverage Plan

| Flow | Current behavior source | Characterization target |
|---|---|---|
| Record by URL filter | `README.md` quick start + core capabilities | Unit/integration tests for capture filtering and persisted recording entries |
| Replay captured responses | `README.md` core capabilities | Integration tests for exact match + fallback behavior |
| Edit payload/status | `README.md` core capabilities | UI/service tests for edit persistence and replay output |
| Import/export recording JSON | `README.md` workflows + storage notes | Contract tests for schema compatibility and migration-safe import |
| Search/filter/toggle replay | `README.md` core capabilities | UI/state tests for query correctness and replay enable/disable behavior |

## Module Seams for Incremental Modernization

- `src/shared` is the contract boundary (types, message/storage schema) and should remain stable while internals evolve.
- `src/background` contains orchestration seams (`recorder`, `replayer`, `messaging`, `state-store`) for service extraction without rewriting popup UI first.
- `src/popup` should consume stable shared contracts; UI/state services can be refactored behind adapter-style boundaries.

## Refactor Guardrails

- No big-bang rewrite across all modules in one change set.
- Any behavior change to preserve-required quirks requires ADR and migration notes.
- Prioritize tests that lock observable behavior before touching implementation details.

## Deferred Risks Tracked

- `TECH_DEBT.md#TD-2026-04-27-001` — vulnerability backlog.
- `TECH_DEBT.md#TD-2026-04-27-002` — license outlier triage.
- `TECH_DEBT.md#TD-2026-04-27-003` — characterization coverage debt before modernization.