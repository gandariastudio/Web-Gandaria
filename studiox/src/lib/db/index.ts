import { DATABASE_URL } from 'astro:env/server';
import { createDb, migrateDb, type DbHandle } from './client';
import { seedIfEmpty } from './seed';

let handle: Promise<DbHandle> | undefined;

async function init(): Promise<DbHandle> {
  const h = await createDb(DATABASE_URL, { allowLocal: import.meta.env.DEV });
  // The local PGlite database sets itself up on first use. Neon is migrated and seeded by
  // `npm run db:setup` / `npm run db:migrate`, never from a request.
  if (h.kind === 'pglite') {
    await migrateDb(h);
    await seedIfEmpty(h.db);
  }
  return h;
}

export function getDbHandle(): Promise<DbHandle> {
  handle ??= init().catch((error) => {
    handle = undefined;
    throw error;
  });
  return handle;
}

export async function getDb() {
  return (await getDbHandle()).db;
}

export type { Db } from './client';
