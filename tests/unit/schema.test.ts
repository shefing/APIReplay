import { describe, expect, it, vi } from 'vitest';
import { normalizeRecording, normalizeRecordingsStore } from '../../src/shared/schema';

describe('schema normalization', () => {
  it('normalizes recording defaults and request enabled flag', () => {
    const randomUuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('generated-id');

    const normalized = normalizeRecording({
      name: '  My Recording  ',
      requests: {
        one: {
          url: 'https://example.com/api/users',
          method: 'GET'
        }
      }
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe('generated-id');
    expect(normalized?.name).toBe('My Recording');
    expect(normalized?.requests.one.enabled).toBe(true);
    expect(normalized?.filter).toEqual(['/api']);

    randomUuidSpy.mockRestore();
  });

  it('keeps replay options latency fields when valid', () => {
    const normalized = normalizeRecording({
      id: 'rec-1',
      name: 'Recording',
      filter: ['/api'],
      requests: {},
      replayOptions: {
        fallbackMatching: true,
        latencyMs: 150,
        latencyRange: ['100', 300]
      }
    });

    expect(normalized?.replayOptions).toEqual({
      fallbackMatching: true,
      latencyMs: 150,
      latencyRange: [100, 300]
    });
  });

  it('normalizes recordings store and drops invalid last used id', () => {
    const store = normalizeRecordingsStore({
      schemaVersion: 1,
      recordings: {
        rec1: {
          id: 'rec1',
          name: 'A',
          schemaVersion: 1,
          filter: ['/api'],
          createdAt: 1,
          updatedAt: 2,
          requests: {
            key: {
              url: 'https://example.com/api',
              method: 'GET'
            }
          },
          metadata: { totalRequests: 1, responsesWithBody: 0 }
        }
      },
      lastUsedRecordId: 'missing'
    });

    expect(Object.keys(store.recordings)).toEqual(['rec1']);
    expect(store.lastUsedRecordId).toBe('');
  });
});
