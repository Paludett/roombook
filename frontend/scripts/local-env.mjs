// Gera src/environments/environment.local.ts (gitignored) a partir de API_PORT / API_URL.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const env = { ...process.env };
const wt = new URL('../../.wt.env', import.meta.url);
if (existsSync(wt)) {
  for (const l of readFileSync(wt, 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m && !(m[1] in env)) env[m[1]] = m[2];
  }
}
const apiUrl = env.API_URL || `http://localhost:${env.API_PORT ?? 8080}`;
writeFileSync(
  new URL('../src/environments/environment.local.ts', import.meta.url),
  `export const environment = {\n  apiUrl: '${apiUrl}',\n};\n`,
);
console.log(`environment.local.ts -> apiUrl=${apiUrl}`);
