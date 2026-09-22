import { defineConfig } from 'orval';

/**
 * Tiplar va TanStack Query hooklari FAQAT ../docs/swagger.json dan generatsiya qilinadi.
 * Faylni yangilash: `pnpm api:fetch` (backend ishlab turgan bo'lishi kerak).
 *
 * Generatsiya natijasi qo'lda tahrirlanmaydi.
 */
export default defineConfig({
  hisobx: {
    input: {
      target: '../docs/swagger.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/lib/api/generated/endpoints.ts',
      schemas: 'src/lib/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/api/client.ts',
          name: 'apiMutator',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write src/lib/api/generated',
    },
  },
});
