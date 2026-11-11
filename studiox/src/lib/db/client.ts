import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type DbKind = 'neon' | 'pglite';
export type DbHandle = { db: Db; kind: DbKind; close: () => Promise<void> };

export const MIGRATIONS_FOLDER = 'drizzle';

/**
 * Neon when a connection string is given. Otherwise the embedded PGlite database, which is
 * only allowed for local development and tests (`allowLocal`).
 */
export async function createDb(url: string | undefined, opts: { allowLocal: boolean; localDir?: string }): Promise<DbHandle> {
  if (url) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    return { db: drizzle(neon(url), { schema }) as unknown as Db, kind: 'neon', close: async () => {} };
  }
  if (!opts.allowLocal) {
    throw new Error('DATABASE_URL is not set. Add the Neon connection string to the environment (run `npm run db:setup` locally).');
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const dir = opts.localDir ?? '.data/pglite';
  if (!dir.includes('://')) {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(dir, { recursive: true });
  }
  const client = new PGlite(dir);
  return { db: drizzle(client, { schema }) as unknown as Db, kind: 'pglite', close: () => client.close() };
}

export async function migrateDb({ db, kind }: DbHandle, migrationsFolder = MIGRATIONS_FOLDER) {
  if (kind === 'neon') {
    const { migrate } = await import('drizzle-orm/neon-http/migrator');
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(db as never, { migrationsFolder });
  }
}
