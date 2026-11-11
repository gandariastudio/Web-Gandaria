/**
 * One-time Neon setup with the neonctl CLI:
 *   1. log in (opens the browser) if needed
 *   2. pick the Neon organization (the only one, or --org <id> / NEON_ORG_ID)
 *   3. find or create the "gandaria-studio" project in Singapore
 *   4. migrate + seed the default branch (production)
 *   5. find or create a "dev" branch from it for local work
 *   6. write the dev connection string to .env as DATABASE_URL
 * Safe to run again.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createDb, migrateDb } from '../src/lib/db/client';
import { seedIfEmpty } from '../src/lib/db/seed';
import { loadEnv } from './env';

const PROJECT_NAME = 'gandaria-studio';
const REGION = 'aws-ap-southeast-1';
const NEONCTL = 'node_modules/.bin/neonctl';

function neon(args: string[], { json = true, interactive = false } = {}) {
  const r = spawnSync(NEONCTL, json ? [...args, '--output', 'json'] : args, {
    encoding: 'utf8',
    stdio: interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (r.status !== 0) throw new Error(`neonctl ${args.join(' ')} failed:\n${r.stderr || r.stdout || ''}`);
  return json && !interactive ? JSON.parse(r.stdout) : r.stdout?.trim();
}

const list = (out: any, key: string): any[] => (Array.isArray(out) ? out : (out?.[key] ?? []));

/** neonctl prompts for an organization unless one is given, which a script cannot answer. */
function pickOrg(): string | undefined {
  const flag = process.argv.indexOf('--org');
  const wanted = (flag >= 0 ? process.argv[flag + 1] : undefined) ?? process.env.NEON_ORG_ID;
  const orgs = list(neon(['orgs', 'list']), 'organizations') as { id: string; name: string }[];
  if (wanted) {
    if (!orgs.some((o) => o.id === wanted)) throw new Error(`Neon organization "${wanted}" not found. Available: ${orgs.map((o) => o.id).join(', ') || 'none'}`);
    return wanted;
  }
  if (orgs.length === 0) return undefined; // personal account without organizations
  if (orgs.length === 1) return orgs[0].id;
  console.log('Your Neon account has several organizations. Run again with one of them:');
  for (const o of orgs) console.log(`  npm run db:setup -- --org ${o.id}   (${o.name})`);
  process.exit(1);
}

function ensureLogin() {
  const me = spawnSync(NEONCTL, ['me', '--output', 'json'], { encoding: 'utf8' });
  if (me.status === 0) return;
  console.log('Opening the browser to log in to Neon…');
  neon(['auth'], { json: false, interactive: true });
}

async function migrateAndSeed(label: string, url: string) {
  const handle = await createDb(url, { allowLocal: false });
  await migrateDb(handle);
  const seeded = await seedIfEmpty(handle.db);
  console.log(`  ${label}: migrated${seeded ? ', sample content added' : ', existing content kept'}`);
  await handle.close();
}

function writeEnv(key: string, value: string) {
  const file = '.env';
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n') : [];
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i >= 0) lines[i] = `${key}=${value}`;
  else lines.push(`${key}=${value}`);
  fs.writeFileSync(file, lines.join('\n').replace(/\n*$/, '\n'));
}

loadEnv();
ensureLogin();
const orgId = pickOrg();
const orgArgs = orgId ? ['--org-id', orgId] : [];
if (orgId) console.log(`Organization: ${orgId}`);

let project = list(neon(['projects', 'list', ...orgArgs]), 'projects').find((p) => p.name === PROJECT_NAME);
if (!project) {
  console.log(`Creating Neon project "${PROJECT_NAME}" in ${REGION}…`);
  const out = neon(['projects', 'create', '--name', PROJECT_NAME, '--region-id', REGION, ...orgArgs]);
  project = out.project ?? out;
}
const projectId: string = project.id;
console.log(`Project: ${PROJECT_NAME} (${projectId})`);

let branches = list(neon(['branches', 'list', '--project-id', projectId]), 'branches');
const main = branches.find((b) => b.default || b.primary) ?? branches[0];
const mainUrl = neon(['connection-string', main.name, '--project-id', projectId], { json: false }) as string;
await migrateAndSeed(`branch "${main.name}" (production)`, mainUrl);

if (!branches.some((b) => b.name === 'dev')) {
  console.log('Creating branch "dev" from production…');
  neon(['branches', 'create', '--project-id', projectId, '--name', 'dev', '--parent', main.name]);
  branches = list(neon(['branches', 'list', '--project-id', projectId]), 'branches');
}
const devUrl = neon(['connection-string', 'dev', '--project-id', projectId], { json: false }) as string;
await migrateAndSeed('branch "dev" (local)', devUrl);

writeEnv('DATABASE_URL', devUrl);
console.log('\nWrote DATABASE_URL (dev branch) to .env.');
console.log(`For Vercel, set DATABASE_URL to the production branch connection string:\n  ${NEONCTL} connection-string ${main.name} --project-id ${projectId}`);
