import {
  RECORDING_SCHEMA_VERSION,
  type RecordedRequest,
  type Recording,
  type RecordingsStore
} from './recording';
import { normalizeRecording, normalizeRecordingsStore } from './schema';

const RESERVED_KEYS = new Set([
  'schemaVersion',
  'recordings',
  'lastUsedRecordId',
  'lastUsedRecord',
  'isRecording',
  'isReplaying',
  'currentRecordingName',
  'currentFilter',
  'replayTabId',
  'runtimeState',
  'replayedRequests'
]);

function toStoreValue(store: RecordingsStore) {
  const legacyMirror = Object.values(store.recordings).reduce<Record<string, unknown>>((acc, recording) => {
    acc[recording.name] = recording;
    return acc;
  }, {});

  return {
    schemaVersion: store.schemaVersion,
    recordings: store.recordings,
    lastUsedRecordId: store.lastUsedRecordId,
    lastUsedRecord: store.lastUsedRecordId && store.recordings[store.lastUsedRecordId]
      ? store.recordings[store.lastUsedRecordId].name
      : '',
    ...legacyMirror
  };
}

export async function migrateStorageIfNeeded(): Promise<RecordingsStore> {
  const local = await chrome.storage.local.get(null);

  const migrated: Record<string, Recording> = {};
  const migratedLegacyKeys: string[] = [];

  for (const [key, value] of Object.entries(local)) {
    if (RESERVED_KEYS.has(key)) {
      continue;
    }
    const normalized = normalizeRecording({ ...(value as Record<string, unknown>), name: key });
    if (!normalized) {
      continue;
    }
    migrated[normalized.id] = normalized;
    migratedLegacyKeys.push(key);
  }

  const existingStore =
    local.schemaVersion === RECORDING_SCHEMA_VERSION
      ? normalizeRecordingsStore(local)
      : { schemaVersion: RECORDING_SCHEMA_VERSION, recordings: {}, lastUsedRecordId: '' };
  const recordings = { ...existingStore.recordings, ...migrated };
  const legacyLastUsedName = typeof local.lastUsedRecord === 'string' ? local.lastUsedRecord : '';

  const lastUsedRecordId =
    existingStore.lastUsedRecordId ||
    Object.values(recordings).find((recording) => recording.name === legacyLastUsedName)?.id ||
    '';

  const next: RecordingsStore = {
    schemaVersion: RECORDING_SCHEMA_VERSION,
    recordings,
    lastUsedRecordId
  };

  await chrome.storage.local.set(toStoreValue(next));
  if (migratedLegacyKeys.length > 0) {
    await chrome.storage.local.remove(migratedLegacyKeys);
  }
  return next;
}

export async function getRecordingsStore(): Promise<RecordingsStore> {
  return migrateStorageIfNeeded();
}

export async function saveRecordingsStore(store: RecordingsStore): Promise<void> {
  const normalized = normalizeRecordingsStore(store);
  await chrome.storage.local.set(toStoreValue(normalized));
}

export async function getRecordingByName(name: string): Promise<Recording | null> {
  const store = await getRecordingsStore();
  return Object.values(store.recordings).find((recording) => recording.name === name) || null;
}

export async function upsertRecordingByName(
  name: string,
  patch: { filter?: string[]; requests?: Record<string, RecordedRequest>; metadata?: Recording['metadata'] }
): Promise<Recording> {
  const store = await getRecordingsStore();
  const now = Date.now();
  const existing = Object.values(store.recordings).find((recording) => recording.name === name);

  const next: Recording = {
    id: existing?.id || crypto.randomUUID(),
    name,
    schemaVersion: RECORDING_SCHEMA_VERSION,
    filter: patch.filter || existing?.filter || ['/api'],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    requests: patch.requests || existing?.requests || {},
    metadata: patch.metadata || existing?.metadata || { totalRequests: 0, responsesWithBody: 0 },
    replayOptions: existing?.replayOptions
  };

  const normalized = normalizeRecording(next);
  if (!normalized) {
    throw new Error('Failed to normalize recording data before persist');
  }

  store.recordings[normalized.id] = normalized;
  if (store.lastUsedRecordId === '' || store.lastUsedRecordId === existing?.id) {
    store.lastUsedRecordId = normalized.id;
  }
  await saveRecordingsStore(store);
  return normalized;
}
