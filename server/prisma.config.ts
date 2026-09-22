import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { env } from './src/config';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env.DB_URI,
  },
});
