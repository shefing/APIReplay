# API Replay

API Replay is a Chrome MV3 extension for recording and replaying network/API traffic to make frontend debugging, QA, and demos deterministic.

![API Replay popup preview](img.png)

## Key capabilities

- Record requests by URL filter.
- Replay captured responses with optional fallback matching.
- Edit saved response payloads and status codes.
- Manage multiple recordings (rename, duplicate, delete, import, export).
- Use presets for common filters.
- Search requests by URL/method/status.
- Enable/disable replay per request.
- Simulate replay latency (`latencyMs` or range).
- View replay stats (matched/unmatched/hit counts).
- Toggle recording with keyboard shortcut (`Alt+Shift+R`).

## Architecture overview

- `src/background/`: modular MV3 service worker (`main`, `recorder`, `replayer`, `messaging`, `state-store`, `logger`).
- `src/popup/`: popup UI with components and storage/import-export services.
- `src/shared/`: typed message/storage/recording contracts.
- Storage model uses versioned, UUID-keyed recordings with migration support.

## Local development

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Useful scripts:

- `npm run dev` - Vite dev mode.
- `npm run package` - builds and creates `dist.zip`.
- `npm run test:e2e` - Playwright extension smoke test.

## Load unpacked extension

1. Build the extension (`npm run build`).
2. Open `chrome://extensions/`.
3. Enable Developer mode.
4. Click `Load unpacked` and select the `dist/` folder.

## CI and release

- CI workflow: `.github/workflows/ci.yml` runs lint, typecheck, tests, build, package, and uploads `dist.zip`.
- Release workflow: `.github/workflows/release.yml` runs on tags `v*`, validates tag vs `manifest.version`, and attaches `dist.zip` to the GitHub release.

## Security and privacy

- See `SECURITY.md` for vulnerability reporting guidance.
- See `PRIVACY.md` for data handling and permission rationale.
- Chrome Web Store assets/rationale are in `docs/store/`.

## Documentation

- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `PRIVACY.md`
- `docs/playwright-integration.md`

## Use recordings in Playwright

You can reuse exported `API Replay` JSON files directly in Playwright tests.

```ts
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { applyRecordingMocks } from './tests/helpers/recording-mock';

test('uses an exported recording as API mocks', async ({ context, page }) => {
  const recordingPath = path.resolve(
    process.cwd(),
    'tests/fixtures/recordings/playwright-demo-recording.json'
  );

  const mock = await applyRecordingMocks(context, recordingPath, {
    fallbackMatching: true,
    strictUnmatched: false
  });

  try {
    await page.goto('https://example.test');
    const body = await page.evaluate(async () => {
      const response = await fetch('https://api.example.com/users/me');
      return response.json();
    });

    expect(body).toEqual({ id: 'u_123', name: 'API Replay' });
  } finally {
    await mock.dispose();
  }
});
```

See `docs/playwright-integration.md` for full workflow and strict-mode guidance.

## License

Apache 2.0 - see `LICENSE`.

