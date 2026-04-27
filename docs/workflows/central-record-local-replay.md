## Workflow: record in central env, replay locally

This workflow helps teams record API traffic once in a shared environment (staging/integration) and replay it locally in development or Playwright tests.

Result: faster local loops, fewer flaky dependencies, and less boilerplate around central environment setup.

### What this flow is for

- Capturing real client/network responses from a central environment.
- Reusing those responses as versioned JSON fixtures.
- Running local development and tests without always hitting shared APIs.

### Before you start

1. Download the latest released `dist.zip` from GitHub Releases.
2. Unzip it locally.
3. Load the unzipped folder in `chrome://extensions/` (`Developer mode` → `Load unpacked`).
4. Make sure your app can call the central/staging API from the browser.

### Step 1: Record against a central/shared environment

1. Open your app connected to the central environment.
2. Open the API Replay popup.
3. Click start recording, provide a clear recording name, and set URL filters (for example, `/api/users`, `/api/orders`).
4. Walk through only the scenario you care about (for example, login + dashboard load).
5. Stop recording.

Tips:

- Keep each recording focused on one user journey.
- Avoid recording broad filters that capture unrelated traffic.

### Step 2: Export the recording JSON

1. In the popup, export the recording.
2. Save it under `tests/fixtures/recordings/`.

Example naming pattern:

- `tests/fixtures/recordings/login-dashboard-success.json`
- `tests/fixtures/recordings/checkout-validation-error.json`

### Step 3: Curate and commit fixture

Before committing:

- Remove accidental noise if needed (unrelated calls, irrelevant payloads).
- Keep fixture names tied to behavior, not environment.
- Review JSON diff in PR like source code.

Then commit fixture with the related test updates.

### Step 4: Replay locally in Playwright tests

Use `applyRecordingMocks` from `tests/helpers/recording-mock.ts`.

```ts
import path from 'node:path';
import { test } from '@playwright/test';
import { applyRecordingMocks } from '../helpers/recording-mock';

test('runs with central-env fixture locally', async ({ context, page }) => {
  const recordingPath = path.resolve(
    process.cwd(),
    'tests/fixtures/recordings/login-dashboard-success.json'
  );

  const mock = await applyRecordingMocks(context, recordingPath, {
    fallbackMatching: true,
    strictUnmatched: true,
    debug: (message) => console.log(`[recording-mock] ${message}`)
  });

  try {
    await page.goto('http://localhost:3000');
    // Continue test assertions...
  } finally {
    await mock.dispose();
  }
});
```

### Step 5: Run local loop without central-env dependency

- Run app locally.
- Run Playwright tests with fixture replay.
- Iterate on UI behavior even when central APIs are unstable or unavailable.

### Option guidance

- `fallbackMatching: true`: useful when hosts differ between recording and local runs.
- `strictUnmatched: true`: fail fast in CI when unexpected calls appear.
- `debug`: inspect misses and quickly update fixture scope.

### Fixture scope and versioning best practices

- Prefer multiple small fixtures over one large catch-all fixture.
- Keep one fixture per scenario or acceptance path.
- Treat fixture updates as behavior changes; require review.
- Rotate fixtures when API contracts intentionally change.

### Capability boundary

This workflow is for client/network request mocking using exported recordings. It does not claim SSR recording support.

### Related docs

- `README.md`
- `docs/playwright-integration.md`
- `tests/helpers/recording-mock.ts`