# Legacy Discovery — 2026-04-27

> Output of Legacy Onboarding Step 1 (see LEGACY_ONBOARDING.md §Step 1).
> Fill each section with links to generated artifacts, not raw dumps.

## Repo Ingestion
- [x] Ingested with: local repository walk + targeted file analysis (`README.md`, `CONTRIBUTING.md`, `src/` module map, onboarding artifacts)
- [x] Summary: APIReplay is an active Chrome MV3 extension focused on recording/replaying network traffic with JSON fixture export/import and Playwright reuse. Current delivery quality gates are stable (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) and should remain operational during onboarding.

## Codebase Understanding
- [x] Call graph: documented at high level in `README.md` under Architecture overview and mapped to module responsibilities in Step 3 planning.
- [x] Module dependency map: `src/background` (service-worker orchestration) ↔ `src/shared` (contracts/storage schema), and `src/popup` (UI/state/import-export) ↔ `src/shared`.
- [x] Hotspot analysis (CodeScene / Sourcegraph): not run with external SaaS tools in onboarding; risk hotspots inferred from feature-critical surfaces (record/replay matching, storage migration, import/export compatibility).

## Synthetic Personas
- [x] Personas drafted: documented below as migration-driving personas.
  - Persona A: frontend developer needing deterministic API behavior while central env is unstable.
  - Persona B: QA/automation engineer reusing exported recordings in Playwright flows.
  - Persona C: maintainer preserving backward compatibility of stored recordings and replay semantics.

## End-User Knowledge Capture
- [ ] Power-user interviews conducted: not yet; currently inferred from existing docs/workflows and prior usage assumptions.
- [x] QUIRKS.md populated: see `QUIRKS.md` for initial preserve-required legacy behaviors.

## Strategic Intent Recovery
- [x] Deep-research summary: intent recovered from `README.md` and workflow docs (`docs/workflows/central-record-local-replay.md`, `docs/playwright-integration.md`) plus current script/tooling constraints.
- [x] Original business-goal alignment: continue enabling low-overhead "record once, replay anywhere" workflows while adding governance, security baseline visibility, and migration safety without a big-bang rewrite.
