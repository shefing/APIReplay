import { normalizeRecording } from '../../shared/schema';
import type { Preset, Recording, UserSettings } from '../../shared/recording';
import {
  getRecordingByName,
  getRecordingsStore,
  migrateStorageIfNeeded,
  saveRecordingsStore,
  upsertRecordingByName
} from '../../shared/storage';

const DEFAULT_PRESETS: Array<Omit<Preset, 'id'>> = [
  { name: 'REST API', filter: ['/api', '/v1'] },
  { name: 'GraphQL', filter: ['/graphql'] },
  { name: 'Auth', filter: ['/auth', '/login', '/users/me'] },
  { name: 'Payments', filter: ['/payments', '/checkout'] }
];

export async function ensureMigratedStorage() {
  return migrateStorageIfNeeded();
}

export async function listRecordingNames(): Promise<string[]> {
  const store = await getRecordingsStore();
  return Object.values(store.recordings)
    .map((recording) => recording.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function listRecordings(): Promise<Recording[]> {
  const store = await getRecordingsStore();
  return Object.values(store.recordings).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRecording(name: string) {
  return getRecordingByName(name);
}

export async function saveRecording(name: string, payload: unknown) {
  const normalized = normalizeRecording({ ...(payload as Record<string, unknown>), name });
  if (!normalized) {
    throw new Error('Invalid recording payload');
  }

  return upsertRecordingByName(name, {
    filter: normalized.filter,
    requests: normalized.requests,
    metadata: normalized.metadata
  });
}

export async function deleteRecording(name: string) {
  const store = await getRecordingsStore();
  const id = Object.values(store.recordings).find((recording) => recording.name === name)?.id;
  if (!id) {
    return;
  }

  delete store.recordings[id];
  if (store.lastUsedRecordId === id) {
    store.lastUsedRecordId = '';
  }
  await saveRecordingsStore(store);
}

export async function clearRecordings() {
  await saveRecordingsStore({ schemaVersion: 1, recordings: {}, lastUsedRecordId: '' });
}

export async function getSettings(): Promise<UserSettings> {
  const data = await chrome.storage.local.get('settings');
  const settings = data.settings || {};
  const presets = Array.isArray(settings.presets)
    ? settings.presets.filter((preset: Preset) => preset && preset.id && preset.name)
    : [];
  return {
    presets,
    lastPresetId: typeof settings.lastPresetId === 'string' ? settings.lastPresetId : ''
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

export async function upsertPreset(preset: Omit<Preset, 'id'> & { id?: string }): Promise<Preset> {
  const settings = await getSettings();
  const id = preset.id || crypto.randomUUID();
  const next: Preset = {
    id,
    name: preset.name.trim() || 'Preset',
    filter: preset.filter.map((item) => item.trim()).filter(Boolean)
  };
  const existingIndex = settings.presets.findIndex((entry) => entry.id === id);
  if (existingIndex >= 0) {
    settings.presets[existingIndex] = next;
  } else {
    settings.presets.push(next);
  }
  await saveSettings(settings);
  return next;
}

export async function deletePreset(presetId: string): Promise<void> {
  const settings = await getSettings();
  settings.presets = settings.presets.filter((preset) => preset.id !== presetId);
  if (settings.lastPresetId === presetId) {
    settings.lastPresetId = '';
  }
  await saveSettings(settings);
}

export async function setLastUsedPreset(presetId: string): Promise<void> {
  const settings = await getSettings();
  settings.lastPresetId = presetId;
  await saveSettings(settings);
}

export async function ensureDefaultPresets(): Promise<UserSettings> {
  const settings = await getSettings();
  if (settings.presets.length > 0) {
    return settings;
  }

  settings.presets = DEFAULT_PRESETS.map((preset) => ({
    id: crypto.randomUUID(),
    name: preset.name,
    filter: [...preset.filter]
  }));
  settings.lastPresetId = settings.presets[0]?.id || '';
  await saveSettings(settings);
  return settings;
}

export async function getLastUsedRecordingName(): Promise<string> {
  const store = await getRecordingsStore();
  if (!store.lastUsedRecordId) {
    return '';
  }
  return store.recordings[store.lastUsedRecordId]?.name || '';
}

export async function setLastUsedRecording(name: string): Promise<void> {
  const store = await getRecordingsStore();
  const recording = Object.values(store.recordings).find((entry) => entry.name === name);
  store.lastUsedRecordId = recording?.id || '';
  await saveRecordingsStore(store);
}

export async function renameRecording(oldName: string, newName: string): Promise<boolean> {
  const store = await getRecordingsStore();
  const existing = Object.values(store.recordings).find((recording) => recording.name === oldName);
  if (!existing) {
    return false;
  }

  const conflict = Object.values(store.recordings).find((recording) => recording.name === newName && recording.id !== existing.id);
  if (conflict) {
    throw new Error(`Recording name "${newName}" already exists`);
  }

  existing.name = newName;
  existing.updatedAt = Date.now();
  store.recordings[existing.id] = existing;
  if (store.lastUsedRecordId === existing.id) {
    store.lastUsedRecordId = existing.id;
  }
  await saveRecordingsStore(store);
  return true;
}

export async function duplicateRecording(name: string): Promise<string | null> {
  const source = await getRecordingByName(name);
  if (!source) {
    return null;
  }

  const existingNames = new Set(await listRecordingNames());
  let candidate = `${name} (copy)`;
  let counter = 2;
  while (existingNames.has(candidate)) {
    candidate = `${name} (copy ${counter})`;
    counter += 1;
  }

  await upsertRecordingByName(candidate, {
    filter: source.filter,
    requests: JSON.parse(JSON.stringify(source.requests)),
    metadata: source.metadata
  });

  return candidate;
}

export async function updateRecordingRequestResponse(
  recordingName: string,
  requestKey: string,
  responseBody: string
): Promise<boolean> {
  const recording = await getRecordingByName(recordingName);
  if (!recording || !recording.requests[requestKey]) {
    return false;
  }

  let nextResponse = responseBody;
  try {
    nextResponse = JSON.stringify(JSON.parse(responseBody));
  } catch {
    nextResponse = responseBody;
  }

  recording.requests[requestKey].responseBody = nextResponse;

  await upsertRecordingByName(recordingName, {
    filter: recording.filter,
    requests: recording.requests,
    metadata: recording.metadata
  });

  return true;
}

export async function updateRecordingRequestSettings(
  recordingName: string,
  requestKey: string,
  patch: { enabled?: boolean; status?: number; statusText?: string }
): Promise<boolean> {
  const recording = await getRecordingByName(recordingName);
  if (!recording || !recording.requests[requestKey]) {
    return false;
  }

  recording.requests[requestKey] = {
    ...recording.requests[requestKey],
    ...patch
  };

  await upsertRecordingByName(recordingName, {
    filter: recording.filter,
    requests: recording.requests,
    metadata: recording.metadata
  });

  return true;
}

export async function updateReplayOptions(
  recordingName: string,
  options: { latencyMs?: number; latencyRange?: [number, number] }
): Promise<boolean> {
  const recording = await getRecordingByName(recordingName);
  if (!recording) {
    return false;
  }

  recording.replayOptions = {
    ...(recording.replayOptions || {}),
    ...options
  };

  await upsertRecordingByName(recordingName, {
    filter: recording.filter,
    requests: recording.requests,
    metadata: recording.metadata
  });

  const store = await getRecordingsStore();
  const target = Object.values(store.recordings).find((entry) => entry.name === recordingName);
  if (target) {
    target.replayOptions = recording.replayOptions;
    store.recordings[target.id] = target;
    await saveRecordingsStore(store);
  }

  return true;
}
