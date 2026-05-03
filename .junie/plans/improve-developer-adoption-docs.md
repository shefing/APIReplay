---
sessionId: session-260426-221758-1o83
isActive: false
---

# Requirements

### Overview & Goals
Improve APIReplay’s developer adoption by turning the current docs set into a practical onboarding path focused on **real client-fetch mocking workflows** and stronger **zero-boilerplate DX messaging**.

### Scope
#### In Scope
- Restructure `README.md` into a clearer “install → first run → core workflows” path.
- Add/expand documentation for **client-side fetch mocking** (not SSR recording) using existing Playwright integration utilities.
- Add a concrete “record from central environment, replay locally” flow with minimal setup steps.
- Refresh messaging consistency between `README.md`, `COMPARISON.md`, and docs pages.

#### Out of Scope
- Implementing new recorder/replayer runtime features.
- Adding SSR recording claims.
- Building Payload CMS integration unless explicitly prioritized later.

### Functional Requirements
- README must include:
  - concise value proposition,
  - setup commands from `package.json` scripts,
  - quick start for extension usage,
  - a practical workflow entry point to Playwright/client fetch mocking docs.
- Documentation must explicitly clarify current capability boundary: client/network request mocking flows are supported; SSR recording is not positioned as a current feature.
- A real-world flow must show:
  - recording against a shared/central env,
  - exporting fixture JSON,
  - replaying locally or in test runs without central-env dependency.
- DX messaging must emphasize reduced infrastructure/tooling overhead and no context switching.

### Non-Functional Requirements
- Keep docs accurate to existing code paths and scripts.
- Keep language concise and developer-oriented (copy/paste commands, concrete examples).

# Technical Design

### Current Implementation
- `README.md` already covers architecture and basic development commands, plus a short Playwright snippet.
- `docs/playwright-integration.md` documents exported recording reuse via `tests/helpers/recording-mock.ts` and its options (`fallbackMatching`, `strictUnmatched`, `debug`).
- `tests/helpers/recording-mock.ts` is the canonical implementation for client fetch replay in tests:
  - `applyRecordingMocks(context, recordingPath, options)`
  - exact/fallback matching indexes
  - unmatched behavior and strict failure mode.
- Background extension behavior is centered in `src/background/main.ts` (record/replay lifecycle via messages and command toggle), which should be reflected in user-facing flow descriptions.

### Key Decisions
1. **Client-fetch-first positioning (recommended by code reality):** Documentation will avoid SSR-recording claims and instead anchor on existing request replay behavior.
2. **Workflow-first docs structure:** README becomes a navigator to specific guides (especially Playwright/client-fetch flow) instead of trying to embed all details inline.
3. **No new feature promises:** Messaging updates will map strictly to shipped capabilities visible in `README.md`, `docs/playwright-integration.md`, and helper APIs.

### Proposed Changes
- Rework `README.md` sections to:
  - lead with explicit product identity (Chrome extension for recording/replaying API traffic),
  - add “Quick start in ~5 minutes,”
  - add “Common workflows” linking to detailed docs.
- Expand `docs/playwright-integration.md` with a stronger end-to-end narrative for client fetch mocking and clearer option trade-offs.
- Add a dedicated workflow doc (e.g., `docs/workflows/central-record-local-replay.md`) describing:
  - central env recording,
  - fixture curation/versioning,
  - local replay/test execution using `applyRecordingMocks`.
- Update `COMPARISON.md` phrasing where needed so market messaging does not conflict with product reality.

### File Structure
- **Modify** `README.md`
- **Modify** `docs/playwright-integration.md`
- **Add** `docs/workflows/central-record-local-replay.md` (or similarly named path under `docs/`)
- **Optionally modify** `COMPARISON.md` for claim alignment

### Risks
- **Risk:** Over-marketing beyond implemented capabilities.
  - **Mitigation:** Tie each claim to existing scripts/APIs/files.
- **Risk:** Confusion between extension replay and Playwright helper replay.
  - **Mitigation:** Add explicit “when to use which flow” subsection and cross-links.

# Testing

### Validation Approach
- Verify all commands and paths in docs map to real project artifacts (`package.json` scripts, existing helper files, fixture paths).
- Ensure examples remain consistent with `tests/helpers/recording-mock.ts` signatures and option names.

### Key Scenarios
- New developer can follow README to install, build, and load unpacked extension.
- Developer can follow docs to export a recording and replay it in Playwright client-fetch tests.
- Developer can understand the central-record/local-replay workflow without inferring unsupported SSR behavior.

### Edge Cases
- Broken links between README and docs pages.
- Stale file path references (e.g., fixture/helper paths).
- Ambiguous wording that implies new runtime features not present in code.

# Delivery Steps

### ✓ Step 1: Restructure README into a workflow-driven onboarding guide
README provides a clear first-run path and entry points to practical workflows.

- Reorganize `README.md` around: value proposition, quick start commands, extension usage basics, and links to deeper guides.
- Ensure commands and lifecycle steps align with `package.json` scripts and Chrome extension load flow.
- Add a capability boundary note clarifying that the documented integration path is client fetch mocking, not SSR recording.

### ✓ Step 2: Strengthen Playwright/client-fetch documentation with concrete usage patterns
Playwright integration docs clearly describe how to replay recorded responses for client fetch flows.

- Update `docs/playwright-integration.md` to better explain exact vs fallback matching and strict unmatched behavior.
- Align examples with `tests/helpers/recording-mock.ts` API (`applyRecordingMocks`, options, dispose lifecycle).
- Add clearer troubleshooting/debug guidance using the existing `debug` callback behavior.

### ✓ Step 3: Add a real-world central-record → local-replay workflow guide
A new docs page demonstrates recording in a shared environment and replaying locally with minimal boilerplate.

- Create `docs/workflows/central-record-local-replay.md` (path/name can follow existing docs conventions).
- Document step-by-step flow: capture traffic, export JSON, commit fixture, run local replay in tests/dev loops.
- Include best-practice notes on fixture scope/versioning and reducing dependency on central environments.

### ✓ Step 4: Align market-facing comparison messaging with actual capability scope
Comparison copy stays compelling while remaining technically accurate.

- Review `COMPARISON.md` claims against current product behavior and docs wording.
- Adjust phrasing where necessary to avoid implying unsupported SSR recording.
- Keep DX emphasis on no context switching, low infra overhead, and reproducible local flows.