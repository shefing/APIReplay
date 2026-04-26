import {
  RECORDING_SCHEMA_VERSION,
  type RecordedRequest,
  type Recording,
  type RecordingsStore
} from './recording';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toRecordedRequest(value: unknown): RecordedRequest | null {
  if (!isObject(value) || typeof value.url !== 'string' || typeof value.method !== 'string') {
    return null;
  }

  return {
    requestId: typeof value.requestId === 'string' ? value.requestId : undefined,
    url: value.url,
    method: value.method,
    status: typeof value.status === 'number' ? value.status : undefined,
    statusText: typeof value.statusText === 'string' ? value.statusText : undefined,
    timestamp: typeof value.timestamp === 'string' ? value.timestamp : undefined,
    requestHeaders: isObject(value.requestHeaders)
      ? (value.requestHeaders as Record<string, string>)
      : undefined,
    responseHeaders: isObject(value.responseHeaders)
      ? (value.responseHeaders as Record<string, string>)
      : undefined,
    responseBody: typeof value.responseBody === 'string' ? value.responseBody : undefined,
    error: typeof value.error === 'string' ? value.error : undefined,
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true
  };
}

export function normalizeRecording(input: unknown): Recording | null {
  if (!isObject(input)) {
    return null;
  }

  const requestsInput = isObject(input.requests) ? input.requests : {};
  const requests: Recording['requests'] = {};

  for (const [key, value] of Object.entries(requestsInput)) {
    const request = toRecordedRequest(value);
    if (!request) {
      continue;
    }
    requests[key] = request;
  }

  const replayOptionsInput = isObject(input.replayOptions)
    ? (input.replayOptions as Record<string, unknown>)
    : null;

  const latencyRangeValue = replayOptionsInput?.latencyRange;

  const now = Date.now();
  return {
    id: typeof input.id === 'string' && input.id ? input.id : crypto.randomUUID(),
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : 'Unnamed Recording',
    schemaVersion: RECORDING_SCHEMA_VERSION,
    filter: Array.isArray(input.filter)
      ? input.filter.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      : ['/api'],
    createdAt: typeof input.createdAt === 'number' ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === 'number' ? input.updatedAt : now,
    requests,
    metadata: {
      totalRequests:
        typeof input?.metadata === 'object' && input.metadata && typeof (input.metadata as Record<string, unknown>).totalRequests === 'number'
          ? ((input.metadata as Record<string, unknown>).totalRequests as number)
          : Object.keys(requests).length,
      responsesWithBody:
        typeof input?.metadata === 'object' &&
        input.metadata &&
        typeof (input.metadata as Record<string, unknown>).responsesWithBody === 'number'
          ? ((input.metadata as Record<string, unknown>).responsesWithBody as number)
          : Object.values(requests).filter((request) => Boolean(request.responseBody)).length
    },
    replayOptions:
      replayOptionsInput
        ? {
            fallbackMatching:
              typeof replayOptionsInput.fallbackMatching === 'boolean'
                ? (replayOptionsInput.fallbackMatching as boolean)
                : undefined,
            latencyMs:
              typeof replayOptionsInput.latencyMs === 'number'
                ? (replayOptionsInput.latencyMs as number)
                : undefined,
            latencyRange:
              Array.isArray(latencyRangeValue) &&
              latencyRangeValue.length === 2
                ? [
                    Number(latencyRangeValue[0]),
                    Number(latencyRangeValue[1])
                  ]
                : undefined
          }
        : undefined
  };
}

export function normalizeRecordingsStore(input: unknown): RecordingsStore {
  if (!isObject(input) || !isObject(input.recordings)) {
    return { schemaVersion: RECORDING_SCHEMA_VERSION, recordings: {}, lastUsedRecordId: '' };
  }

  const recordings: RecordingsStore['recordings'] = {};
  for (const value of Object.values(input.recordings)) {
    const normalized = normalizeRecording(value);
    if (!normalized) {
      continue;
    }
    recordings[normalized.id] = normalized;
  }

  const lastUsedRecordId =
    typeof input.lastUsedRecordId === 'string' && recordings[input.lastUsedRecordId]
      ? input.lastUsedRecordId
      : '';

  return {
    schemaVersion: RECORDING_SCHEMA_VERSION,
    recordings,
    lastUsedRecordId
  };
}
