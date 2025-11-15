module.exports = {
    testEnvironment: 'node',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/services/blockchain/__tests__/setup.js'],

    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/server.js',
        '!src/**/__tests__/**',
        '!src/**/mocks/**',
        '!src/**/__tests__/testSetup.js'
    ],

    // Coverage threshold (singular, not plural!)
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
        './src/services/blockchain/': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },

    // Coverage reporters
    coverageReporters: ['text', 'lcov', 'html'],

    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/',
        '/coverage/',
        'testSetup.js'
    ],

    // Module paths
    modulePaths: ['<rootDir>/src'],

    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Test timeout
    testTimeout: 30000,

    // Transform configuration - explicitly disable babel transform
    transform: {},

    // Reset modules between tests
    resetModules: false,
};
