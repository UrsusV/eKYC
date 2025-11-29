/**
 * Test Setup Configuration
 * Sets up environment variables and configurations for testing
 */

// Set test environment
process.env.NODE_ENV = 'test';

// JWT Configuration
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only_12345';
process.env.JWT_EXPIRE = '24h';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_for_testing_only_12345';
process.env.JWT_REFRESH_EXPIRE = '7d';

// API Configuration
process.env.API_VERSION = 'v1';

// Encryption Keys
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars!!';
process.env.ENCRYPTION_IV = 'test_iv_16_char!';

// File Upload Configuration
process.env.MAX_FILE_SIZE = '10485760';
process.env.UPLOAD_PATH = './uploads';
process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,image/jpg,application/pdf';

// CORS Configuration
process.env.CORS_ORIGIN = '*';

// Rate Limiting - Disabled for tests
process.env.RATE_LIMIT_WINDOW = '15';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Logging
process.env.LOG_LEVEL = 'debug';
process.env.NODE_ENV = 'test'; // Keep it as test, not development

// Increase timeout for all tests
jest.setTimeout(30000);
