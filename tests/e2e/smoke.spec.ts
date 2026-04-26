import { chromium, test, expect } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const extensionPath = process.env.EXTENSION_PATH || path.resolve(process.cwd(), 'dist');

test.describe('extension smoke', () => {
  test('loads extension context', async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apireplay-pw-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });

    try {
      if (context.serviceWorkers().length === 0) {
        await context.waitForEvent('serviceworker');
      }
      expect(context.serviceWorkers().length).toBeGreaterThan(0);
    } finally {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
