import { logger } from './logger';
import type { RuntimeState, StateStore } from './state-store';
import { getRecordingByName, upsertRecordingByName } from '../shared/storage';
import type { RecordingMetadata } from '../shared/recording';

function requestKey(request: { method: string; url: string; status?: number }) {
  return `${request.method} ${new URL(request.url).pathname} [${request.status || 200}]`;
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
  await chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Fetch.enable', {
    patterns: [{ urlPattern: '*', requestStage: 'Response' }]
  });
  await chrome.tabs.reload(tabs[0].id);
  return { success: true };
}

export async function stopRecording(store: StateStore): Promise<{ success: boolean }> {
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

export async function onRecorderEvent(store: StateStore, tabId: number, message: string, params: any) {
  const state = await store.get();
  if (!state.isRecording) {
    return;
  }

  if (message === 'Network.requestWillBeSent') {
    const url = new URL(params.request.url);
    if (!state.currentFilter.some((entry) => url.pathname.includes(entry))) {
      return;
    }

    const pendingRequests = {
      ...state.pendingRequests,
      [params.requestId]: {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        requestHeaders: params.request.headers,
        timestamp: new Date(params.timestamp * 1000).toISOString()
      }
    };

    await store.patch({
      pendingRequests,
      recordedData: {
        ...state.recordedData,
        metadata: {
          ...state.recordedData.metadata,
          totalRequests: (state.recordedData.metadata.totalRequests || 0) + 1
        }
      }
    });
    return;
  }

  if (message === 'Network.responseReceived') {
    const request = state.pendingRequests[params.requestId];
    if (!request) return;
    request.responseHeaders = params.response.headers;
    request.status = params.response.status;
    request.statusText = params.response.statusText;
    await store.patch({ pendingRequests: { ...state.pendingRequests, [params.requestId]: request } });
    return;
  }

  if (message === 'Fetch.requestPaused') {
    const networkKey = params.networkId && state.pendingRequests[params.networkId] ? params.networkId : params.requestId;
    const request = state.pendingRequests[networkKey];
    if (request) {
      try {
        const response = (await chrome.debugger.sendCommand({ tabId }, 'Fetch.getResponseBody', {
          requestId: params.requestId
        })) as { base64Encoded?: boolean; body?: string };
        const responseBody = response.body || '';
        request.responseBody = response.base64Encoded
          ? decodeURIComponent(escape(atob(responseBody)))
          : responseBody;
      } catch {
        request.responseBody = '';
      }
      await store.patch({ pendingRequests: { ...state.pendingRequests, [networkKey]: request } });
    }

    await chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', { requestId: params.requestId });
    return;
  }

  if (message === 'Network.loadingFinished') {
    const request = state.pendingRequests[params.requestId];
    if (!request) return;

    const nextPending = { ...state.pendingRequests };
    delete nextPending[params.requestId];

    const nextRecorded = {
      ...state.recordedData,
      requests: {
        ...state.recordedData.requests,
        [requestKey(request)]: request
      }
    };

    await store.patch({ pendingRequests: nextPending, recordedData: nextRecorded });
    await upsertRecordingByName(state.currentRecordingName, {
      filter: state.currentFilter,
      requests: nextRecorded.requests,
      metadata: nextRecorded.metadata as RecordingMetadata
    });
    await chrome.runtime.sendMessage({ action: 'recordingUpdated', name: state.currentRecordingName });
    return;
  }

  if (message === 'Network.loadingFailed') {
    const nextPending = { ...state.pendingRequests };
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
