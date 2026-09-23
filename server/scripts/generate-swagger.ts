/**
 * Swagger kontraktini faylga yozadi: `docs/swagger.json`.
 *
 * Frontend backend kodini emas, shu faylni o'qiydi, shuning uchun
 * har bosqich oxirida `pnpm swagger:generate` bajariladi.
 *
 * Ilova tinglamaydi (`listen` chaqirilmaydi) — faqat hujjat quriladi,
 * shuning uchun port band bo'lishi muhim emas.
 */
import { NestFactory } from '@nestjs/core';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { AppModule } from '../src/app.module';
import { API_PREFIX, applyGlobalSetup, createSwaggerDocument } from '../src/app.setup';

const OUTPUT = resolve(__dirname, '../../docs/swagger.json');

async function main() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  applyGlobalSetup(app);
  await app.init();

  const document = createSwaggerDocument(app);

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  const paths = Object.keys(document.paths).length;
  const operations = Object.values(document.paths).reduce(
    (sum, item) =>
      sum +
      Object.keys(item).filter((method) =>
        ['get', 'post', 'patch', 'put', 'delete'].includes(method),
      ).length,
    0,
  );
  const schemas = Object.keys(document.components?.schemas ?? {}).length;

  console.log(`Swagger yozildi: ${OUTPUT}`);
  console.log(`  prefiks:      ${API_PREFIX}`);
  console.log(`  yo'llar:      ${paths}`);
  console.log(`  operatsiyalar: ${operations}`);
  console.log(`  sxemalar:     ${schemas}`);

  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
