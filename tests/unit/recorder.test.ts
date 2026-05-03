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

function setupChrome(handlers: Record<string, any> = {}) {
  (globalThis as any).chrome = {
    debugger: {
      sendCommand: vi.fn(async (_t: unknown, method: string, _params?: any) => {
        if (method in handlers) return handlers[method];
        if (method === 'Network.getResponseBody') {
          return { base64Encoded: false, body: '{"ok":true}' };
        }
        return undefined;
      })
    },
    runtime: { sendMessage: vi.fn(async () => undefined) },
    tabs: { query: vi.fn(), reload: vi.fn() },
    storage: { local: { get: vi.fn(), set: vi.fn() }, session: { get: vi.fn(), set: vi.fn() } }
  };
}

beforeEach(() => {
  for (const k of Object.keys(persisted)) delete persisted[k];
  setupChrome();
});

describe('onRecorderEvent — Network.* flow', () => {
  it('records a GET request through requestWillBeSent → responseReceived → loadingFinished', async () => {
    const store = createStore({});

    await onRecorderEvent(store, 1, 'Network.requestWillBeSent', {
      requestId: 'NET-1',
      timestamp: 0,
      request: {
        url: 'https://example.com/api/users',
        method: 'GET',
        headers: { accept: 'application/json' }
      }
    });
    await onRecorderEvent(store, 1, 'Network.responseReceived', {
      requestId: 'NET-1',
      response: {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      }
    });
    await onRecorderEvent(store, 1, 'Network.loadingFinished', { requestId: 'NET-1' });

    const saved = persisted['rec-1'];
    expect(saved).toBeDefined();
    const keys = Object.keys(saved.requests);
    expect(keys).toHaveLength(1);
    const req = saved.requests[keys[0]];
    expect(req.method).toBe('GET');
    expect(req.status).toBe(200);
    expect(req.responseBody).toBe('{"ok":true}');
  });

  it('records a large POST request and captures postData via Network.getRequestPostData when not inlined', async () => {
    const largeBody = JSON.stringify({
      meetings: Array.from({ length: 100 }, (_, i) => ({ meetingId: `id-${i}`, companyIds: ['c1'] }))
    });
    setupChrome({
      'Network.getRequestPostData': { postData: largeBody },
      'Network.getResponseBody': { base64Encoded: false, body: '{"percentages":{}}' }
    });
    const store = createStore({});

    // Simulate Chrome NOT inlining postData for large bodies (hasPostData=true, postData missing)
    await onRecorderEvent(store, 1, 'Network.requestWillBeSent', {
      requestId: 'NET-POST-1',
      timestamp: 0,
      request: {
        url: 'https://staging.example.com/api/votes/voting-percentages?meetings=-6f9cf4b3',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        hasPostData: true
      }
    });
    await onRecorderEvent(store, 1, 'Network.responseReceived', {
      requestId: 'NET-POST-1',
      response: {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      }
    });
    await onRecorderEvent(store, 1, 'Network.loadingFinished', { requestId: 'NET-POST-1' });

    const saved = persisted['rec-1'];
    expect(saved).toBeDefined();
    const keys = Object.keys(saved.requests);
    expect(keys).toHaveLength(1);
    const req = saved.requests[keys[0]];
    expect(req.method).toBe('POST');
    expect(req.url).toContain('/api/votes/voting-percentages');
    expect(req.requestBody).toBe(largeBody);
    expect(req.status).toBe(200);
    expect(req.responseBody).toBe('{"percentages":{}}');
  });

  it('does not record requests outside the URL filter', async () => {
    const store = createStore({ currentFilter: ['/api'] });

    await onRecorderEvent(store, 1, 'Network.requestWillBeSent', {
      requestId: 'NET-2',
      timestamp: 0,
      request: { url: 'https://example.com/static/app.js', method: 'GET', headers: {} }
    });
    await onRecorderEvent(store, 1, 'Network.loadingFinished', { requestId: 'NET-2' });

    expect(persisted['rec-1']).toBeUndefined();
  });

  it('decodes base64 response bodies (UTF-8 safe) for non-Latin1 content', async () => {
    const hebrew = 'שלום עולם';
    // base64 of UTF-8 bytes for "שלום עולם"
    const utf8Bytes = unescape(encodeURIComponent(hebrew));
    const b64 = btoa(utf8Bytes);
    setupChrome({
      'Network.getResponseBody': { base64Encoded: true, body: b64 }
    });
    const store = createStore({});

    await onRecorderEvent(store, 1, 'Network.requestWillBeSent', {
      requestId: 'NET-3',
      timestamp: 0,
      request: { url: 'https://example.com/api/hello', method: 'GET', headers: {} }
    });
    await onRecorderEvent(store, 1, 'Network.responseReceived', {
      requestId: 'NET-3',
      response: { status: 200, statusText: 'OK', headers: {} }
    });
    await onRecorderEvent(store, 1, 'Network.loadingFinished', { requestId: 'NET-3' });

    const saved = persisted['rec-1'];
    const keys = Object.keys(saved.requests);
    expect(saved.requests[keys[0]].responseBody).toBe(hebrew);
  });
});
