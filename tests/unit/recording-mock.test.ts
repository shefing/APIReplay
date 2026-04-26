import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyRecordingMocks } from '../helpers/recording-mock';

type RouteStub = {
  continue: ReturnType<typeof vi.fn>;
  fulfill: ReturnType<typeof vi.fn>;
};

type RequestStub = {
  method: () => string;
  url: () => string;
};

const fixtureJson = {
  name: 'Unit Fixture',
  filter: ['/api'],
  requests: {
    exact: {
      url: 'https://api.example.com/users/me',
      method: 'GET',
      status: 200,
      responseHeaders: { 'content-type': 'application/json' },
      responseBody: '{"id":"u_1"}',
      enabled: true
    },
    disabled: {
      url: 'https://api.example.com/todos',
      method: 'GET',
      status: 200,
      responseBody: '[]',
      enabled: false
    }
  },
  metadata: {
    totalRequests: 2,
    responsesWithBody: 2
  }
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('applyRecordingMocks', () => {
  it('fulfills exact method+url match', async () => {
    const { context, handlers } = await registerMockWithFixture();
    const route = createRoute();
    const request = createRequest('GET', 'https://api.example.com/users/me');

    await handlers[0](route as never, request as never);

    expect(context.route).toHaveBeenCalledTimes(1);
    expect(route.fulfill).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        body: '{"id":"u_1"}'
      })
    );
    expect(route.continue).not.toHaveBeenCalled();
  });

  it('matches by path when fallback mode is enabled and host differs', async () => {
    const { handlers } = await registerMockWithFixture({
      fallbackMatching: true,
      urlBase: 'https://staging.example.test'
    });
    const route = createRoute();
    const request = createRequest('GET', 'https://api.example.com/users/me');

    await handlers[0](route as never, request as never);

    expect(route.fulfill).toHaveBeenCalled();
    expect(route.continue).not.toHaveBeenCalled();
  });

  it('continues network when recorded request is disabled', async () => {
    const { handlers } = await registerMockWithFixture();
    const route = createRoute();
    const request = createRequest('GET', 'https://api.example.com/todos');

    await handlers[0](route as never, request as never);

    expect(route.continue).toHaveBeenCalledTimes(1);
    expect(route.fulfill).not.toHaveBeenCalled();
  });

  it('throws in strict mode for unmatched requests', async () => {
    const debug = vi.fn();
    const { handlers } = await registerMockWithFixture({ strictUnmatched: true, debug });
    const route = createRoute();
    const request = createRequest('POST', 'https://api.example.com/unknown');

    await expect(handlers[0](route as never, request as never)).rejects.toThrow(
      'No recording match for POST https://api.example.com/unknown'
    );
    expect(debug).toHaveBeenCalledWith('No recording match for POST https://api.example.com/unknown');
  });
});

async function registerMockWithFixture(options?: Parameters<typeof applyRecordingMocks>[2]) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'apireplay-recording-mock-'));
  const fixturePath = path.join(tempDir, 'recording.json');
  await writeFile(fixturePath, JSON.stringify(fixtureJson), 'utf8');

  const handlers: Array<(route: RouteStub, request: RequestStub) => Promise<void>> = [];

  const context = {
    route: vi.fn(async (_pattern: string, handler: (route: RouteStub, request: RequestStub) => Promise<void>) => {
      handlers.push(handler);
    }),
    unroute: vi.fn(async () => undefined)
  };

  await applyRecordingMocks(context as never, fixturePath, options);

  return { context, handlers };
}

function createRoute(): RouteStub {
  return {
    continue: vi.fn(async () => undefined),
    fulfill: vi.fn(async () => undefined)
  };
}

function createRequest(method: string, url: string): RequestStub {
  return {
    method: () => method,
    url: () => url
  };
}