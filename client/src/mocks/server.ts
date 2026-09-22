import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Vitest testlari uchun mock server. */
export const server = setupServer(...handlers);
