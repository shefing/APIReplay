import { asPopupState, isBackgroundMessage } from './messaging';
import { logger } from './logger';
import { onRecorderEvent, onTabReload, startRecording, stopRecording } from './recorder';
import { onReplayerEvent, startReplaying, stopReplaying } from './replayer';
import { migrateStorageIfNeeded } from '../shared/storage';
import { StateStore } from './state-store';

const store = new StateStore();

void migrateStorageIfNeeded().catch((error) => {
  logger.error('Storage migration failed on background startup', error);
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!isBackgroundMessage(request)) {
    sendResponse({ success: false, error: 'Unsupported message' });
    return;
  }

  void (async () => {
    try {
      if (request.action === 'getState') {
        sendResponse(asPopupState(await store.get()));
        return;
      }

      if (request.action === 'startRecording') {
        sendResponse(await startRecording(store, request.name, request.filter));
        return;
      }

      if (request.action === 'stopRecording') {
        sendResponse(await stopRecording(store));
        return;
      }

      if (request.action === 'startReplaying') {
        sendResponse(await startReplaying(store, request.name, Boolean(request.fallbackMatching), request.options));
        return;
      }

      if (request.action === 'stopReplaying') {
        sendResponse(await stopReplaying(store));
        return;
      }

      if (request.action === 'popupOpened') {
        const local = await migrateStorageIfNeeded();
        sendResponse({
          recordings: Object.values(local.recordings),
          lastUsedRecord: local.lastUsedRecordId && local.recordings[local.lastUsedRecordId]
            ? local.recordings[local.lastUsedRecordId].name
            : ''
        });
        return;
      }

      if (request.action === 'getReplayStats') {
        const data = await chrome.storage.session.get('replayStats');
        sendResponse({ success: true, replayStats: data.replayStats || { matched: 0, unmatched: 0, unmatchedUrls: [], hitCount: {} } });
        return;
      }

      if (request.action === 'toggleRecordingByCommand') {
        const current = await store.get();
        if (current.isRecording) {
          sendResponse(await stopRecording(store));
          return;
        }

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].slice(0, 5);
        sendResponse(await startRecording(store, `Shortcut Recording - ${date} ${time}`, ['/api']));
      }
    } catch (error) {
      logger.error('Message handling failed', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  return true;
});

chrome.debugger.onEvent.addListener((debuggeeId, message, params) => {
  if (!debuggeeId.tabId) {
    return;
  }
  void onRecorderEvent(store, debuggeeId.tabId, message, params);
  void onReplayerEvent(store, debuggeeId.tabId, message, params);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  void onTabReload(store, tabId, changeInfo.status || '');
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-recording') {
    return;
  }
  void (async () => {
    const state = await store.get();
    if (state.isRecording) {
      await stopRecording(store);
      return;
    }
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].slice(0, 5);
    await startRecording(store, `Shortcut Recording - ${date} ${time}`, ['/api']);
  })();
});