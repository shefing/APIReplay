# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project adheres to Semantic Versioning.

## [1.0.18] - 2026-05-03
### Fixed
- Replay no longer logs `Uncaught (in promise) Error: Detached while handling command` when the debugger detaches mid-flight (tab navigated/closed, replay stopped, or service worker recycled). All `chrome.debugger.sendCommand` calls in `src/background/replayer.ts` are now routed through a `safeSendCommand` helper that swallows detach-related errors. After a latency wait, replay state is re-checked before sending the response so we don't try to fulfill on a detached debugger.

## [1.0.17] - 2026-05-03
### Changed
- Captured Requests table now auto-sizes columns (▶ / Status / Method shrink to content; Path takes the remaining width with truncation + full-URL tooltip) so nothing overflows the popup.
- Removed the per-row match indicator (●) column. The match indicator was unreliable — some matched URLs were not flagged — so it's been disabled until the matcher is fixed; the matched-row green tint is also gone.

## [1.0.16] - 2026-05-03
### Changed
- Captured Requests table column order is now **▶ | Status | Method | ● | Path**, so Status is right after the include toggle and Path expands to fill the remaining width.
- Replay hit count is now shown inside the Status badge as `200 (3)` instead of as a separate column, making the table more compact and clearer.
### Fixed
- Per-row match indicator (●) and hit count now update live during replay. The popup listens to `chrome.storage.session` changes for `replayStats`, so each captured replay hit immediately re-renders the row (previously the table only refreshed on `recordingUpdated`/`newApiCall` messages, which the replayer doesn't send).

## [1.0.15] - 2026-05-03
### Changed
- Removed the Replay stats panel (Matched / Unmatched / Recent unmatched). The per-row green ● match indicator on the API requests list is now the single source of truth.
- Replay configuration (fallback matching, latency, latency range, URL mappings) is collapsed under a toggleable **Advanced settings** `<details>` block in the Replay tab to reduce vertical clutter.
- Captured Requests table is now fixed-layout: long URLs are truncated in the **Path** cell with the full URL shown on hover via a `title` tooltip.
- **Status** column is now a colored circular badge (green 2xx / blue 3xx / amber 4xx / red 5xx / gray for none); click the badge to edit the status. The numeric value is in the tooltip.
- **Hits** column is now a small colored pill badge with the hit count and a descriptive tooltip.

## [1.0.14] - 2026-05-03
### Changed
- Replay status indicator moved above the Record/Replay tab buttons so the current state is visible regardless of the active tab.
- Per-request match indicator: each row in the API requests list now shows a green ● when it has been matched at least once during the current replay (gray when not yet matched, faded when not replaying). Matched rows are highlighted with a subtle green tint. Replaces the previous reliance on the global Matched/Unmatched stats which under-counted because of de-duplication by path.

## [1.0.13] - 2026-05-03
### Changed
- Replay stats now only count requests within the recording's URL filter (e.g. `/api`). Out-of-scope analytics calls (e.g. `/ingest/*`) no longer pollute Matched/Unmatched counters.
- "Unmatched" stat is de-emphasized in the popup; "Recent unmatched" is hidden when there are no in-scope unmatched requests.

### Added
- When opening the popup while replay is in progress, the Replay tab is now focused automatically and the popup body is visually marked (blue tint + border) to indicate replay mode.

## [1.0.12] - 2026-05-03
### Fixed
- Record tab now shows the full request list right after stopping recording. Two issues caused it to look "still filtered" while the replay/review tab showed everything: (1) the popup's `newApiCall` live-update listener referenced an undeclared `currentRecordingApis` set and threw on every captured request, so the record-tab list was never updated live; (2) `stopRecording` detached the debugger before the recorder's event queue had a chance to drain, so any `responseReceived` handlers still mid-flight were cancelled. Now the popup declares `currentRecordingApis` properly, and `stopRecording` awaits the recorder queue before detaching.

## [1.0.11] - 2026-05-03
### Fixed
- Recording now persists requests from `Network.responseReceived` (matching the working v0.1 flow) instead of only from `Network.loadingFinished`. Chrome does not reliably fire `loadingFinished` for some responses (cached, 304 Not Modified, streamed), which previously caused most GETs to be silently dropped — only the POST would survive in the saved recording even though all requests appeared live during recording.
### Added
- Regression test in `tests/unit/recorder.test.ts` covering the case where `Network.loadingFinished` never fires after `responseReceived`.

## [1.0.10] - 2026-05-03
### Fixed
- Replay now matches recorded requests by **HTTP method + pathname**, not pathname alone. Previously, when a recording contained both a GET and a POST on the same path (e.g. `/api/items`), only the entry that happened to come first in iteration order was returned for every incoming request — which on busy pages typically meant POSTs replied to GETs and vice‑versa. The fallback (length-based) matcher also now requires method to match.
### Added
- Regression tests in `tests/unit/replayer.test.ts`: an incoming GET selects the GET-recorded response (not the POST) for the same path, and a method mismatch falls through to `continueRequest`.

## [1.0.9] - 2026-05-03
### Fixed
- Recording now reliably captures **all** requests on busy pages, not just the first/last. Concurrent network events (`requestWillBeSent` / `responseReceived` / `loadingFinished`) were racing on `chrome.storage.session` reads/writes, causing handlers to overwrite each other's `pendingRequests` and `recordedData` and silently drop most GET requests. The recorder now serializes all events through a per-process promise queue and re-reads the latest state immediately before each `patch`.
### Added
- Regression test `records all of many concurrent GET requests (no lost updates)` in `tests/unit/recorder.test.ts` that interleaves N parallel request lifecycles against an async store.

## [1.0.8] - 2026-05-03
### Fixed
- Recording now reliably captures large POST requests (e.g. `/api/votes/voting-percentages`). Removed `Fetch.enable` interception from the recording flow; recording now uses pure `Network.*` debugger events (`requestWillBeSent` → `responseReceived` → `loadingFinished`) and `Network.getResponseBody`, matching the working pre-refactor v0.1 behavior. POST bodies that Chrome does not inline are fetched via `Network.getRequestPostData`.
### Changed
- `tests/unit/recorder.test.ts` updated to cover the new `Network.*` flow, including the large-POST regression scenario and UTF-8-safe base64 decoding.

## [1.0.7] - 2026-05-03
### Fixed
- POST requests are now reliably recorded even when Chrome does not fire `Network.requestWillBeSent` before `Fetch.requestPaused` (or fires it with a non-matching id). The Fetch handler now synthesizes a request entry from `params.request` when no pending entry exists, applying the recording's URL filter.

### Added
- Unit tests for the recorder (`tests/unit/recorder.test.ts`) covering: POST recorded with no prior `Network.requestWillBeSent`, URL-filter exclusion of non-`/api` requests, and matching by `networkId` when the pending entry exists.

## [1.0.6] - 2026-05-03
### Fixed
- POST requests (and other requests with large bodies) no longer silently disappear from recordings. The root cause was that Chrome does not reliably fire `Network.loadingFinished` when Fetch interception is active; requests are now persisted directly inside the `Fetch.requestPaused` handler as soon as the response body is available.
- Response status and headers are now captured from `Fetch.requestPaused` params as a fallback when `Network.responseReceived` has not yet fired.
- POST request bodies (`postData`) are now stored in the recording for future reference.

## [1.0.5] - 2026-05-03
### Fixed
- Editing popup now correctly renders non-Latin1 characters (e.g. Hebrew, Arabic, Chinese) in response bodies that were recorded before v1.0.4 and stored as raw base64.

## [1.0.4] - 2026-05-03
### Fixed
- Recording no longer silently drops response bodies for POST requests where Chrome assigns a different `networkId` vs `requestId` in the Fetch/Network debugger events (fallback key resolution added).
- Base64-encoded response bodies containing UTF-8 characters are now correctly decoded during recording (replaced bare `atob` with `decodeURIComponent(escape(atob(...)))`).

## [1.0.3] - 2026-05-03
### Fixed
- Unicode characters in recorded response bodies no longer cause `btoa` errors during replay (replaced bare `btoa` with a UTF-8-safe base64 encoder).

## [1.0.2] - 2026-05-03
### Added
- URL path prefix mapping for cross-environment replay: record on staging (e.g. `/microservice1/api/users`), replay locally (e.g. `/api/users`) using the new **URL Mappings** field in the Replay tab.
- Mappings are persisted with each recording's replay options and restored on selection.
- README workflow documentation for the central-record / local-replay use case.

## [1.0.1] - 2026-04-26

### Added
- In-progress recorded URLs preview in the `Record` tab for live visibility while capturing traffic.

### Changed
- Popup usability refinements with clearer `Record` / `Preview` workflow separation and tab-state behavior improvements.

### Fixed
- Popup replay/preview interaction stability improvements to keep request inspection and control flows consistent.

## [1.0.0] - 2026-04-26

### Added
- Vite + CRX + TypeScript production toolchain with lint, typecheck, build and packaging scripts.
- Modular MV3 background architecture with dedicated recorder/replayer/messaging/state/logger modules.
- Versioned, UUID-keyed recording schema with migration and validation paths.
- Popup UX improvements: presets, request search, replay enable toggles, inline status edit, latency controls, replay stats, and keyboard shortcut support.
- Unit tests with Vitest and extension smoke E2E with Playwright.
- CI and release workflows for reproducible extension artifacts.
