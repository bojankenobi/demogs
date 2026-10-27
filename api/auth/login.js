import { getDb, isDbConfigured } from '../_db.js';
import { verifyPassword, generateToken } from './_utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Grand Slot Club Player Login API',
      status: 'online',
      usage: 'Pošaljite POST zahtev sa parametrima { username, password }.'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({
      success: false,
      error: 'Molimo unesite korisničko ime i lozinku.'
    });
  }

  // Demo fallback if DB not configured
  if (!isDbConfigured()) {
    const demoToken = generateToken();
    return res.status(200).json({
      success: true,
      token: demoToken,
      player: {
        id: 'gsc_usr_demo',
        username: cleanUser,
        nickname: cleanUser,
        phone: null,
        balance_rsd: 1000.00,
        vip_tier: 'STANDARD',
        total_turnover: 0,
        total_spins: 0
      },
      message: 'Uspešna prijava (demo mod).'
    });
  }

  const sql = getDb();

  try {
    // 1. Look up user by username or nickname
    const rows = await sql`
      SELECT id, username, nickname, password_hash, phone, balance_rsd, 
             vip_tier, total_turnover, total_spins, total_wins, favorite_game
      FROM players 
      WHERE LOWER(username) = LOWER(${cleanUser}) OR LOWER(nickname) = LOWER(${cleanUser})
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Pogrešno korisničko ime ili lozinka.'
      });
    }

    const player = rows[0];

    // If player registered via legacy demo and has no password set
    if (!player.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'Ovaj nalog nema postavljenu lozinku. Molimo registrujte se ponovo.'
      });
    }

    // 2. Verify password hash
    const isValid = verifyPassword(cleanPass, player.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Pogrešno korisničko ime ili lozinka.'
      });
    }

    // 3. Issue fresh auth token and update last_seen_at
    const authToken = generateToken();
    await sql`
      UPDATE players 
      SET auth_token = ${authToken}, last_seen_at = NOW() 
      WHERE id = ${player.id};
    `;

    return res.status(200).json({
      success: true,
      token: authToken,
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
        favorite_game: player.favorite_game || 'royal3x3'
      },
      message: `Dobrodošli nazad, ${player.nickname || player.username}!`
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Došlo je do greške pri prijavi: ' + error.message
    });
  }
}
