import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    voucherCode,
    operatorName = 'Operater',
    location = 'Grand Slot Club',
    confirm = false
  } = req.body || {};

  if (!voucherCode) {
    return res.status(400).json({ error: 'Kod vaučera je obavezan.' });
  }

  const cleanCode = voucherCode.trim().toUpperCase();

  if (!isDbConfigured()) {
    // Realistic demo fallback for testing scanner without cloud db
    const isMockExpired = cleanCode.includes('EXP');
    const isMockRedeemed = cleanCode.includes('USED');

    if (isMockExpired) {
      return res.status(200).json({
        success: false,
        expired: true,
        error: 'Vaučeru je ISTEKAO rok važenja!'
      });
    }

    if (isMockRedeemed) {
      return res.status(200).json({
        success: false,
        alreadyRedeemed: true,
        redeemedBy: 'Jelena - Šank',
        redeemedAt: new Date(Date.now() - 3600000).toISOString(),
        redeemedLocation: 'Grand Slot Club - Glavni Šank',
        error: 'Vaučer je VEĆ ISKORIŠĆEN!'
      });
    }

    if (!confirm) {
      return res.status(200).json({
        success: true,
        valid: true,
        simulated: true,
        player: {
          id: 'gsc_usr_7891',
          nickname: 'Bojan K.',
          vip_tier: 'VIP'
        },
        voucher: {
          id: 'vch_demo_1',
          voucher_code: cleanCode,
          title: 'VIP Promo Tiket 1.000 RSD',
          description: '1.000 RSD Promo Tiket za aparate u klubu',
          reward_type: 'club_ticket',
          reward_value: 1000,
          location: 'Grand Slot Club - Kralja Milana 12, Beograd',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'ACTIVE'
        }
      });
    }

    // Confirm simulation
    return res.status(200).json({
      success: true,
      redeemed: true,
      simulated: true,
      voucher: {
        voucher_code: cleanCode,
        title: 'VIP Promo Tiket 1.000 RSD',
        reward_value: 1000,
        status: 'REDEEMED',
        redeemed_at: new Date().toISOString(),
        redeemed_by_operator: operatorName,
        redeemed_location: location
      },
      message: `✅ Uspešno izdat fizički vaučer! Operater: ${operatorName}`
    });
  }

  const sql = getDb();

  try {
    // 1. Fetch voucher with player info
    const rows = await sql`
      SELECT v.*, p.nickname, p.vip_tier, p.last_seen_at
      FROM vouchers v
      LEFT JOIN players p ON v.player_id = p.id
      WHERE v.voucher_code = ${cleanCode}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Nevažeći kod vaučera: [${cleanCode}]. Kod ne postoji u sistemu.`
      });
    }

    const v = rows[0];

    // Check if already redeemed
    if (v.status === 'REDEEMED') {
      return res.status(400).json({
        success: false,
        alreadyRedeemed: true,
        redeemedBy: v.redeemed_by_operator || 'Operater',
        redeemedAt: v.redeemed_at,
        redeemedLocation: v.redeemed_location || v.location,
        error: `Vaučer je VEĆ ISKORIŠĆEN! Iskorišćen dana ${new Date(v.redeemed_at).toLocaleString('sr-RS')} (Operater: ${v.redeemed_by_operator || 'N/A'}).`
      });
    }

    // Check if expired
    if (v.status === 'EXPIRED' || new Date(v.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        expired: true,
        expiresAt: v.expires_at,
        error: `Vaučeru je ISTEKAO rok važenja (${new Date(v.expires_at).toLocaleString('sr-RS')})!`
      });
    }

    // 2. If not confirmed yet, return inspection data for operator preview
    if (!confirm) {
      return res.status(200).json({
        success: true,
        valid: true,
        player: {
          id: v.player_id,
          nickname: v.nickname || 'Gost',
          vip_tier: v.vip_tier || 'STANDARD'
        },
        voucher: {
          id: v.id,
          voucher_code: v.voucher_code,
          title: v.title,
          description: v.description,
          reward_type: v.reward_type,
          reward_value: v.reward_value,
          location: v.location,
          expires_at: v.expires_at,
          status: v.status
        }
      });
    }

    // 3. Confirm and execute atomic redemption
    const updated = await sql`
      UPDATE vouchers
      SET 
        status = 'REDEEMED',
        redeemed_at = NOW(),
        redeemed_by_operator = ${operatorName},
        redeemed_location = ${location}
      WHERE id = ${v.id} AND status = 'ACTIVE'
      RETURNING *;
    `;

    if (!updated || updated.length === 0) {
      return res.status(409).json({
        success: false,
        error: 'Vaučer je u međuvremenu već iskorišćen na drugom mestu.'
      });
    }

    return res.status(200).json({
      success: true,
      redeemed: true,
      voucher: updated[0],
      player: {
        id: v.player_id,
        nickname: v.nickname || 'Gost',
        vip_tier: v.vip_tier || 'STANDARD'
      },
      message: `✅ Uspešno izdat fizički vaučer! Operater: ${operatorName}`
    });

  } catch (error) {
    console.error('Voucher redeem error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri verifikaciji vaučera: ' + error.message
    });
  }
}
