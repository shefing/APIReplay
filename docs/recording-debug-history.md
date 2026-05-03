# Recording Reliability — Debug History

## Problem Statement
Some API calls are not being recorded. The user reports that certain URLs (e.g. `GET /api/meetings/future-meetings`, `POST /api/votes/voting-percentages`) are missing from recordings even though they appear in the browser's Network tab.

---

## What Was Tried (Chronological)

### v1.0.3 — Fix `btoa` crash during replay (Unicode)
- **Problem:** Replay crashed with `InvalidCharacterError: btoa` for responses containing Hebrew/Unicode.
- **Fix:** Replaced bare `btoa()` with `btoa(unescape(encodeURIComponent(str)))` in `replayer.ts`.
- **Result:** ✅ Replay Unicode crash fixed.

---

### v1.0.4 — Fix POST recording via `networkId`/`requestId` fallback
- **Problem:** POST requests (e.g. `voting-percentages`) were not being recorded.
- **Root cause hypothesis:** Chrome assigns different `networkId` vs `requestId` for some requests; the `Fetch.requestPaused` handler looked up `pendingRequests[networkId]` and found nothing.
- **Fix:** Added fallback: if `networkId` lookup fails, try `requestId`.
- **Result:** ❌ Still not working reliably.

---

### v1.0.6 — Move persistence into `Fetch.requestPaused`
- **Problem:** `Network.loadingFinished` is not reliably fired by Chrome when `Fetch.enable` interception is active.
- **Fix:** Moved `getResponseBody` + persist logic into `Fetch.requestPaused` handler directly.
- **Result:** ❌ Still not working for all requests.

---

### v1.0.7 — Synthesize request entry in `Fetch.requestPaused`
- **Problem:** When `Network.requestWillBeSent` didn't fire before `Fetch.requestPaused`, no `pendingRequests` entry existed and the request was silently dropped.
- **Fix:** `Fetch.requestPaused` now synthesizes a request entry from `params.request` when no pending entry is found.
- **Result:** ❌ Still not working.

---

### v1.0.8 — Revert to pure `Network.*` flow (drop `Fetch.enable`)
- **Problem:** The entire `Fetch.enable` approach was unreliable for large bodies.
- **Fix:** Removed `Fetch.enable` entirely. Recorder reverted to the pre-refactor v0.1 flow:
  - `Network.requestWillBeSent` → store pending request
  - `Network.responseReceived` → fetch body via `Network.getResponseBody`
  - `Network.loadingFinished` → cleanup
  - POST bodies fetched via `Network.getRequestPostData` when not inlined
- **Result:** ✅ Large POST recording improved, but GETs still dropped on busy pages.

---

### v1.0.9 — Serialize event handlers (fix race condition)
- **Problem:** On busy pages, concurrent `Network.*` events raced on `chrome.storage.session` reads/writes, causing handlers to overwrite each other's `pendingRequests`/`recordedData`.
- **Fix:** All `onRecorderEvent` calls serialized through a per-process promise queue; state re-read immediately before each patch.
- **Result:** ✅ Concurrency fixed, but some requests still missing.

---

### v1.0.10 — Match replay by method + pathname
- **Problem:** Replay matched only by pathname, so GET and POST on the same path collided.
- **Fix:** Matcher now requires HTTP method to match in addition to pathname.
- **Result:** ✅ Replay matching improved.

---

### v1.0.11 — Persist in `responseReceived`, not `loadingFinished`
- **Problem:** After stopping recording, only POST requests appeared in the saved list even though all requests were visible live.
- **Root cause:** `Network.loadingFinished` is not reliably fired for cached/304/streamed responses.
- **Fix:** Moved `getResponseBody` + persist into `Network.responseReceived`.
- **Result:** ✅ More requests saved, but still not all.

---

### v1.0.12 — Fix `currentRecordingApis` ReferenceError + drain queue on stop
- **Problem:** Record tab showed truncated list after stopping; live updates never worked.
- **Fix:** (1) Declared missing `currentRecordingApis = new Set<string>()` in popup. (2) `stopRecording` now awaits the recorder event queue before detaching debugger.
- **Result:** ✅ UI fixed.

---

### v1.0.18 — Swallow debugger detach errors
- **Problem:** `Uncaught Error: Detached while handling command` during replay.
- **Fix:** All `chrome.debugger.sendCommand` calls routed through `safeSendCommand` helper that swallows detach errors.
- **Result:** ✅ Replay error fixed.

---

### v1.0.19 (current, not released) — Unique timestamp-based keys
- **Problem:** When the same endpoint was called multiple times, only the last response was kept (key collision).
- **Fix:** `requestKey` now appends a timestamp: `GET /api/config [200] 2026-05-03T...`
- **Result:** ❓ Not yet confirmed working by user.

---

## Current State of `recorder.ts`

The recorder uses the pure `Network.*` flow:
1. `Network.requestWillBeSent` → stores `{ url, method, headers, postData?, timestamp }` in `pendingRequests[requestId]`
2. `Network.responseReceived` → calls `Network.getResponseBody`, builds the recorded entry, persists to storage
3. `Network.loadingFinished` → cleans up `pendingRequests[requestId]`

All handlers are serialized through a promise queue to prevent race conditions.

---

## What Still Doesn't Work

The user reports that `GET /api/meetings/future-meetings` (and possibly other URLs) are **still not being recorded** even after all the above fixes.

---

## Hypotheses Not Yet Tried

1. **`Network.requestWillBeSent` not firing for some requests** — Chrome may not fire this event for requests that are served from cache, or for requests initiated by service workers. If the event never fires, no `pendingRequests` entry is created and `responseReceived` silently skips the request.

2. **`Network.getResponseBody` failing silently** — For large responses or streaming responses, `getResponseBody` may return an error or empty body. The current code may not handle this error path correctly.

3. **Filter mismatch** — The recording filter (default `/api`) may not match some URL patterns. Worth logging which URLs pass/fail the filter check.

4. **Tab ID mismatch** — If the request comes from a different frame or worker, the `tabId` used to attach the debugger may not match.

5. **Timing: `responseReceived` fires before body is available** — `getResponseBody` called immediately in `responseReceived` may fail for large bodies; `loadingFinished` is the correct time to call it.

---

## Recommended Next Steps

1. **Add logging** to `responseReceived` and `requestWillBeSent` to see exactly which URLs are seen vs. skipped.
2. **Compare with v0.1** more carefully — check if v0.1 calls `getResponseBody` in `loadingFinished` (not `responseReceived`).
3. **Try calling `getResponseBody` in `loadingFinished`** with a fallback to `responseReceived` if `loadingFinished` never fires.
4. **Check the filter logic** — log every URL that arrives at `requestWillBeSent` and whether it passes the filter.
