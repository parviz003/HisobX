/**
 * Backend'dan Swagger JSON ni olib, ../docs/swagger.json ga saqlaydi.
 * Manzil: client/.env dagi VITE_PROXY_TARGET (standart http://localhost:3010).
 *
 * Ishlatish: pnpm api:fetch   (backend ishlab turgan bo'lishi kerak)
 */
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(here, '..');
const outFile = resolve(clientRoot, '../docs/swagger.json');

async function readEnvTarget() {
  for (const file of ['.env.local', '.env']) {
    try {
      const text = await readFile(resolve(clientRoot, file), 'utf8');
      const match = text.match(/^VITE_PROXY_TARGET\s*=\s*(.+)$/m);
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    } catch {
      // Fayl yo'q bo'lsa keyingisiga o'tamiz.
    }
  }
  return 'http://localhost:3010';
}

const target = process.env.VITE_PROXY_TARGET || (await readEnvTarget());
const url = `${target.replace(/\/$/, '')}/api/v1/docs-json`;

console.log(`Swagger olinmoqda: ${url}`);

let response;
try {
  response = await fetch(url);
} catch (error) {
  console.error(
    `\nBackend'ga ulanib bo'lmadi (${url}).\n` +
      `Avval backend'ni ishga tushiring:  cd ../server && pnpm start:dev\n`,
  );
  console.error(error.message);
  process.exit(1);
}

if (!response.ok) {
  console.error(`Backend ${response.status} qaytardi.`);
  process.exit(1);
}

const spec = await response.json();
await writeFile(outFile, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');

const pathCount = Object.keys(spec.paths ?? {}).length;
console.log(`Saqlandi: ${outFile} (${pathCount} ta endpoint)`);
