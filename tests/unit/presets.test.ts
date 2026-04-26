import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deletePreset, getSettings, setLastUsedPreset, upsertPreset } from '../../src/popup/services/storage';

describe('preset storage service', () => {
  const localGetMock = vi.fn(async () => ({}));
  const localSetMock = vi.fn(async () => undefined);

  beforeEach(() => {
    localGetMock.mockReset();
    localSetMock.mockReset();

    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: localGetMock,
          set: localSetMock
        }
      }
    });
  });

  it('normalizes presets and ignores invalid entries when reading settings', async () => {
    localGetMock.mockResolvedValueOnce({
      settings: {
        presets: [
          { id: 'p1', name: 'REST', filter: ['/api'] },
          { id: '', name: 'Broken', filter: ['/x'] },
          { id: 'p2', name: '', filter: ['/y'] }
        ],
        lastPresetId: 42
      }
    });

    const settings = await getSettings();
    expect(settings).toEqual({
      presets: [{ id: 'p1', name: 'REST', filter: ['/api'] }],
      lastPresetId: ''
    });
  });

  it('trims preset fields and stores only non-empty filters', async () => {
    localGetMock.mockResolvedValueOnce({ settings: { presets: [], lastPresetId: '' } });

    const preset = await upsertPreset({
      id: 'preset-1',
      name: '  Auth API  ',
      filter: [' /api ', '   ', '/auth']
    });

    expect(preset).toEqual({ id: 'preset-1', name: 'Auth API', filter: ['/api', '/auth'] });
    expect(localSetMock).toHaveBeenCalledWith({
      settings: {
        presets: [{ id: 'preset-1', name: 'Auth API', filter: ['/api', '/auth'] }],
        lastPresetId: ''
      }
    });
  });

  it('clears lastPresetId when deleting the selected preset', async () => {
    localGetMock.mockResolvedValueOnce({
      settings: {
        presets: [
          { id: 'p1', name: 'REST', filter: ['/api'] },
          { id: 'p2', name: 'GraphQL', filter: ['/graphql'] }
        ],
        lastPresetId: 'p1'
      }
    });

    await deletePreset('p1');

    expect(localSetMock).toHaveBeenCalledWith({
      settings: {
        presets: [{ id: 'p2', name: 'GraphQL', filter: ['/graphql'] }],
        lastPresetId: ''
      }
    });
  });

  it('persists last used preset id', async () => {
    localGetMock.mockResolvedValueOnce({ settings: { presets: [], lastPresetId: '' } });

    await setLastUsedPreset('preset-x');

    expect(localSetMock).toHaveBeenCalledWith({
      settings: {
        presets: [],
        lastPresetId: 'preset-x'
      }
    });
  });
});
