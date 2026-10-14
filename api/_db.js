import { neon, neonConfig } from '@neondatabase/serverless';

// Cache connection
let sql = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }

  if (!sql) {
    try {
      sql = neon(databaseUrl);
    } catch (err) {
      console.error('Failed to initialize Neon Postgres client:', err);
      return null;
    }
  }

  return sql;
}

/**
 * Checks if Neon database connection is configured
 */
export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
