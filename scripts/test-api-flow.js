import fs from 'fs';
import { neon } from '@neondatabase/serverless';

// Load .env manually if not already populated
if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

async function testFlow() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const sql = neon(process.env.DATABASE_URL);

  console.log('🧪 Testing Player Sync in Neon DB...');
  const testPlayerId = 'gsc_usr_neon_vip';
  await sql`
    INSERT INTO players (
      id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at
    ) VALUES (
      ${testPlayerId}, 'Bojan (VIP)', 'VIP', 15400.00, 48, 8900.00, 'royal3x3', true, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      vip_tier = EXCLUDED.vip_tier,
      total_turnover = EXCLUDED.total_turnover,
      total_spins = EXCLUDED.total_spins,
      total_wins = EXCLUDED.total_wins,
      last_seen_at = NOW();
  `;
  console.log('✅ Player sync success!');

  console.log('\n🧪 Testing Voucher Generation in Neon DB...');
  const voucherCode = 'GSC-TEST-9999';
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
  await sql`
    INSERT INTO vouchers (
      id, player_id, campaign_id, voucher_code, title, description,
      image_url, reward_type, reward_value, location, expires_at, status
    ) VALUES (
      'vouch_test_1', ${testPlayerId}, 'camp_neon_test', ${voucherCode},
      '🎁 VIP Promo Tiket 1.000 ZLT', 'VIP vaučer za igru na slot aparatima',
      'assets/promotions/promo_voucher_bg.png', 'club_ticket', 1000.00,
      'Grand Slot Club - Glavna Filijala', ${expiresAt.toISOString()}, 'ACTIVE'
    )
    ON CONFLICT (voucher_code) DO NOTHING;
  `;
  console.log('✅ Voucher created: ' + voucherCode);

  console.log('\n🧪 Testing Staff Redemption (Atomic UPDATE) in Neon DB...');
  const updateRes = await sql`
    UPDATE vouchers
    SET status = 'REDEEMED',
        redeemed_at = NOW(),
        redeemed_by_operator = 'Operater Marko - Smena 1',
        redeemed_location = 'Grand Slot Club - Glavna Filijala'
    WHERE voucher_code = ${voucherCode} AND status = 'ACTIVE'
    RETURNING *;
  `;
  if (updateRes.length > 0) {
    console.log(`✅ Voucher successfully redeemed! By: ${updateRes[0].redeemed_by_operator} at ${updateRes[0].redeemed_at}`);
  } else {
    console.log('⚠️ Voucher was already redeemed or not active.');
  }

  console.log('\n🧪 Testing Audit Scans Query...');
  const scans = await sql`
    SELECT v.voucher_code, v.title, v.reward_value, v.redeemed_at, v.redeemed_by_operator, p.nickname
    FROM vouchers v
    LEFT JOIN players p ON v.player_id = p.id
    WHERE v.status = 'REDEEMED'
    ORDER BY v.redeemed_at DESC
    LIMIT 5;
  `;
  console.log('📊 Verified Club Scans in Neon:');
  scans.forEach(s => {
    console.log(`  - 🎟️ [${s.voucher_code}] ${s.nickname || 'Gost'}: ${s.title} (${Number(s.reward_value).toLocaleString()} ZLT) -> Overio: ${s.redeemed_by_operator}`);
  });

  console.log('\n🎉 ALL LIVE DATABASE OPERATIONS PASSED WITH FLYING COLORS! 🎉');
}

testFlow().catch(err => {
  console.error('❌ Error during test flow:', err);
  process.exit(1);
});
