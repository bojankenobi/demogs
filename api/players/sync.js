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
    id,
    nickname,
    vip_tier,
    total_turnover,
    total_spins,
    total_wins,
    favorite_game,
    device_info,
    push_subscription,
    is_push_enabled
  } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Player id is required.' });
  }

  if (!isDbConfigured()) {
    // Return mock success if DB not yet configured so client doesn't error
    return res.status(200).json({
      success: true,
      persisted: false,
      message: 'Demo režim: DATABASE_URL nije podešen; podaci sačuvani lokalno u pretraživaču.'
    });
  }

  const sql = getDb();

  try {
    const isPush = Boolean(is_push_enabled && push_subscription);
    const subJson = push_subscription ? JSON.stringify(push_subscription) : null;
    const deviceJson = device_info ? JSON.stringify(device_info) : '{}';

    const result = await sql`
      INSERT INTO players (
        id,
        nickname,
        vip_tier,
        total_turnover,
        total_spins,
        total_wins,
        favorite_game,
        device_info,
        push_subscription,
        is_push_enabled,
        last_seen_at
      )
      VALUES (
        ${id},
        ${nickname || null},
        ${vip_tier || 'STANDARD'},
        ${Number(total_turnover || 0)},
        ${Number(total_spins || 0)},
        ${Number(total_wins || 0)},
        ${favorite_game || 'royal3x3'},
        ${deviceJson}::jsonb,
        ${subJson}::jsonb,
        ${isPush},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        nickname = COALESCE(EXCLUDED.nickname, players.nickname),
        total_turnover = GREATEST(players.total_turnover, EXCLUDED.total_turnover),
        total_spins = GREATEST(players.total_spins, EXCLUDED.total_spins),
        total_wins = GREATEST(players.total_wins, EXCLUDED.total_wins),
        favorite_game = EXCLUDED.favorite_game,
        device_info = EXCLUDED.device_info,
        push_subscription = COALESCE(EXCLUDED.push_subscription, players.push_subscription),
        is_push_enabled = CASE WHEN EXCLUDED.push_subscription IS NOT NULL THEN EXCLUDED.is_push_enabled ELSE players.is_push_enabled END,
        last_seen_at = NOW()
      RETURNING *;
    `;

    return res.status(200).json({
      success: true,
      persisted: true,
      player: result[0]
    });
  } catch (error) {
    console.error('Player sync error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri čuvanju podataka igrača: ' + error.message
    });
  }
}
