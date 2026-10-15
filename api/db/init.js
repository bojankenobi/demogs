import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isDbConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'DATABASE_URL nije podešen u Vercel Environment Variables. Dodajte Neon konekcioni string.'
    });
  }

  const sql = getDb();

  try {
    // 1. Create players table
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

    // 2. Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players (last_seen_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_vip ON players (vip_tier);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_push ON players (is_push_enabled);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_turnover ON players (total_turnover DESC);`;

    // 3. Create push_campaigns table
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

    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_created ON push_campaigns (created_at DESC);`;

    // 4. Create vouchers table
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

    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers (voucher_code);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_player ON vouchers (player_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers (status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_redeemed ON vouchers (redeemed_at DESC);`;

    return res.status(200).json({
      success: true,
      message: 'Neon PostgreSQL šema je uspešno inicijalizovana (players, push_campaigns, vouchers).'
    });
  } catch (error) {
    console.error('Database init error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri inicijalizaciji baze: ' + error.message
    });
  }
}
