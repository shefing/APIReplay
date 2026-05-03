import { logger } from './logger';
import type { StateStore } from './state-store';
import { getRecordingByName, upsertRecordingByName } from '../shared/storage';
import type { RecordingMetadata } from '../shared/recording';

function requestKey(request: { method: string; url: string; status?: number; timestamp?: string }) {
  const ts = request.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
  return `${request.method} ${new URL(request.url).pathname} [${request.status || 200}] ${ts}`;
}

async function persistRequest(store: StateStore, requestId: string, request: any): Promise<void> {
  const fresh = await store.get();
  const nextPending = { ...fresh.pendingRequests };
  delete nextPending[requestId];

  const nextRecorded = {
    ...fresh.recordedData,
    requests: {
      ...fresh.recordedData.requests,
      [requestKey(request)]: request
    }
  };

  await store.patch({ pendingRequests: nextPending, recordedData: nextRecorded });
  await upsertRecordingByName(fresh.currentRecordingName, {
    filter: fresh.currentFilter,
    requests: nextRecorded.requests,
    metadata: nextRecorded.metadata as RecordingMetadata
  });
  try {
    await chrome.runtime.sendMessage({ action: 'recordingUpdated', name: fresh.currentRecordingName });
  } catch {
    // popup may be closed; ignore
  }
}

export async function startRecording(
  store: StateStore,
  name: string,
  filter: string[]
): Promise<{ success: boolean; error?: string }> {
  const currentFilter = Array.isArray(filter) && filter.length > 0 ? filter : ['/api'];
  const state = await store.patch({
    isRecording: true,
    isReplaying: false,
    currentRecordingName: name || 'Unnamed Recording',
    currentFilter,
    recordedData: { requests: {}, metadata: { totalRequests: 0, responsesWithBody: 0 } },
    pendingRequests: {}
  });

  await upsertRecordingByName(state.currentRecordingName, {
    filter: state.currentFilter,
    requests: state.recordedData.requests,
    metadata: state.recordedData.metadata as RecordingMetadata
  });

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.id) {
    return { success: false, error: 'No active tab found' };
  }

  await store.patch({ currentTabId: tabs[0].id });
  await chrome.debugger.attach({ tabId: tabs[0].id }, '1.0');
  await chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Network.enable');
  await chrome.tabs.reload(tabs[0].id);
  return { success: true };
}

export async function stopRecording(store: StateStore): Promise<{ success: boolean }> {
  // Drain the in-flight recorder event queue first so that any responseReceived
  // handlers that were mid-flight (e.g. still awaiting Network.getResponseBody)
  // get a chance to persist their request before we detach the debugger.
  // Without this, users see fewer requests in the popup right after stopping
  // recording than what is actually in the saved recording.
  try {
    await recorderQueue;
  } catch {
    // queue errors are already logged inside onRecorderEvent
  }

  // Fallback: flush any pending requests that received response metadata via
  // Network.responseReceived but never got Network.loadingFinished (e.g. cached
  // or 304 responses). Persist them now with whatever body we have.
  const flushState = await store.get();
  for (const [requestId, request] of Object.entries(flushState.pendingRequests)) {
    if ((request as any).status) {
      await persistRequest(store, requestId, request);
    }
  }

  const state = await store.patch({ isRecording: false });
  if (state.currentTabId) {
    try {
      await chrome.debugger.detach({ tabId: state.currentTabId });
    } catch (error) {
      logger.warn('Failed to detach debugger on stop recording', error);
    }
  }
  return { success: true };
}

// Serialize all recorder event processing per process to avoid lost-update
// races when many concurrent network events update shared state in
// chrome.storage.session. Without serialization, parallel handlers all read
// the same stale `pendingRequests` / `recordedData` and overwrite each other,
// which silently drops most GET requests on busy pages.
let recorderQueue: Promise<unknown> = Promise.resolve();

export function onRecorderEvent(store: StateStore, tabId: number, message: string, params: any): Promise<void> {
  const next = recorderQueue.then(() => handleRecorderEvent(store, tabId, message, params));
  recorderQueue = next.catch((error) => {
    logger.warn('Recorder event handler failed', error);
  });
  return recorderQueue as Promise<void>;
}

async function handleRecorderEvent(store: StateStore, tabId: number, message: string, params: any) {
  const state = await store.get();
  if (!state.isRecording) {
    return;
  }

  if (message === 'Network.requestWillBeSent') {
    let url: URL;
    try {
      url = new URL(params.request.url);
    } catch {
      return;
    }
    if (!state.currentFilter.some((entry) => url.pathname.includes(entry))) {
      return;
    }

    let requestBody: string = params.request.postData || '';
    if (!requestBody && params.request.hasPostData) {
      try {
        const post = (await chrome.debugger.sendCommand({ tabId }, 'Network.getRequestPostData', {
          requestId: params.requestId
        })) as { postData?: string };
        requestBody = post?.postData || '';
      } catch (error) {
        logger.warn('Failed to get request post data', error);
      }
    }

    const fresh = await store.get();
    const pendingRequests = {
      ...fresh.pendingRequests,
      [params.requestId]: {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        requestHeaders: params.request.headers,
        requestBody,
        timestamp: new Date(params.timestamp * 1000).toISOString()
      }
    };

    await store.patch({
      pendingRequests,
      recordedData: {
        ...fresh.recordedData,
        metadata: {
          ...fresh.recordedData.metadata,
          totalRequests: (fresh.recordedData.metadata.totalRequests || 0) + 1
        }
      }
    });
    return;
  }

  if (message === 'Network.responseReceived') {
    const fresh = await store.get();
    const request = fresh.pendingRequests[params.requestId];
    if (!request) return;
    // Store response metadata so loadingFinished can persist the full entry.
    // We do NOT call getResponseBody here because the body may not be available yet
    // (hypothesis #5 in recording-debug-history.md).
    request.responseHeaders = params.response.headers;
    request.status = params.response.status;
    request.statusText = params.response.statusText;
    await store.patch({ pendingRequests: { ...fresh.pendingRequests, [params.requestId]: request } });
    return;
  }

  if (message === 'Network.loadingFinished') {
    // v0.1 flow: body is reliably available here. Fetch it and persist.
    const fresh = await store.get();
    const request = fresh.pendingRequests[params.requestId];
    if (!request) return; // already persisted or not a tracked request

    try {
      const response = (await chrome.debugger.sendCommand({ tabId }, 'Network.getResponseBody', {
        requestId: params.requestId
      })) as { base64Encoded?: boolean; body?: string };
      const responseBody = response?.body || '';
      request.responseBody = response?.base64Encoded
        ? decodeURIComponent(escape(atob(responseBody)))
        : responseBody;
    } catch (error) {
      logger.warn('Failed to get response body in loadingFinished', error);
      request.responseBody = '';
    }

    await persistRequest(store, params.requestId, request);
    return;
  }

  if (message === 'Network.loadingFailed') {
    const fresh = await store.get();
    const nextPending = { ...fresh.pendingRequests };
    delete nextPending[params.requestId];
    await store.patch({ pendingRequests: nextPending });
  }
}

export async function onTabReload(store: StateStore, tabId: number, status: string) {
  const state = await store.get();
  if (status !== 'complete' || !state.currentTabId || tabId !== state.currentTabId || !state.isRecording) {
    return;
  }
  logger.debug('Observed recording tab load complete', { tabId });
}

export async function hydrateCurrentRecording(store: StateStore): Promise<void> {
  const state = await store.get();
  if (!state.currentRecordingName) {
    return;
  }

  const recording = await getRecordingByName(state.currentRecordingName);
  if (!recording) {
    return;
  }

  await store.patch({
    recordedData: {
      requests: recording.requests,
      metadata: recording.metadata
    },
    currentFilter: recording.filter
  });
}
