-- ==============================================================================
-- Grand Slot Club - Neon Serverless PostgreSQL Database Schema
-- Run this script in the Neon SQL Editor or via /api/db/init
-- ==============================================================================

-- 1. Players Registry (CRM & Telemetry)
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

-- Fast lookup indexes for player CRM segmentation
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_vip ON players (vip_tier);
CREATE INDEX IF NOT EXISTS idx_players_push ON players (is_push_enabled);
CREATE INDEX IF NOT EXISTS idx_players_turnover ON players (total_turnover DESC);

-- 2. Push Notification Marketing Campaigns History
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

CREATE INDEX IF NOT EXISTS idx_campaigns_created ON push_campaigns (created_at DESC);

-- 3. Omnichannel VIP Vouchers & Club Physical Redemptions
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

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers (voucher_code);
CREATE INDEX IF NOT EXISTS idx_vouchers_player ON vouchers (player_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers (status);
CREATE INDEX IF NOT EXISTS idx_vouchers_redeemed ON vouchers (redeemed_at DESC);

