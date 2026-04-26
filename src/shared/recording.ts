export const RECORDING_SCHEMA_VERSION = 1;

export interface RecordedRequest {
  requestId?: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  timestamp?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  error?: string;
  enabled?: boolean;
}

export interface ReplayOptions {
  fallbackMatching?: boolean;
  latencyMs?: number;
  latencyRange?: [number, number];
}

export interface RecordingMetadata {
  totalRequests: number;
  responsesWithBody: number;
}

export interface Recording {
  id: string;
  name: string;
  schemaVersion: typeof RECORDING_SCHEMA_VERSION;
  filter: string[];
  createdAt: number;
  updatedAt: number;
  requests: Record<string, RecordedRequest>;
  metadata: RecordingMetadata;
  replayOptions?: ReplayOptions;
}

export interface Preset {
  id: string;
  name: string;
  filter: string[];
}

export interface UserSettings {
  presets: Preset[];
  lastPresetId: string;
}

export interface RecordingsStore {
  schemaVersion: typeof RECORDING_SCHEMA_VERSION;
  recordings: Record<string, Recording>;
  lastUsedRecordId: string;
}
