---
sessionId: session-260426-084638-op2m
isActive: false
---

# Requirements

### Overview & Goals
Make APIReplay production-ready while improving key user flows (presets, search, replay controls) without breaking existing behavior.

### Current Status
- ✅ Toolchain/bootstrap completed (Vite + CRX + TypeScript + lint/typecheck/build).
- ✅ Background modularization completed (`main.ts`, `recorder.ts`, `replayer.ts`, `messaging.ts`, `state-store.ts`, `logger.ts`).
- 🔄 Next focus is storage schema migration + popup refactor + UX features + tests + CI/docs.

### In Scope
- Migrate storage to namespaced/versioned UUID-keyed recordings.
- Refactor popup monolith into typed components/services.
- Add user-flow improvements: presets, search, per-request enable/disable, latency, replay summary, shortcut.
- Add automated tests and CI/release pipeline.
- Finalize docs and Chrome Web Store readiness artifacts.

### Out of Scope
- Backend/cloud sync.
- Cross-browser ports (Firefox/Edge).

# Technical Design

### Current Implementation (verified)
- `src/manifest.json` now points to `src/background/main.ts` as MV3 module service worker.
- Background logic split across `src/background/{main,recorder,replayer,messaging,state-store,logger}.ts`.
- Reload loop regression in recording flow was fixed by changing `onTabReload` in `src/background/recorder.ts` to observer-only logging.
- Popup remains mostly monolithic in `src/popup/main.ts` and still needs decomposition.
- Storage still uses legacy per-recording-name keys in several flows and needs schema migration.

### Key Decisions
1. Keep MV3 stateless-worker pattern via `StateStore` hydration/patch APIs.
2. Introduce versioned `Recording` contract and migration layer before adding UX features.
3. Implement popup feature slices as components/services (not more monolithic growth).
4. Add tests in parallel with each feature slice (unit-first, plus one extension E2E smoke).

### Proposed Changes
- Add `src/shared/{recording,schema,messages}.ts` for typed contracts and validation.
- Implement one-shot migration to `recordings: Record<uuid, Recording>` with `schemaVersion`.
- Split popup into:
  - `components/{Toolbar,RecordingsList,ApiPreview,ResponseEditor,PresetsModal,ReplayStatsPanel}`
  - `services/{storage,import-export}`
- UX features:
  - Preset CRUD (`settings.presets`) + preset selector
  - Request search/filter in recording view
  - Per-request enabled flag for replay
  - Replay latency options (`latencyMs` / `latencyRange`)
  - Replay stats (matched/unmatched/hit count)
  - `commands.toggle-recording` keyboard shortcut
- CI/docs/release:
  - GitHub Actions CI + release workflows
  - changelog, contributing, security/privacy docs, store listing assets

# Testing

### Validation Approach
- Continue running `npm run lint`, `npm run typecheck`, `npm run build` on every slice.
- Add Vitest tests for migration, schema validation, replay matching/controls, presets.
- Add one Playwright smoke test loading built extension from `dist/`.

### Key Scenarios
- Record/replay core flow remains functional after migration.
- Malformed import rejected with no storage mutation.
- Disabled request entries fall through to network.
- Latency options delay mocked responses as configured.
- Replay stats update while replaying.
- Shortcut toggles recording state reliably.

# Delivery Steps

### ✓ Step 1: Complete storage schema migration and shared contracts
Recordings are stored in a versioned UUID-keyed schema with compatibility for legacy data.
- Add typed shared contracts (`Recording`, `RecordedRequest`, `ReplayOptions`, message types) under `src/shared/`.
- Implement migration from legacy per-name keys to `recordings` map with `schemaVersion`.
- Ensure migration is idempotent and wired early in extension startup paths.
- Add schema validation for imports before persisting migrated/new recordings.

### ✓ Step 2: Refactor popup into components and storage services
Popup logic is split into maintainable components/services without changing baseline behavior.
- Extract UI slices from `src/popup/main.ts` into dedicated components.
- Introduce `services/storage.ts` and `services/import-export.ts` for data operations.
- Rewire popup state/update flow to use typed contracts and migrated storage model.
- Keep existing user-visible record/replay/edit flows intact during refactor.

### ✓ Step 3: Implement user-flow improvements (presets, search, replay controls)
Users gain faster, safer replay workflows with presets and granular control.
- Add preset CRUD (`settings.presets`) and last-used preset selection in toolbar.
- Add request search/filter by URL/method/status in recording details.
- Add per-request enable/disable and quick status-edit controls used by replayer.
- Add optional replay latency configuration and session replay stats panel.
- Add manifest command + background handler for keyboard recording toggle.

### ✓ Step 4: Add automated tests for migrated model and replay behavior
Critical flows are covered by unit tests and one extension smoke E2E.
- Add Vitest tests for migration, schema validation, router dispatch, replay matching/fallback, presets.
- Add tests for per-request disable and latency behavior.
- Add Playwright smoke test that loads extension, records one request, and verifies persisted recording.
- Ensure tests are runnable via npm scripts and stable in CI environment.

### ✓ Step 5: Ship CI/CD and release-readiness documentation
Repository is ready for repeatable production builds and Chrome Web Store submission.
- Add GitHub Actions CI pipeline (lint/typecheck/test/build + `dist.zip` artifact).
- Add release workflow for tag-based packaged extension publication.
- Finalize project docs (`CHANGELOG`, `CONTRIBUTING`, `SECURITY`, `PRIVACY`, updated `README`).
- Add `docs/store/` assets/copy and permission rationale checklist.