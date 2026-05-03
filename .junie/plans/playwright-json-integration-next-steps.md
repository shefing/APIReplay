---
sessionId: session-260426-084638-op2m
isActive: false
---

# Requirements

### Overview & Goals
Define the next project step to let teams **reuse exported API Replay recording JSON files inside Playwright E2E tests** for deterministic API mocking.

### Scope
**In Scope**
- Add a reusable Playwright-side utility that loads a recording JSON and registers routes (`page.route` / `context.route`) from `recording.requests`.
- Support matching by method + URL (with optional fallback behavior aligned with extension replay logic).
- Respect per-request replay controls already present in recording schema (`enabled`, `status`, `responseBody`, headers).
- Add documentation and a TypeScript demo test showing end-to-end usage.

**Out of Scope**
- Replacing extension runtime replay flow.
- Cloud storage/sync for recordings.
- Full Playwright plugin packaging/publishing to npm (can be future step).

### Functional Expectations
- A user can export a recording from extension UI and commit JSON into test fixtures.
- In Playwright tests, one helper call wires mocks from that JSON.
- Disabled requests in JSON are skipped (fall through to real network).
- Missing matches can be configured to either continue network or fail test (strict mode).
- Usage is documented with copy-paste examples.

# Technical Design

### Current Implementation Context
- Recording contract already exists in `src/shared/recording.ts` (`Recording`, `RecordedRequest`, replay options).
- JSON normalization/parsing exists in `src/shared/schema.ts` (`normalizeRecording`).
- Import/export behavior currently lives in `src/popup/services/import-export.ts`.
- Replay matching/behavior reference exists in `src/background/replayer.ts`.
- Playwright setup already exists (`playwright.config.ts`, `tests/e2e/smoke.spec.ts`).

### Key Decisions
1. **Create a Node-safe adapter module for test runtime** (instead of reusing popup/browser-only code directly).
   - Keep helper in test-oriented path (e.g., `tests/helpers/recording-mock.ts`) first.
2. **Use shared schema normalization from `src/shared/schema.ts` where possible** to avoid diverging JSON parsing rules.
3. **Route registration at BrowserContext level** by default to cover popups/new pages in E2E flows.
4. **Expose explicit matching mode**: strict exact first, optional fallback (path-only) matching inspired by `src/background/replayer.ts`.

### Proposed Changes
- Add Playwright helper module (TS), for example:
  - `tests/helpers/recording-mock.ts`
  - API sketch:
```ts
export interface RecordingMockOptions {
  fallbackMatching?: boolean;
  strictUnmatched?: boolean;
  urlBase?: string;
}

export async function applyRecordingMocks(
  context: BrowserContext,
  recordingPath: string,
  options?: RecordingMockOptions
): Promise<{ dispose: () => Promise<void> }>;
```
- Implement internal indexing from `recording.requests` by method/url key similar to replayer keying.
- Convert stored response fields to Playwright `route.fulfill` payload:
  - `status`, `headers`, `body` (`responseBody`), content-type defaults.
- Skip requests marked `enabled === false`.
- Add debug logging hook for unmatched requests (useful in strict mode).

### File Targets
- `tests/helpers/recording-mock.ts` (new)
- `tests/e2e/smoke.spec.ts` or additional spec under `tests/e2e/` demonstrating fixture replay (new/updated)
- `README.md` (new section: "Use recordings in Playwright")
- `docs/` guide file (e.g., `docs/playwright-integration.md`) with workflow + examples
- Optional sample fixture under `tests/fixtures/recordings/*.json`

### Risks & Mitigations
- **Schema drift** between extension and test helper → use shared normalization (`normalizeRecording`) and add unit test fixture coverage.
- **Over-mocking hiding real regressions** → add strict/non-strict mode guidance in docs.
- **URL mismatch across environments** → support `urlBase`/path-based fallback matching.

# Testing

### Validation Approach
- Unit-test matching and response fulfillment mapping in helper logic.
- E2E demo test proving JSON-driven mock flow works in Playwright.

### Key Scenarios
- Exact method+URL match returns recorded response/status/body.
- Disabled request entry is not mocked.
- Fallback mode matches by path when host differs.
- Strict unmatched mode fails fast with actionable message.

### Test Changes
- Add unit tests for helper matching behavior (new `tests/unit/recording-mock.test.ts`).
- Add/update one Playwright E2E demo spec using a committed recording JSON fixture.
- Keep existing extension smoke test unchanged as baseline.

# Delivery Steps

### ✓ Step 1: Build a reusable Playwright recording-mock helper
A TypeScript helper can load API Replay JSON recordings and register Playwright network mocks.
- Create `tests/helpers/recording-mock.ts` with `applyRecordingMocks(context, recordingPath, options)`.
- Parse and normalize recording JSON using shared schema conventions from `src/shared/schema.ts`.
- Implement method+URL matching with optional fallback matching mode.
- Map recording response fields to `route.fulfill` and skip entries where `enabled === false`.

### ✓ Step 2: Add deterministic test fixtures and demo E2E usage
A runnable Playwright spec demonstrates JSON-driven API mocking end-to-end.
- Add a sample recording fixture under `tests/fixtures/recordings/`.
- Add/extend an E2E spec to apply mocks before page actions and assert mocked payload usage.
- Include both normal-match and fallback/strict-mode demonstration in test cases (or clearly documented example variant).

### ✓ Step 3: Document the developer workflow and migration path
Project docs clearly explain how to export recordings and consume them in Playwright tests.
- Update `README.md` with a concise "Playwright integration" section and minimal code snippet.
- Add `docs/playwright-integration.md` with step-by-step guide: export JSON, store fixture, apply helper, debug mismatches.
- Document best practices for stable CI usage (fixture versioning, strict mode recommendations, avoiding over-mocking).

### ✓ Step 4: Add confidence tests for helper behavior
Helper behavior is protected by automated tests for matching and edge cases.
- Add `tests/unit/recording-mock.test.ts` covering exact matches, fallback matching, disabled requests, and unmatched handling.
- Verify all quality gates still pass with new helper (`lint`, `typecheck`, `test`, and relevant E2E path).
- Ensure the helper API stays typed and backward-compatible with current recording schema fields.