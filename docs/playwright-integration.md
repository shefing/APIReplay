## Playwright integration with exported recordings

This guide shows how to replay exported `API Replay` JSON recordings as deterministic client/network mocks in Playwright.

Use this flow when you want realistic browser `fetch` behavior in tests without depending on a live central environment.

### When to use this vs extension replay

- Use extension replay for manual local debugging in the browser.
- Use Playwright replay (`applyRecordingMocks`) for automated tests and CI.

Both flows can share the same exported recording JSON fixture.

### 1) Export and store a recording fixture

1. Use the extension UI to export a recording JSON.
2. Save it under `tests/fixtures/recordings/`.
3. Commit it so everyone runs against the same API fixture.

Example fixture path used in this repo:

- `tests/fixtures/recordings/playwright-demo-recording.json`

### 2) Apply mocks in a Playwright test

Use `applyRecordingMocks` from `tests/helpers/recording-mock.ts`.

```ts
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { applyRecordingMocks } from '../helpers/recording-mock';

test('reuses recording JSON in Playwright', async ({ context, page }) => {
  const recordingPath = path.resolve(
    process.cwd(),
    'tests/fixtures/recordings/playwright-demo-recording.json'
  );

  const mock = await applyRecordingMocks(context, recordingPath, {
    fallbackMatching: true,
    strictUnmatched: false,
    debug: (message) => console.log(`[recording-mock] ${message}`)
  });

  try {
    const result = await page.evaluate(async () => {
      const response = await fetch('https://api.example.com/users/me');
      return {
        status: response.status,
        body: await response.json()
      };
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: 'u_123', name: 'API Replay' });
  } finally {
    await mock.dispose();
  }
});
```

### 3) Matching behavior and option trade-offs

`applyRecordingMocks(context, recordingPath, options)` supports these matching controls:

- Exact matching (default): matches by `method + full URL`. Best for strict determinism.
- Fallback matching (`fallbackMatching: true`): if exact host does not match, falls back to `method + path + query`. Useful when recording on staging but replaying on local hosts.
- Disabled entries (`enabled === false` in recording JSON): skipped and allowed through to real network.
- URL host remapping (`urlBase`): rewrites fixture host/protocol before indexing, useful when migrating between environments with the same API paths.

### 4) Unmatched behavior (`strictUnmatched`)

When no fixture entry matches a request:

- `strictUnmatched: false` (default behavior): request continues to real network.
- `strictUnmatched: true`: throws `No recording match for <METHOD> <URL>` and fails the test.

Suggested rollout:

1. Start with non-strict mode while creating fixtures.
2. Move to strict mode in CI once flows are stable.

### 5) Troubleshooting with `debug`

Use `debug` to understand misses quickly without turning on strict mode:

```ts
await applyRecordingMocks(context, recordingPath, {
  fallbackMatching: true,
  strictUnmatched: false,
  debug: (message) => console.log(`[recording-mock] ${message}`)
});
```

Common debug output examples:

- `No recording match for GET https://...` → fixture is missing or URL/method changed.
- Frequent misses with different host only → enable `fallbackMatching` or set `urlBase`.
- Intermittent real-network calls → check if recording entries are disabled.

### Best practices for stable CI

- Keep fixtures versioned in git and review JSON diffs in PRs.
- Prefer fixture files scoped to user journeys (for example, `checkout-success.json`).
- Avoid over-mocking entire domains; keep recordings focused on the flow under test.
- Pair this guide with `docs/workflows/central-record-local-replay.md` for a full record-once, replay-everywhere workflow.
