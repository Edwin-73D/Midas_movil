import * as schema from './schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

/**
 * Web: expo-sqlite is not available. Repositories use safe no-ops;
 * Drizzle `db` is null — data layer must guard before querying.
 */
const noopSqlite = {
  runSync: () => {},
  getAllSync: () => [] as unknown[],
  getFirstSync: () => ({ count: 0 }) as { count: number },
  runAsync: async () => {},
  execSync: () => {},
};

export const db: ExpoSQLiteDatabase<typeof schema> | null = null;

export default noopSqlite;
