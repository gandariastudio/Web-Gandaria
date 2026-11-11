import { createDb, migrateDb } from '../src/lib/db/client';
import { loadEnv } from './env';

loadEnv();
const url = process.argv[2] ?? process.env.DATABASE_URL;
const handle = await createDb(url || undefined, { allowLocal: true });
if (handle.kind === 'pglite') console.log('No DATABASE_URL: migrating the local PGlite database (stop `npm run dev` first).');
await migrateDb(handle);
console.log(`Migrations applied (${handle.kind}).`);
await handle.close();
