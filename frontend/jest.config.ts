import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  
  // Test environment options for MSW v2 support
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@mocks/(.*)$': '<rootDir>/src/mocks/$1',
    // Handle CSS imports (with CSS modules)
    '\\.module\\.(css|scss|sass)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '\\.(css|scss|sass)$': '<rootDir>/src/test/__mocks__/styleMock.ts',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test/__mocks__/fileMock.ts',
  },
  
  // Module directories for resolution
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Transform MSW and its dependencies
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|@bundled-es-modules|until-async|strict-event-emitter|statuses)/)',
  ],
  
  // Resolver to handle package.json exports
  resolver: undefined,
  
  // Transform files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/test/**',
    '!src/mocks/**',
  ],
  
  // Coverage thresholds (correct property name)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
};

export default config;
