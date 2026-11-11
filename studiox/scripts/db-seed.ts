import { createDb, migrateDb } from '../src/lib/db/client';
import { resetContent, seed, seedIfEmpty } from '../src/lib/db/seed';
import { loadEnv } from './env';

loadEnv();
const reset = process.argv.includes('--reset');
const url = process.argv.find((a) => a.startsWith('postgres')) ?? process.env.DATABASE_URL;
const handle = await createDb(url || undefined, { allowLocal: true });
await migrateDb(handle);
if (reset) {
  await resetContent(handle.db);
  await seed(handle.db);
  console.log(`Content reset to the sample content (${handle.kind}).`);
} else {
  const seeded = await seedIfEmpty(handle.db);
  console.log(seeded ? `Sample content added (${handle.kind}).` : `Database already has content; nothing changed (${handle.kind}). Use --reset to replace it.`);
}
await handle.close();
