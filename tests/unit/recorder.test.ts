import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRecorderEvent } from '../../src/background/recorder';
import { StateStore } from '../../src/background/state-store';

type StoredRecording = {
  filter: string[];
  requests: Record<string, any>;
  metadata: any;
};

function createStore(initial: Partial<Awaited<ReturnType<StateStore['get']>>>): StateStore {
  let state: any = {
    isRecording: true,
    isReplaying: false,
    currentRecordingName: 'rec-1',
    currentFilter: ['/api'],
    currentTabId: 1,
    replayTabId: null,
    fallbackMatchingEnabled: false,
    recordedData: { requests: {}, metadata: { totalRequests: 0, responsesWithBody: 0 } },
    pendingRequests: {},
    ...initial
  };
  return {
    async get() {
      return state;
    },
    async patch(p: any) {
      state = { ...state, ...p };
      return state;
    }
  } as unknown as StateStore;
}

const persisted: Record<string, StoredRecording> = {};

vi.mock('../../src/shared/storage', () => ({
  getRecordingByName: vi.fn(async (name: string) => persisted[name]),
  upsertRecordingByName: vi.fn(async (name: string, rec: StoredRecording) => {
    persisted[name] = rec;
    return rec;
  })
}));

beforeEach(() => {
  for (const k of Object.keys(persisted)) delete persisted[k];

  (globalThis as any).chrome = {
    debugger: {
      sendCommand: vi.fn(async (_t: unknown, method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { base64Encoded: false, body: '{"ok":true}' };
        }
        return undefined;
      })
    },
    runtime: { sendMessage: vi.fn(async () => undefined) },
    tabs: { query: vi.fn(), reload: vi.fn() },
    storage: { local: { get: vi.fn(), set: vi.fn() }, session: { get: vi.fn(), set: vi.fn() } }
  };
});

describe('onRecorderEvent — Fetch.requestPaused', () => {
  it('records a POST when Network.requestWillBeSent did not fire (no pending entry)', async () => {
    const store = createStore({});

    await onRecorderEvent(store, 1, 'Fetch.requestPaused', {
      requestId: 'FETCH-42',
      networkId: undefined,
      request: {
        url: 'https://staging.example.com/api/votes/voting-percentages?meetings=-6f9cf4b3',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        postData: '{"meetings":[{"meetingId":"abc"}]}'
      },
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/json' }]
    });

    const saved = persisted['rec-1'];
    expect(saved).toBeDefined();
    const keys = Object.keys(saved.requests);
    expect(keys).toHaveLength(1);
    const req = saved.requests[keys[0]];
    expect(req.method).toBe('POST');
    expect(req.url).toContain('/api/votes/voting-percentages');
    expect(req.requestBody).toContain('meetingId');
    expect(req.status).toBe(200);
    expect(req.responseBody).toBe('{"ok":true}');
    expect(req.responseHeaders['content-type']).toBe('application/json');
  });

  it('does not record when URL is outside the recording filter', async () => {
    const store = createStore({ currentFilter: ['/api'] });

    await onRecorderEvent(store, 1, 'Fetch.requestPaused', {
      requestId: 'FETCH-43',
      request: {
        url: 'https://example.com/static/app.js',
        method: 'GET',
        headers: {}
      },
      responseStatusCode: 200,
      responseHeaders: []
    });

    expect(persisted['rec-1']).toBeUndefined();
  });

  it('matches an existing pending entry by networkId', async () => {
    const store = createStore({
      pendingRequests: {
        'NET-1': {
          requestId: 'NET-1',
          url: 'https://example.com/api/users',
          method: 'POST',
          requestHeaders: {},
          requestBody: '{"x":1}',
          timestamp: '2026-01-01T00:00:00.000Z'
        }
      }
    });

    await onRecorderEvent(store, 1, 'Fetch.requestPaused', {
      requestId: 'FETCH-1',
      networkId: 'NET-1',
      request: {
        url: 'https://example.com/api/users',
        method: 'POST',
        headers: {},
        postData: '{"x":1}'
      },
      responseStatusCode: 201,
      responseHeaders: [{ name: 'content-type', value: 'application/json' }]
    });

    const saved = persisted['rec-1'];
    expect(saved).toBeDefined();
    const reqs = Object.values(saved.requests);
    expect(reqs).toHaveLength(1);
    expect((reqs[0] as any).status).toBe(201);
    expect((reqs[0] as any).requestBody).toBe('{"x":1}');
  });
});
