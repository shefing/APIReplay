import type { ReplayOptions } from './recording';

export type BackgroundMessage =
  | { action: 'getState' }
  | { action: 'startRecording'; name: string; filter: string[] }
  | { action: 'stopRecording' }
  | { action: 'startReplaying'; name: string; fallbackMatching?: boolean; options?: ReplayOptions }
  | { action: 'stopReplaying' }
  | { action: 'popupOpened' }
  | { action: 'toggleRecordingByCommand' }
  | { action: 'getReplayStats' };
