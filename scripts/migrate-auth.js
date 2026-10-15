import { neon } from '@neondatabase/serverless';

async function migrateAuth() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set!');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log('🔄 Applying Auth columns to "players" table in Neon DB...');

  try {
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS username VARCHAR(64);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS phone VARCHAR(32);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS balance_rsd NUMERIC(14, 2) DEFAULT 1000.00;`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS auth_token VARCHAR(128);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_verified_18 BOOLEAN DEFAULT TRUE;`;

    console.log('  ✔️ Added auth columns: username, password_hash, phone, balance_rsd, auth_token, is_verified_18.');

    // Add unique constraint on username if not exists
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'players_username_unique'
        ) THEN
          ALTER TABLE players ADD CONSTRAINT players_username_unique UNIQUE (username);
        END IF;
      END $$;
    `;
    console.log('  ✔️ Constraint "players_username_unique" ensured.');

    await sql`CREATE INDEX IF NOT EXISTS idx_players_username ON players (username);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_phone ON players (phone);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_token ON players (auth_token);`;
    console.log('  ✔️ Indexes created for fast credential lookups.');

    console.log('✨ Neon DB Auth Migration completed successfully! ✨');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrateAuth();
