export interface RuntimeState {
  isRecording: boolean;
  isReplaying: boolean;
  currentRecordingName: string;
  currentFilter: string[];
  currentTabId: number | null;
  replayTabId: number | null;
  fallbackMatchingEnabled: boolean;
  recordedData: {
    requests: Record<string, any>;
    metadata: Record<string, any>;
  };
  pendingRequests: Record<string, any>;
}

const SESSION_KEY = 'runtimeState';

const defaultState: RuntimeState = {
  isRecording: false,
  isReplaying: false,
  currentRecordingName: '',
  currentFilter: ['/api'],
  currentTabId: null,
  replayTabId: null,
  fallbackMatchingEnabled: false,
  recordedData: { requests: {}, metadata: {} },
  pendingRequests: {}
};

export class StateStore {
  async get(): Promise<RuntimeState> {
    const session = await chrome.storage.session.get(SESSION_KEY);
    if (session[SESSION_KEY]) {
      return { ...defaultState, ...session[SESSION_KEY] };
    }

    const local = await chrome.storage.local.get([
      'isRecording',
      'isReplaying',
      'currentRecordingName',
      'currentFilter',
      'replayTabId'
    ]);

    return {
      ...defaultState,
      isRecording: Boolean(local.isRecording),
      isReplaying: Boolean(local.isReplaying),
      currentRecordingName: local.currentRecordingName || '',
      currentFilter: Array.isArray(local.currentFilter) ? local.currentFilter : ['/api'],
      replayTabId: local.replayTabId ?? null
    };
  }

  async patch(patch: Partial<RuntimeState>): Promise<RuntimeState> {
    const next = { ...(await this.get()), ...patch };
    await chrome.storage.session.set({ [SESSION_KEY]: next });
    await chrome.storage.local.set({
      isRecording: next.isRecording,
      isReplaying: next.isReplaying,
      currentRecordingName: next.currentRecordingName,
      currentFilter: next.currentFilter,
      replayTabId: next.replayTabId
    });
    return next;
  }
}