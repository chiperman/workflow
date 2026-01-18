import { AuthResult, checkTriggerPermission } from '@/lib/auth';

describe('auth.ts', () => {
  // Setup environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      APP_KEY: 'test-app-key',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('checkTriggerPermission', () => {
    it('should allow cron to trigger auto', () => {
      const result = checkTriggerPermission('cron', 'auto');
      expect(result.authorized).toBe(true);
    });

    it('should NOT allow non-cron to trigger auto', () => {
      const types: AuthResult['type'][] = ['app-key', 'session', 'public', 'none'];
      types.forEach(type => {
        const result = checkTriggerPermission(type, 'auto');
        expect(result.authorized).toBe(false);
        expect(result.message).toContain('Unauthorized');
      });
    });

    it('should allow app-key and session to trigger manual', () => {
      expect(checkTriggerPermission('app-key', 'manual').authorized).toBe(true);
      expect(checkTriggerPermission('session', 'manual').authorized).toBe(true);
    });

    it('should NOT allow public or none to trigger manual', () => {
      expect(checkTriggerPermission('public', 'manual').authorized).toBe(false);
      expect(checkTriggerPermission('none', 'manual').authorized).toBe(false);
    });

    it('should NOT allow cron to trigger manual (strict policy)', () => {
      // As per policy: Cron only runs Auto
      const result = checkTriggerPermission('cron', 'manual');
      expect(result.authorized).toBe(false);
    });
  });
});
