import type { StateStore } from './state-store';
import { getRecordingByName } from '../shared/storage';
import type { UrlMapping } from '../shared/recording';

function safeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function getPathname(url: string): string {
  return new URL(url).pathname;
}

function applyUrlMappings(pathname: string, mappings: UrlMapping[] | undefined): string {
  if (!mappings || mappings.length === 0) {
    return pathname;
  }
  for (const mapping of mappings) {
    const from = mapping.from.startsWith('/') ? mapping.from : '/' + mapping.from;
    const to = mapping.to.startsWith('/') ? mapping.to : '/' + mapping.to;
    if (pathname.startsWith(from)) {
      return to + pathname.slice(from.length);
    }
  }
  return pathname;
}

type ReplayerEventParams = {
  request?: { url?: string; method?: string };
  interceptionId?: string;
  requestId?: string;
};

function getEventRequestUrl(params: ReplayerEventParams): string {
  return params.request?.url || '';
}

function getEventRequestMethod(params: ReplayerEventParams): string {
  return (params.request?.method || 'GET').toUpperCase();
}

function methodsMatch(a: string | undefined, b: string | undefined): boolean {
  return (a || 'GET').toUpperCase() === (b || 'GET').toUpperCase();
}

async function continueRequest(tabId: number, message: string, params: ReplayerEventParams): Promise<void> {
  if (message === 'Fetch.requestPaused' && params.requestId) {
    await chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', {
      requestId: params.requestId
    });
    return;
  }

  if (params.interceptionId) {
    await chrome.debugger.sendCommand({ tabId }, 'Network.continueInterceptedRequest', {
      interceptionId: params.interceptionId
    });
  }
}

export async function startReplaying(
  store: StateStore,
  name: string,
  fallbackMatching = false,
  options?: { latencyMs?: number; latencyRange?: [number, number] }
): Promise<{ success: boolean; error?: string }> {
  const recording = await getRecordingByName(name);
  if (!recording) {
    return { success: false, error: `Recording "${name}" was not found` };
  }
  const recordedData = {
    requests: recording.requests,
    metadata: recording.metadata
  };

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.id) {
    return { success: false, error: 'No active tab found' };
  }

  await store.patch({
    isReplaying: true,
    isRecording: false,
    currentRecordingName: name,
    replayTabId: tabs[0].id,
    fallbackMatchingEnabled: fallbackMatching,
    recordedData,
    currentFilter: Array.isArray(recording.filter) && recording.filter.length > 0 ? recording.filter : ['/api']
  });

  if (options && recording) {
    recording.replayOptions = {
      ...recording.replayOptions,
      ...options,
      fallbackMatching
    };
    await chrome.storage.session.set({ replayOptions: recording.replayOptions });
  }

  await chrome.storage.local.set({ replayedRequests: {} });
  await chrome.storage.session.set({ replayStats: { matched: 0, unmatched: 0, unmatchedUrls: [], hitCount: {} } });
  await chrome.debugger.attach({ tabId: tabs[0].id }, '1.0');
  await chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Network.enable');
  await chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Fetch.enable', {
    patterns: [{ urlPattern: '*', requestStage: 'Request' }]
  });
  await chrome.debugger.sendCommand(
    { tabId: tabs[0].id },
    'Network.setRequestInterception',
    { patterns: [{ urlPattern: '*' }] }
  );
  await chrome.tabs.reload(tabs[0].id);

  return { success: true };
}

export async function stopReplaying(store: StateStore): Promise<{ success: boolean }> {
  const state = await store.patch({ isReplaying: false });

  if (state.replayTabId) {
    try {
      await chrome.debugger.sendCommand({ tabId: state.replayTabId }, 'Fetch.disable');
    } catch {
      // Ignore teardown errors when debugger is already detached/tab is gone.
    }

    try {
      await chrome.debugger.sendCommand(
        { tabId: state.replayTabId },
        'Network.setRequestInterception',
        { patterns: [] }
      );
    } catch {
      // Ignore teardown errors when debugger is already detached/tab is gone.
    }

    try {
      await chrome.debugger.detach({ tabId: state.replayTabId });
    } catch {
      // Ignore teardown errors when debugger is already detached/tab is gone.
    }
  }

  await store.patch({ replayTabId: null });
  await chrome.storage.session.remove('replayOptions');
  return { success: true };
}

function resolveLatency(options: { latencyMs?: number; latencyRange?: [number, number] } | undefined): number {
  if (!options) {
    return 0;
  }
  if (typeof options.latencyMs === 'number' && options.latencyMs > 0) {
    return options.latencyMs;
  }
  if (
    Array.isArray(options.latencyRange) &&
    options.latencyRange.length === 2 &&
    Number.isFinite(options.latencyRange[0]) &&
    Number.isFinite(options.latencyRange[1])
  ) {
    const min = Math.max(0, Math.min(options.latencyRange[0], options.latencyRange[1]));
    const max = Math.max(options.latencyRange[0], options.latencyRange[1]);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return 0;
}

export async function onReplayerEvent(store: StateStore, tabId: number, message: string, params: any) {
  if (message !== 'Network.requestIntercepted' && message !== 'Fetch.requestPaused') {
    return;
  }

  const state = await store.get();
  if (!state.isReplaying) {
    return;
  }

  const requests = state.recordedData?.requests || state.recordedData || {};
  const requestValues = Object.values(requests) as Array<any>;

  const requestUrl = getEventRequestUrl(params);
  if (!requestUrl) {
    await continueRequest(tabId, message, params);
    return;
  }

  const replayOptionsData = await chrome.storage.session.get('replayOptions');
  const urlMappings = replayOptionsData.replayOptions?.urlMappings;

  const incomingPathname = applyUrlMappings(getPathname(requestUrl), urlMappings);
  const incomingMethod = getEventRequestMethod(params);

  // Only count/replay requests in scope of the recording's URL filter.
  // Out-of-scope URLs (e.g. analytics like /ingest/*) are passed through without affecting stats.
  const filter = Array.isArray(state.currentFilter) && state.currentFilter.length > 0 ? state.currentFilter : ['/api'];
  const inScope = filter.some((entry) => incomingPathname.includes(entry));
  if (!inScope) {
    await continueRequest(tabId, message, params);
    return;
  }

  let matched = requestValues.find(
    (item) => methodsMatch(item.method, incomingMethod) && getPathname(item.url) === incomingPathname
  );

  if (!matched && state.fallbackMatchingEnabled) {
    matched = requestValues.find((item) => {
      if (!methodsMatch(item.method, incomingMethod)) return false;
      const candidatePath = getPathname(item.url);
      return candidatePath.split('/').filter(Boolean).length === incomingPathname.split('/').filter(Boolean).length;
    });
  }

  if (!matched) {
    const replayStatsData = await chrome.storage.session.get('replayStats');
    const replayStats = replayStatsData.replayStats || { matched: 0, unmatched: 0, unmatchedUrls: [], hitCount: {} };
    replayStats.unmatched += 1;
    replayStats.unmatchedUrls = [...(replayStats.unmatchedUrls || []), requestUrl].slice(-25);
    await chrome.storage.session.set({ replayStats });
    await continueRequest(tabId, message, params);
    return;
  }

  if (matched.enabled === false) {
    await continueRequest(tabId, message, params);
    return;
  }

  const replayedRequestsData = await chrome.storage.local.get('replayedRequests');
  const replayedRequests = replayedRequestsData.replayedRequests || {};
  const path = getPathname(requestUrl);
  replayedRequests[path] = (replayedRequests[path] || 0) + 1;
  await chrome.storage.local.set({ replayedRequests });

  const replayStatsData = await chrome.storage.session.get(['replayStats', 'replayOptions']);
  const replayStats = replayStatsData.replayStats || { matched: 0, unmatched: 0, unmatchedUrls: [], hitCount: {} };
  replayStats.matched += 1;
  replayStats.hitCount = replayStats.hitCount || {};
  replayStats.hitCount[path] = (replayStats.hitCount[path] || 0) + 1;
  await chrome.storage.session.set({ replayStats });

  const latency = resolveLatency(replayStatsData.replayOptions);
  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  const rawBody = matched.responseBody || '';

  if (message === 'Fetch.requestPaused' && params.requestId) {
    await chrome.debugger.sendCommand({ tabId }, 'Fetch.fulfillRequest', {
      requestId: params.requestId,
      responseCode: matched.status || 200,
      responsePhrase: matched.statusText || 'OK',
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: safeBase64(rawBody)
    });
    return;
  }

  const body = safeBase64(rawBody);
  if (params.interceptionId) {
    await chrome.debugger.sendCommand({ tabId }, 'Network.continueInterceptedRequest', {
      interceptionId: params.interceptionId,
      rawResponse: safeBase64(
        `HTTP/1.1 ${matched.status || 200} ${matched.statusText || 'OK'}\r\n` +
          `Content-Type: application/json\r\n` +
          `Content-Length: ${body.length}\r\n\r\n` +
          rawBody
      )
    });
  }
}
