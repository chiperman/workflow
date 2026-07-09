/**
 * @jest-environment node
 */
import { AuthResult, checkTriggerPermission, verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

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

  describe('verifyAuth', () => {
    const createRequest = (pathname: string) => {
      return new Request(`http://localhost${pathname}`);
    };

    it('should recognize public paths', () => {
      const publicPaths = ['/', '/login', '/api/health'];
      publicPaths.forEach(path => {
        const req = createRequest(path);
        const result = verifyAuth(req);
        expect(result.authorized).toBe(true);
        expect(result.type).toBe('public');
      });
    });

    it('should recognize public static asset paths', () => {
      const publicAssetPaths = [
        '/vercel.svg',
        '/github.svg',
        '/gemini-color.svg',
        '/claude-color.svg',
        '/logo.png',
        '/manifest.json',
      ];

      publicAssetPaths.forEach(path => {
        const req = createRequest(path);
        const result = verifyAuth(req);
        expect(result.authorized).toBe(true);
        expect(result.type).toBe('public');
      });
    });

    it('should NOT recognize other paths as public', () => {
      const privatePaths = [
        '/api/tasks/supabase',
        '/api/tasks/glados',
        '/api/service-config',
        '/api/stats/heatmap',
        '/api/stats/heatmap/years',
      ];
      privatePaths.forEach(path => {
        const req = createRequest(path);
        const result = verifyAuth(req);
        expect(result.authorized).toBe(false);
      });
    });

    it('should authorize if session cookie is present even on private paths', () => {
      const req = new NextRequest('http://localhost/api/tasks/supabase');
      req.cookies.set('workflow_session', 'authenticated');

      const result = verifyAuth(req);
      expect(result.authorized).toBe(true);
      expect(result.type).toBe('session');
    });

    it('should authorize with cron secret in header', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          authorization: 'Bearer test-cron-secret',
        },
      });

      const result = verifyAuth(req);
      expect(result.authorized).toBe(true);
      expect(result.type).toBe('cron');
    });

    it('should authorize with app key in header', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          'x-app-key': 'test-app-key',
        },
      });

      const result = verifyAuth(req);
      expect(result.authorized).toBe(true);
      expect(result.type).toBe('app-key');
    });
  });

  describe('checkTriggerPermission', () => {
    it('should allow cron to trigger auto', () => {
      const result = checkTriggerPermission('cron', 'auto');
      expect(result.ok).toBe(true);
    });

    it('should NOT allow non-cron to trigger auto', () => {
      const types: AuthResult['type'][] = ['app-key', 'session', 'public', 'none'];
      types.forEach(type => {
        const result = checkTriggerPermission(type, 'auto');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('Unauthorized');
        }
      });
    });

    it('should allow app-key and session to trigger manual', () => {
      expect(checkTriggerPermission('app-key', 'manual').ok).toBe(true);
      expect(checkTriggerPermission('session', 'manual').ok).toBe(true);
    });

    it('should NOT allow public or none to trigger manual', () => {
      expect(checkTriggerPermission('public', 'manual').ok).toBe(false);
      expect(checkTriggerPermission('none', 'manual').ok).toBe(false);
    });

    it('should NOT allow cron to trigger manual (strict policy)', () => {
      // As per policy: Cron only runs Auto
      const result = checkTriggerPermission('cron', 'manual');
      expect(result.ok).toBe(false);
    });
  });
});
