import {
  encrypt,
  mergeConfigSegments,
  mergeSecretConfig,
  normalizeConfigSegments,
  normalizeStoredConfigSegments,
  resolveUpdatedConfigSegments,
  splitHeadersBySensitivity,
} from '../crypto';

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

  it('should decrypt legacy secrets stored in config before normalization', () => {
    const result = normalizeStoredConfigSegments(
      {
        cookie: encrypt('legacy-cookie'),
      } as unknown as import('@/types').TaskConfigData,
      {}
    );

    expect(result.secret_config.cookie).toBe('legacy-cookie');
  });

  it('should preserve omitted secret fields during partial secret_config updates', () => {
    const result = mergeSecretConfig(
      {
        cookie: 'cookie-value',
        headers: {
          Authorization: 'Bearer existing',
        },
      },
      {
        notification_key: 'notify-me',
      }
    );

    expect(result).toEqual({
      cookie: 'cookie-value',
      headers: {
        Authorization: 'Bearer existing',
      },
      notification_key: 'notify-me',
    });
  });

  it('should preserve decrypted legacy secrets when the UI sends masked placeholders', () => {
    const result = resolveUpdatedConfigSegments({
      existingConfig: {
        cookie: encrypt('legacy-cookie'),
      } as unknown as import('@/types').TaskConfigData,
      incomingSecretConfig: {
        cookie: '********',
      },
    });

    expect(result.secret_config.cookie).toBe('legacy-cookie');
  });

  it('should migrate secrets from config-only PUT payloads without dropping existing secrets', () => {
    const result = resolveUpdatedConfigSegments({
      existingConfig: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      existingSecretConfig: {
        cookie: 'existing-cookie',
      },
      incomingConfig: {
        headers: {
          Authorization: 'Bearer next-token',
          'Content-Type': 'application/json',
        },
      },
    });

    expect(result.config).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result.secret_config).toEqual({
      cookie: 'existing-cookie',
      headers: {
        Authorization: 'Bearer next-token',
      },
    });
  });

  it('should handle legacy encrypted secrets in config when merging for runtime', () => {
    const runtime = mergeConfigSegments(
      {
        cookie: encrypt('legacy-encrypted-cookie'),
      } as unknown as import('@/types').TaskConfigData,
      {}
    );

    expect(runtime.cookie).toBe('legacy-encrypted-cookie');
  });
});
