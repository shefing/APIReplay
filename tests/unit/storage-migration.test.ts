import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateStorageIfNeeded } from '../../src/shared/storage';

describe('storage migration', () => {
  const setMock = vi.fn(async () => undefined);
  const removeMock = vi.fn(async () => undefined);
  const getMock = vi.fn(async () => ({}));

  beforeEach(() => {
    setMock.mockClear();
    removeMock.mockClear();
    getMock.mockClear();

    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: getMock,
          set: setMock,
          remove: removeMock
        }
      }
    });
  });

  it('migrates legacy name-keyed recordings and removes old keys', async () => {
    getMock.mockResolvedValueOnce({
      LastUsed: { not: 'a recording' },
      RecordingA: {
        id: 'legacy-a',
        name: 'RecordingA',
        schemaVersion: 1,
        filter: ['/api'],
        createdAt: 1,
        updatedAt: 2,
        requests: {
          req1: { url: 'https://example.com/api', method: 'GET' }
        },
        metadata: { totalRequests: 1, responsesWithBody: 0 }
      },
      lastUsedRecord: 'RecordingA'
    });

    const store = await migrateStorageIfNeeded();

    expect(Object.values(store.recordings)).toHaveLength(2);
    expect(store.lastUsedRecordId).toBeTruthy();
    expect(setMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith(expect.arrayContaining(['LastUsed', 'RecordingA']));
  });

  it('is idempotent when schema is already migrated', async () => {
    getMock.mockResolvedValueOnce({
      schemaVersion: 1,
      recordings: {
        rec1: {
          id: 'rec1',
          name: 'RecordingA',
          schemaVersion: 1,
          filter: ['/api'],
          createdAt: 1,
          updatedAt: 2,
          requests: {
            req1: { url: 'https://example.com/api', method: 'GET' }
          },
          metadata: { totalRequests: 1, responsesWithBody: 0 }
        }
      },
      lastUsedRecordId: 'rec1'
    });

    const store = await migrateStorageIfNeeded();

    expect(Object.keys(store.recordings)).toEqual(['rec1']);
    expect(store.lastUsedRecordId).toBe('rec1');
    expect(removeMock).not.toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledTimes(1);
  });
});
