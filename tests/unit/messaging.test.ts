import { describe, expect, it } from 'vitest';
import { asPopupState, isBackgroundMessage } from '../../src/background/messaging';

describe('background messaging', () => {
  it('accepts supported action names', () => {
    expect(isBackgroundMessage({ action: 'startRecording', name: 'A', filter: ['/api'] })).toBe(true);
    expect(isBackgroundMessage({ action: 'getReplayStats' })).toBe(true);
  });

  it('rejects unsupported actions', () => {
    expect(isBackgroundMessage({ action: 'unknown' })).toBe(false);
    expect(isBackgroundMessage(null)).toBe(false);
    expect(isBackgroundMessage('startRecording')).toBe(false);
  });

  it('projects runtime state to popup state', () => {
    const popupState = asPopupState({
      isRecording: true,
      isReplaying: false,
      currentRecordingName: 'Rec',
      currentFilter: ['/api'],
      replayTabId: null,
      fallbackMatchingEnabled: false,
      recordedData: null,
      pendingRequests: {}
    });

    expect(popupState).toEqual({
      isRecording: true,
      isReplaying: false,
      currentRecordingName: 'Rec',
      currentFilter: ['/api']
    });
  });
});
