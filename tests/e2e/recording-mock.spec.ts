import { expect, test } from '@playwright/test';
import path from 'node:path';
import { applyRecordingMocks } from '../helpers/recording-mock';

const recordingPath = path.resolve(
  process.cwd(),
  'tests/fixtures/recordings/playwright-demo-recording.json'
);

test.describe('recording mock helper', () => {
  test('mocks exact method + URL matches from recording JSON', async ({ context, page }) => {
    const mock = await applyRecordingMocks(context, recordingPath);

    try {
      const responseData = await page.evaluate(async () => {
        const response = await fetch('https://api.example.com/users/me');
        return {
          status: response.status,
          body: await response.json()
        };
      });

      expect(responseData.status).toBe(200);
      expect(responseData.body).toEqual({ id: 'u_123', name: 'API Replay' });
    } finally {
      await mock.dispose();
    }
  });

  test('supports fallback matching when hosts differ', async ({ context, page }) => {
    const mock = await applyRecordingMocks(context, recordingPath, {
      fallbackMatching: true,
      urlBase: 'https://staging.example.test'
    });

    try {
      const responseData = await page.evaluate(async () => {
        const response = await fetch('https://api.example.com/users/me');
        return {
          status: response.status,
          body: await response.json()
        };
      });

      expect(responseData.status).toBe(200);
      expect(responseData.body).toEqual({ id: 'u_123', name: 'API Replay' });
    } finally {
      await mock.dispose();
    }
  });
});