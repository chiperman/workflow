/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    // Setup files after environment
    setupFilesAfterEnv: ['<rootDir>/src/lib/__tests__/setup.ts'],

    // Test environment
    testEnvironment: 'jest-environment-jsdom',

    // Module name mapper for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx',
    ],

    // Coverage collection
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/app/**', // Exclude Next.js app directory (routes, layouts)
        '!src/types/**', // Exclude type definitions
        '!src/components/**', // Exclude components (should have separate component tests)
    ],

    // Coverage thresholds - only enforce for files that have tests
    // This ensures tested files maintain high quality without failing on untested files
    coverageThreshold: {
        './src/lib/utils.ts': {
            branches: 75,
            functions: 100,
            lines: 95,
            statements: 95,
        },
        './src/lib/health-check.ts': {
            branches: 90,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
