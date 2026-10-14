import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle VIP toggle update
  if (req.method === 'POST') {
    const { playerId, vipTier } = req.body || {};
    if (!playerId) {
      return res.status(400).json({ error: 'playerId is required.' });
    }

    if (!isDbConfigured()) {
      return res.status(200).json({ success: true, message: 'VIP ažuriran (demo mod).' });
    }

    const sql = getDb();
    try {
      const updated = await sql`
        UPDATE players 
        SET vip_tier = ${vipTier || 'VIP'}
        WHERE id = ${playerId}
        RETURNING id, nickname, vip_tier;
      `;
      return res.status(200).json({ success: true, player: updated[0] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Handle GET list
  const { segment = 'all', search = '', limit = 100 } = req.query || {};

  if (!isDbConfigured()) {
    // Return sample/mock data if Neon is not yet connected
    const now = new Date();
    return res.status(200).json({
      success: true,
      isLiveDb: false,
      stats: {
        total: 12,
        pushEnabled: 9,
        vip: 4,
        activeToday: 7
      },
      players: [
        {
          id: 'gsc_usr_7891',
          nickname: 'Bojan K.',
          vip_tier: 'VIP',
          total_turnover: '18500.00',
          total_spins: 420,
          total_wins: '14200.00',
          favorite_game: 'royal3x3',
          is_push_enabled: true,
          last_seen_at: new Date(now - 12 * 60000).toISOString()
        },
        {
          id: 'gsc_usr_3342',
          nickname: 'Nikola_VIP',
          vip_tier: 'VIP',
          total_turnover: '26400.00',
          total_spins: 610,
          total_wins: '22800.00',
          favorite_game: 'mines',
          is_push_enabled: true,
          last_seen_at: new Date(now - 45 * 60000).toISOString()
        },
        {
          id: 'gsc_usr_5519',
          nickname: 'Gost_5519',
          vip_tier: 'STANDARD',
          total_turnover: '3400.00',
          total_spins: 85,
          total_wins: '2100.00',
          favorite_game: 'classic',
          is_push_enabled: true,
          last_seen_at: new Date(now - 3 * 3600000).toISOString()
        },
        {
          id: 'gsc_usr_9012',
          nickname: 'Marko_BG',
          vip_tier: 'STANDARD',
          total_turnover: '1200.00',
          total_spins: 40,
          total_wins: '450.00',
          favorite_game: 'royal3x3',
          is_push_enabled: false,
          last_seen_at: new Date(now - 4 * 86400000).toISOString()
        }
      ]
    });
  }

  const sql = getDb();

  try {
    // 1. Fetch aggregate metrics
    const [stats] = await sql`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN is_push_enabled = true THEN 1 END)::int AS "pushEnabled",
        COUNT(CASE WHEN vip_tier != 'STANDARD' THEN 1 END)::int AS vip,
        COUNT(CASE WHEN last_seen_at >= NOW() - INTERVAL '24 hours' THEN 1 END)::int AS "activeToday"
      FROM players;
    `;

    // 2. Fetch players with filters
    let playersQuery;
    const searchTerm = search ? `%${search}%` : null;

    if (segment === 'vip') {
      if (searchTerm) {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          WHERE vip_tier != 'STANDARD' AND (id ILIKE ${searchTerm} OR nickname ILIKE ${searchTerm})
          ORDER BY total_turnover DESC
          LIMIT ${Number(limit)};
        `;
      } else {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          WHERE vip_tier != 'STANDARD'
          ORDER BY total_turnover DESC
          LIMIT ${Number(limit)};
        `;
      }
    } else if (segment === 'active_today') {
      if (searchTerm) {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          WHERE last_seen_at >= NOW() - INTERVAL '24 hours' AND (id ILIKE ${searchTerm} OR nickname ILIKE ${searchTerm})
          ORDER BY last_seen_at DESC
          LIMIT ${Number(limit)};
        `;
      } else {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          WHERE last_seen_at >= NOW() - INTERVAL '24 hours'
          ORDER BY last_seen_at DESC
          LIMIT ${Number(limit)};
        `;
      }
    } else if (segment === 'inactive') {
      if (searchTerm) {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          WHERE last_seen_at < NOW() - INTERVAL '3 days' AND (id ILIKE ${searchTerm} OR nickname ILIKE ${searchTerm})
          ORDER BY last_seen_at ASC
          LIMIT ${Number(limit)};
        `;
      } else {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          WHERE last_seen_at < NOW() - INTERVAL '3 days'
          ORDER BY last_seen_at ASC
          LIMIT ${Number(limit)};
        `;
      }
    } else {
      // 'all'
      if (searchTerm) {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          WHERE id ILIKE ${searchTerm} OR nickname ILIKE ${searchTerm}
          ORDER BY last_seen_at DESC
          LIMIT ${Number(limit)};
        `;
      } else {
        playersQuery = sql`
          SELECT id, nickname, vip_tier, total_turnover, total_spins, total_wins, favorite_game, is_push_enabled, last_seen_at, created_at
          FROM players
          ORDER BY last_seen_at DESC
          LIMIT ${Number(limit)};
        `;
      }
    }

    const players = await playersQuery;

    return res.status(200).json({
      success: true,
      isLiveDb: true,
      stats: stats || { total: 0, pushEnabled: 0, vip: 0, activeToday: 0 },
      players: players || []
    });
  } catch (err) {
    console.error('Players list query error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
