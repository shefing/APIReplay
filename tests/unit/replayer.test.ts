import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onReplayerEvent } from '../../src/background/replayer';

vi.mock('../../src/shared/storage', () => ({
  getRecordingByName: vi.fn()
}));

describe('replayer behavior', () => {
  const continueCommand = vi.fn(async () => undefined);
  const storageLocalGet = vi.fn(async () => ({ replayedRequests: {} }));
  const storageLocalSet = vi.fn(async () => undefined);
  const storageSessionGet = vi.fn(async () => ({ replayStats: { matched: 0, unmatched: 0, unmatchedUrls: [], hitCount: {} } }));
  const storageSessionSet = vi.fn(async () => undefined);

  const store = {
    get: vi.fn(async () => ({
      isRecording: false,
      isReplaying: true,
      currentRecordingName: 'Rec',
      currentFilter: ['/api'],
      replayTabId: 1,
      fallbackMatchingEnabled: false,
      recordedData: {
        requests: {
          key: {
            url: 'https://example.com/api/items',
            method: 'GET',
            status: 200,
            statusText: 'OK',
            responseBody: '{"ok":true}'
          }
        },
        metadata: { totalRequests: 1, responsesWithBody: 1 }
      },
      pendingRequests: {}
    }))
  };

  beforeEach(() => {
    vi.useFakeTimers();
    continueCommand.mockClear();
    storageLocalGet.mockClear();
    storageLocalSet.mockClear();
    storageSessionGet.mockClear();
    storageSessionSet.mockClear();

    vi.stubGlobal('chrome', {
      debugger: {
        sendCommand: continueCommand
      },
      storage: {
        local: {
          get: storageLocalGet,
          set: storageLocalSet
        },
        session: {
          get: storageSessionGet,
          set: storageSessionSet
        }
      }
    });
  });

  it('continues intercepted request when matched request is disabled', async () => {
    store.get.mockResolvedValueOnce({
      ...(await store.get()),
      recordedData: {
        requests: {
          key: {
            url: 'https://example.com/api/items',
            method: 'GET',
            enabled: false
          }
        }
      }
    });

    await onReplayerEvent(store as never, 5, 'Network.requestIntercepted', {
      interceptionId: 'int-1',
      request: { url: 'https://example.com/api/items?x=1' }
    });

    expect(continueCommand).toHaveBeenCalledWith(
      { tabId: 5 },
      'Network.continueInterceptedRequest',
      { interceptionId: 'int-1' }
    );
  });

  it('matches the recorded entry whose method matches the incoming request', async () => {
    store.get.mockResolvedValueOnce({
      ...(await store.get()),
      recordedData: {
        requests: {
          'POST /api/items [200]': {
            url: 'https://example.com/api/items',
            method: 'POST',
            status: 200,
            statusText: 'OK',
            responseBody: '{"from":"post"}'
          },
          'GET /api/items [200]': {
            url: 'https://example.com/api/items',
            method: 'GET',
            status: 200,
            statusText: 'OK',
            responseBody: '{"from":"get"}'
          }
        }
      }
    });

    await onReplayerEvent(store as never, 5, 'Network.requestIntercepted', {
      interceptionId: 'int-method',
      request: { url: 'https://example.com/api/items', method: 'GET' }
    });

    const fulfillCall = continueCommand.mock.calls.find(
      (call) => call[1] === 'Network.continueInterceptedRequest' && (call[2] as any)?.rawResponse
    );
    expect(fulfillCall).toBeTruthy();
    const rawResponse = (fulfillCall![2] as any).rawResponse as string;
    const decoded = atob(rawResponse);
    expect(decoded).toContain('"from":"get"');
    expect(decoded).not.toContain('"from":"post"');
  });

  it('does not match when method differs and falls through to continueRequest', async () => {
    store.get.mockResolvedValueOnce({
      ...(await store.get()),
      recordedData: {
        requests: {
          'POST /api/items [200]': {
            url: 'https://example.com/api/items',
            method: 'POST',
            status: 200,
            responseBody: '{}'
          }
        }
      }
    });

    await onReplayerEvent(store as never, 5, 'Network.requestIntercepted', {
      interceptionId: 'int-mismatch',
      request: { url: 'https://example.com/api/items', method: 'GET' }
    });

    expect(continueCommand).toHaveBeenCalledWith(
      { tabId: 5 },
      'Network.continueInterceptedRequest',
      { interceptionId: 'int-mismatch' }
    );
  });

  it('applies latency from replay options before fulfilling response', async () => {
    storageSessionGet.mockResolvedValueOnce({
      replayStats: { matched: 0, unmatched: 0, unmatchedUrls: [], hitCount: {} },
      replayOptions: { latencyMs: 120 }
    });

    const promise = onReplayerEvent(store as never, 5, 'Network.requestIntercepted', {
      interceptionId: 'int-2',
      request: { url: 'https://example.com/api/items' }
    });

    await vi.advanceTimersByTimeAsync(120);
    await promise;

    expect(storageLocalSet).toHaveBeenCalled();
    expect(storageSessionSet).toHaveBeenCalled();
    expect(continueCommand).toHaveBeenCalledWith(
      { tabId: 5 },
      'Network.continueInterceptedRequest',
      expect.objectContaining({
        interceptionId: 'int-2',
        rawResponse: expect.any(String)
      })
    );
  });
});
