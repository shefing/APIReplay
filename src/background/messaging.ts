import type { BackgroundMessage } from '../shared/messages';
import type { RuntimeState } from './state-store';

export function isBackgroundMessage(value: unknown): value is BackgroundMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const action = (value as { action?: unknown }).action;
  return (
    action === 'getState' ||
    action === 'startRecording' ||
    action === 'stopRecording' ||
    action === 'startReplaying' ||
    action === 'stopReplaying' ||
    action === 'popupOpened' ||
    action === 'toggleRecordingByCommand' ||
    action === 'getReplayStats'
  );
}

export function asPopupState(state: RuntimeState) {
  return {
    isRecording: state.isRecording,
    isReplaying: state.isReplaying,
    currentRecordingName: state.currentRecordingName,
    currentFilter: state.currentFilter
  };
}