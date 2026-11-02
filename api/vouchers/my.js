import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { playerId, codes } = req.query || {};

  if (!playerId && !codes) {
    return res.status(400).json({ error: 'playerId ili codes parametar je obavezan.' });
  }

  const codeList = codes
    ? codes.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
    : [];

  if (!isDbConfigured()) {
    // Demo fallback: client uses local vouchers
    return res.status(200).json({
      success: true,
      isLiveDb: false,
      vouchers: []
    });
  }

  const sql = getDb();

  try {
    // Automatically update expired vouchers
    if (playerId) {
      await sql`
        UPDATE vouchers 
        SET status = 'EXPIRED'
        WHERE player_id = ${playerId} AND status = 'ACTIVE' AND expires_at < NOW();
      `;
    }

    let list = [];
    if (playerId && codeList.length > 0) {
      list = await sql`
        SELECT * FROM vouchers 
        WHERE player_id = ${playerId} OR voucher_code = ANY(${codeList})
        ORDER BY 
          CASE WHEN status = 'ACTIVE' THEN 1 WHEN status = 'REDEEMED' THEN 2 ELSE 3 END,
          created_at DESC;
      `;
    } else if (playerId) {
      list = await sql`
        SELECT * FROM vouchers 
        WHERE player_id = ${playerId}
        ORDER BY 
          CASE WHEN status = 'ACTIVE' THEN 1 WHEN status = 'REDEEMED' THEN 2 ELSE 3 END,
          created_at DESC;
      `;
    } else if (codeList.length > 0) {
      list = await sql`
        SELECT * FROM vouchers 
        WHERE voucher_code = ANY(${codeList})
        ORDER BY 
          CASE WHEN status = 'ACTIVE' THEN 1 WHEN status = 'REDEEMED' THEN 2 ELSE 3 END,
          created_at DESC;
      `;
    }

    return res.status(200).json({
      success: true,
      isLiveDb: true,
      vouchers: list || []
    });
  } catch (error) {
    console.error('Fetch my vouchers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri preuzimanju vaučera: ' + error.message
    });
  }
}
