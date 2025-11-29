// MSW v2 server setup for Node.js (Jest/testing)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// This configures a request mocking server with the given request handlers.
// MSW v2 compatible setup
export const server = setupServer(...handlers);
