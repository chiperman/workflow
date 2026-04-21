import { mergeConfigSegments, normalizeConfigSegments, splitHeadersBySensitivity } from '../crypto';

describe('crypto config segmentation', () => {
  it('should keep non-sensitive headers in config and move sensitive headers to secret_config', () => {
    const result = normalizeConfigSegments(
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
      },
      {}
    );

    expect(result.config.headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(result.secret_config.headers).toEqual({
      Authorization: 'Bearer token',
    });
  });

  it('should merge public and secret headers back for runtime use', () => {
    const runtime = mergeConfigSegments(
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        headers: {
          Authorization: 'Bearer token',
        },
      }
    );

    expect(runtime.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    });
  });

  it('should classify headers consistently in the UI helper', () => {
    const result = splitHeadersBySensitivity({
      'Content-Type': 'application/json',
      'X-API-Key': 'secret-key',
    });

    expect(result.configHeaders).toEqual({
      'Content-Type': 'application/json',
    });
    expect(result.secretHeaders).toEqual({
      'X-API-Key': 'secret-key',
    });
  });
});
