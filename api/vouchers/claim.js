import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    playerId,
    campaignId = 'vip_welcome',
    title = 'Grand Slot VIP Vaučer',
    description = '1.000 ZLT Promo Tiket za igru na slot aparatima u klubu',
    imageUrl = 'assets/symbols/crystal-spade-clean.png',
    rewardType = 'club_ticket',
    rewardValue = 1000,
    location = 'Grand Slot Club - Kralja Milana 12, Beograd',
    validHours = 48
  } = req.body || {};

  if (!playerId) {
    return res.status(400).json({ error: 'playerId je obavezan parametar.' });
  }

  const voucherId = 'vch_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const voucherCode = `GSC-${randomSuffix}-VIP`;
  const expiresAt = new Date(Date.now() + (Number(validHours) || 48) * 3600000).toISOString();

  const voucherData = {
    id: voucherId,
    player_id: playerId,
    campaign_id: campaignId,
    voucher_code: voucherCode,
    title,
    description,
    image_url: imageUrl,
    reward_type: rewardType,
    reward_value: Number(rewardValue) || 1000,
    location,
    expires_at: expiresAt,
    status: 'ACTIVE',
    redeemed_at: null,
    redeemed_by_operator: null,
    redeemed_location: null,
    created_at: new Date().toISOString()
  };

  if (!isDbConfigured()) {
    // Demo/offline fallback: returns valid voucher data that client saves in localStorage
    return res.status(200).json({
      success: true,
      persisted: false,
      message: 'Vaučer uspešno aktiviran (demo režim).',
      voucher: voucherData
    });
  }

  const sql = getDb();

  try {
    // Check if player already has active voucher for this campaign
    const existing = await sql`
      SELECT * FROM vouchers 
      WHERE player_id = ${playerId} AND campaign_id = ${campaignId} AND status = 'ACTIVE' AND expires_at > NOW()
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      return res.status(200).json({
        success: true,
        alreadyClaimed: true,
        message: 'Već imate aktivan vaučer za ovu promociju!',
        voucher: existing[0]
      });
    }

    const inserted = await sql`
      INSERT INTO vouchers (
        id, player_id, campaign_id, voucher_code, title, description,
        image_url, reward_type, reward_value, location, expires_at, status
      )
      VALUES (
        ${voucherId}, ${playerId}, ${campaignId}, ${voucherCode}, ${title}, ${description},
        ${imageUrl}, ${rewardType}, ${Number(rewardValue) || 1000}, ${location}, ${expiresAt}, 'ACTIVE'
      )
      RETURNING *;
    `;

    return res.status(200).json({
      success: true,
      persisted: true,
      message: 'Vaučer uspešno aktiviran i sačuvan u bazi!',
      voucher: inserted[0]
    });
  } catch (error) {
    console.error('Voucher claim error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri generisanju vaučera: ' + error.message
    });
  }
}
