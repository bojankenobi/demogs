import crypto from 'crypto';
import { getDb, isDbConfigured } from '../_db.js';
import { hashPassword, generateToken } from './_utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const {
    username,
    password,
    phone = null,
    nickname = null
  } = req.body || {};

  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '').trim();
  const cleanPhone = phone ? String(phone).trim() : null;
  const cleanNick = nickname ? String(nickname).trim() : cleanUser;

  // 1. Validation
  if (!cleanUser || cleanUser.length < 3 || cleanUser.length > 30) {
    return res.status(400).json({
      success: false,
      error: 'Korisničko ime mora imati između 3 i 30 karaktera.'
    });
  }

  if (!/^[\p{L}0-9_.\-@ ]+$/u.test(cleanUser)) {
    return res.status(400).json({
      success: false,
      error: 'Korisničko ime sme sadržati samo slova, brojeve, tačku i crticu.'
    });
  }

  if (!cleanPass || cleanPass.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Lozinka mora imati najmanje 6 karaktera.'
    });
  }

  // 2. Demo fallback if DB not configured
  if (!isDbConfigured()) {
    const demoId = 'gsc_usr_' + crypto.randomBytes(3).toString('hex');
    const demoToken = generateToken();
    return res.status(200).json({
      success: true,
      token: demoToken,
      player: {
        id: demoId,
        username: cleanUser,
        nickname: cleanNick,
        phone: cleanPhone,
        balance_rsd: 1000.00,
        vip_tier: 'STANDARD'
      },
      message: 'Uspešna registracija (demo mod)! Dobili ste 1.000 Zlatnika bonusa.'
    });
  }

  const sql = getDb();

  try {
    // 3. Check if username is already taken
    const existing = await sql`
      SELECT id FROM players 
      WHERE LOWER(username) = LOWER(${cleanUser}) 
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Korisničko ime "${cleanUser}" je već zauzeto. Izaberite drugo.`
      });
    }

    // 4. Hash password and generate identity
    const passHash = hashPassword(cleanPass);
    const playerId = 'gsc_usr_' + crypto.randomBytes(4).toString('hex');
    const authToken = generateToken();
    const startingBalance = 1000.00;

    // 5. Insert player into Neon DB
    const insertRes = await sql`
      INSERT INTO players (
        id, username, nickname, password_hash, phone, balance_rsd, vip_tier,
        auth_token, is_verified_18, last_seen_at, created_at
      ) VALUES (
        ${playerId}, ${cleanUser}, ${cleanNick}, ${passHash}, ${cleanPhone}, 
        ${startingBalance}, 'STANDARD', ${authToken}, true, NOW(), NOW()
      )
      RETURNING id, username, nickname, phone, balance_rsd, vip_tier, created_at;
    `;

    const newPlayer = insertRes[0];

    return res.status(200).json({
      success: true,
      token: authToken,
      player: {
        id: newPlayer.id,
        username: newPlayer.username,
        nickname: newPlayer.nickname,
        phone: newPlayer.phone,
        balance_rsd: Number(newPlayer.balance_rsd),
        vip_tier: newPlayer.vip_tier,
        created_at: newPlayer.created_at
      },
      message: `Dobrodošli u Grand Slot Club! Vaš nalog je otvoren uz 1.000 Zlatnika bonusa dobrodošlice.`
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Došlo je do greške pri registraciji: ' + error.message
    });
  }
}
