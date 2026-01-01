// Jest setup file
import '@testing-library/jest-dom';
import { TEST_CONFIG } from '@/config/constants';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.LEANCLOUD_APP_ID = 'test-app-id';
process.env.LEANCLOUD_APP_KEY = 'test-app-key';
process.env.LEANCLOUD_SERVER_URL = 'https://test.leancloud.com';

// Set test timeout
jest.setTimeout(TEST_CONFIG.TIMEOUT_MS);
