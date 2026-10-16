import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { limit = 30 } = req.query || {};

  if (!isDbConfigured()) {
    const now = Date.now();
    return res.status(200).json({
      success: true,
      isLiveDb: false,
      scans: [
        {
          id: 'vch_sc_1',
          voucher_code: 'GSC-8819-VIP',
          title: 'VIP Promo Tiket 1.000 ZLT',
          reward_value: '1000.00',
          player_id: 'gsc_usr_7891',
          nickname: 'Bojan K.',
          vip_tier: 'VIP',
          redeemed_by_operator: 'Marko - Šank 1',
          redeemed_location: 'Grand Slot Club - Kralja Milana',
          redeemed_at: new Date(now - 14 * 60000).toISOString()
        },
        {
          id: 'vch_sc_2',
          voucher_code: 'GSC-3342-DRK',
          title: 'VIP Welcome Koktel & Piće',
          reward_value: '500.00',
          player_id: 'gsc_usr_3342',
          nickname: 'Nikola_VIP',
          vip_tier: 'VIP',
          redeemed_by_operator: 'Jelena - Blagajna',
          redeemed_location: 'Grand Slot Club - VIP Salon',
          redeemed_at: new Date(now - 48 * 60000).toISOString()
        }
      ]
    });
  }

  const sql = getDb();

  try {
    const scans = await sql`
      SELECT 
        v.id,
        v.voucher_code,
        v.title,
        v.reward_type,
        v.reward_value,
        v.player_id,
        COALESCE(p.nickname, 'Gost') as nickname,
        COALESCE(p.vip_tier, 'STANDARD') as vip_tier,
        v.redeemed_by_operator,
        v.redeemed_location,
        v.redeemed_at
      FROM vouchers v
      LEFT JOIN players p ON v.player_id = p.id
      WHERE v.status = 'REDEEMED'
      ORDER BY v.redeemed_at DESC
      LIMIT ${Number(limit) || 30};
    `;

    return res.status(200).json({
      success: true,
      isLiveDb: true,
      scans: scans || []
    });
  } catch (error) {
    console.error('Audit scans error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri čitanju dnevnika skeniranja: ' + error.message
    });
  }
}
