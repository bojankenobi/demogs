import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in environment!');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon PostgreSQL...');
  const sql = neon(databaseUrl);

  try {
    // 1. Check basic connectivity
    const timeRes = await sql`SELECT NOW() as current_time, version() as pg_version;`;
    console.log('✅ Connected successfully to Neon DB!');
    console.log(`🕒 Server Time: ${timeRes[0].current_time}`);
    console.log(`📦 PostgreSQL Version: ${timeRes[0].pg_version.split(' ')[0]} ${timeRes[0].pg_version.split(' ')[1]}`);

    // 2. Read and apply schema.sql
    console.log('\n📄 Reading and applying schema.sql...');
    const schemaPath = path.resolve('schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Execute table migrations
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(64) PRIMARY KEY,
        nickname VARCHAR(64),
        vip_tier VARCHAR(32) DEFAULT 'STANDARD',
        total_turnover NUMERIC(14, 2) DEFAULT 0.00,
        total_spins INTEGER DEFAULT 0,
        total_wins NUMERIC(14, 2) DEFAULT 0.00,
        favorite_game VARCHAR(32) DEFAULT 'royal3x3',
        device_info JSONB DEFAULT '{}'::jsonb,
        push_subscription JSONB DEFAULT NULL,
        is_push_enabled BOOLEAN DEFAULT FALSE,
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('  ✔️ Table "players" created/verified.');

    await sql`CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players (last_seen_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_vip ON players (vip_tier);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_push ON players (is_push_enabled);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_turnover ON players (total_turnover DESC);`;
    console.log('  ✔️ Indexes for "players" created/verified.');

    await sql`
      CREATE TABLE IF NOT EXISTS push_campaigns (
        id SERIAL PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        body TEXT NOT NULL,
        target_type VARCHAR(32) DEFAULT 'all',
        target_player_id VARCHAR(64) NULL,
        promo_action VARCHAR(32) DEFAULT 'none',
        promo_value INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('  ✔️ Table "push_campaigns" created/verified.');

    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_created ON push_campaigns (created_at DESC);`;
    console.log('  ✔️ Indexes for "push_campaigns" created/verified.');

    await sql`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(64) PRIMARY KEY,
        player_id VARCHAR(64) NOT NULL,
        campaign_id VARCHAR(64) NULL,
        voucher_code VARCHAR(64) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        image_url TEXT NULL,
        reward_type VARCHAR(64) NOT NULL DEFAULT 'club_ticket',
        reward_value NUMERIC(10, 2) DEFAULT 0.00,
        location VARCHAR(255) DEFAULT 'Grand Slot Club',
        expires_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        redeemed_at TIMESTAMPTZ NULL,
        redeemed_by_operator VARCHAR(255) NULL,
        redeemed_location VARCHAR(255) NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('  ✔️ Table "vouchers" created/verified.');

    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers (voucher_code);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_player ON vouchers (player_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers (status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_redeemed ON vouchers (redeemed_at DESC);`;
    console.log('  ✔️ Indexes for "vouchers" created/verified.');

    // 3. Verify tables exist in information_schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('\n📊 Tables in public schema:');
    tables.forEach(t => console.log(`  - 📋 ${t.table_name}`));

    console.log('\n✨ ALL MIGRATIONS COMPLETED SUCCESSFULLY! Neon DB is 100% READY! ✨');

  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

main();
