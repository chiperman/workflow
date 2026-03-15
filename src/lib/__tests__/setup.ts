// Jest setup file
import { TEST_CONFIG } from '@/config/constants';
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Set test timeout
jest.setTimeout(TEST_CONFIG.TIMEOUT_MS);
