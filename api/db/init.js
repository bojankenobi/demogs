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
        username VARCHAR(64) UNIQUE NULL,
        nickname VARCHAR(64),
        password_hash VARCHAR(255) NULL,
        phone VARCHAR(32) NULL,
        balance_rsd NUMERIC(14, 2) DEFAULT 1000.00,
        vip_tier VARCHAR(32) DEFAULT 'STANDARD',
        total_turnover NUMERIC(14, 2) DEFAULT 0.00,
        total_spins INTEGER DEFAULT 0,
        total_wins NUMERIC(14, 2) DEFAULT 0.00,
        favorite_game VARCHAR(32) DEFAULT 'royal3x3',
        device_info JSONB DEFAULT '{}'::jsonb,
        push_subscription JSONB DEFAULT NULL,
        is_push_enabled BOOLEAN DEFAULT FALSE,
        auth_token VARCHAR(128) NULL,
        is_verified_18 BOOLEAN DEFAULT TRUE,
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Ensure columns exist if table was created previously
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS username VARCHAR(64);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS phone VARCHAR(32);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS balance_rsd NUMERIC(14, 2) DEFAULT 1000.00;`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS auth_token VARCHAR(128);`;
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_verified_18 BOOLEAN DEFAULT TRUE;`;

    // 2. Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players (last_seen_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_vip ON players (vip_tier);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_push ON players (is_push_enabled);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_turnover ON players (total_turnover DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_username ON players (username);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_phone ON players (phone);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_players_token ON players (auth_token);`;

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

    // 5. Create scanner_locations table
    await sql`
      CREATE TABLE IF NOT EXISTS scanner_locations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        code VARCHAR(32) UNIQUE NOT NULL,
        address VARCHAR(255) NULL,
        city VARCHAR(64) DEFAULT 'Beograd',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_scanner_loc_active ON scanner_locations (is_active);`;

    // 6. Create scanner_operators table
    await sql`
      CREATE TABLE IF NOT EXISTS scanner_operators (
        id VARCHAR(64) PRIMARY KEY,
        location_id VARCHAR(64) REFERENCES scanner_locations(id) ON DELETE CASCADE,
        full_name VARCHAR(128) NOT NULL,
        username VARCHAR(64) UNIQUE NOT NULL,
        pin_code VARCHAR(32) NOT NULL,
        role VARCHAR(64) DEFAULT 'Šank / Bar',
        is_active BOOLEAN DEFAULT TRUE,
        total_scans INTEGER DEFAULT 0,
        last_active_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_scanner_op_loc ON scanner_operators (location_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_scanner_op_user ON scanner_operators (username);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_scanner_op_active ON scanner_operators (is_active);`;

    // 7. Seed Initial Locations
    await sql`
      INSERT INTO scanner_locations (id, name, code, address, city, is_active)
      VALUES 
        ('loc_bg_centar', 'Grand Slot Beograd - Centar', 'BG-01', 'Kralja Milana 12, Beograd', 'Beograd', TRUE),
        ('loc_bg_nbg', 'Grand Slot Novi Beograd', 'BG-02', 'Bulevar Mihajla Pupina 10, Novi Beograd', 'Beograd', TRUE),
        ('loc_ns_centar', 'Grand Slot Novi Sad', 'NS-01', 'Zmaj Jovina 8, Novi Sad', 'Novi Sad', TRUE),
        ('loc_nis_centar', 'Grand Slot Niš', 'NI-01', 'Obrenovićeva 22, Niš', 'Niš', TRUE)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        address = EXCLUDED.address,
        city = EXCLUDED.city;
    `;

    // 8. Seed Initial Operators per Location
    await sql`
      INSERT INTO scanner_operators (id, location_id, full_name, username, pin_code, role, is_active)
      VALUES
        ('op_bg1_marko', 'loc_bg_centar', 'Marko Petrović', 'marko.bg1', '1234', 'Šank 1', TRUE),
        ('op_bg1_jelena', 'loc_bg_centar', 'Jelena Jovanović', 'jelena.bg1', '4321', 'Glavna Blagajna', TRUE),
        ('op_bg2_nikola', 'loc_bg_nbg', 'Nikola Stanković', 'nikola.nbg', '2580', 'Slot Sala', TRUE),
        ('op_ns1_milan', 'loc_ns_centar', 'Milan Popović', 'milan.ns', '9876', 'Šank & Kasa', TRUE)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    `;

    // 9. Seed God Tier Operator Account
    await sql`
      INSERT INTO players (
        id, username, nickname, balance_rsd, vip_tier, total_turnover, total_spins, total_wins
      ) VALUES (
        'gsc_usr_god', 'god', '⚡ GOD OPERATOR', 1000000.00, 'GOD', 9999999, 9999, 9999999
      ) ON CONFLICT (id) DO UPDATE SET
        balance_rsd = 1000000.00,
        vip_tier = 'GOD';
    `;

    return res.status(200).json({
      success: true,
      message: 'Neon PostgreSQL šema je uspešno inicijalizovana (players, push_campaigns, vouchers, scanner_locations, scanner_operators).'
    });
  } catch (error) {
    console.error('Database init error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri inicijalizaciji baze: ' + error.message
    });
  }
}
