## Playwright integration with exported recordings

This guide explains how to use exported `API Replay` recording JSON files as deterministic API mocks in Playwright tests.

### 1) Export and store a recording fixture

1. Use extension UI to export a recording JSON.
2. Commit it under `tests/fixtures/recordings/`.

Example fixture path used in this repo:

- `tests/fixtures/recordings/playwright-demo-recording.json`

### 2) Apply mocks in a Playwright test

Use the helper from `tests/helpers/recording-mock.ts`.

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
    strictUnmatched: false
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

### 3) Matching behavior

- Exact mode (default): method + full URL must match.
- Fallback mode (`fallbackMatching: true`): method + path/query fallback when host differs.
- Disabled entries (`enabled === false`) are skipped and continue to real network.

### 4) Strict unmatched mode

When `strictUnmatched: true`, unmatched requests throw with a clear error:

- `No recording match for <METHOD> <URL>`

Use this in CI when tests should fail on unexpected traffic.

### 5) Debug unmatched requests

Pass `debug` callback to inspect misses without failing:

```ts
await applyRecordingMocks(context, recordingPath, {
  debug: (message) => console.log(`[recording-mock] ${message}`)
});
```

### Best practices for stable CI

- Keep fixtures versioned in git and review JSON diffs in PRs.
- Start with non-strict mode while stabilizing tests, then move to strict mode in CI.
- Avoid over-mocking entire domains; keep fixtures focused on required flows.
- Prefer explicit fixture names tied to scenarios (for example, `checkout-success.json`).
