import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.body && req.body.token) {
    token = String(req.body.token).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Nedostaje autorizacioni token.' });
  }

  if (!isDbConfigured()) {
    return res.status(200).json({
      success: true,
      player: {
        id: 'gsc_usr_demo',
        username: 'Demo Player',
        nickname: 'Demo Player',
        balance_rsd: 1000.00,
        vip_tier: 'STANDARD'
      }
    });
  }

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT id, username, nickname, phone, balance_rsd, vip_tier, 
             total_turnover, total_spins, total_wins, favorite_game, is_push_enabled
      FROM players 
      WHERE auth_token = ${token}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Sesija je istekla. Molimo prijavite se ponovo.' });
    }

    const player = rows[0];

    // Refresh last_seen_at
    await sql`UPDATE players SET last_seen_at = NOW() WHERE id = ${player.id};`;

    return res.status(200).json({
      success: true,
      player: {
        id: player.id,
        username: player.username || player.nickname,
        nickname: player.nickname || player.username,
        phone: player.phone,
        balance_rsd: Number(player.balance_rsd || 1000.00),
        vip_tier: player.vip_tier || 'STANDARD',
        total_turnover: Number(player.total_turnover || 0),
        total_spins: Number(player.total_spins || 0),
        total_wins: Number(player.total_wins || 0),
        favorite_game: player.favorite_game || 'royal3x3',
        is_push_enabled: Boolean(player.is_push_enabled)
      }
    });

  } catch (err) {
    console.error('Session verify error:', err);
    return res.status(500).json({ success: false, error: 'Greška pri proveri sesije.' });
  }
}
