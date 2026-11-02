import { getDb, isDbConfigured } from '../_db.js';

const DEMO_OPERATORS = [
  { id: 'op_bg1_marko', location_id: 'loc_bg_centar', full_name: 'Marko Petrović', username: 'marko.bg1', pin_code: '1234', role: 'Šank 1', is_active: true, location_name: 'Grand Slot Beograd - Centar' },
  { id: 'op_bg1_jelena', location_id: 'loc_bg_centar', full_name: 'Jelena Jovanović', username: 'jelena.bg1', pin_code: '4321', role: 'Glavna Blagajna', is_active: true, location_name: 'Grand Slot Beograd - Centar' },
  { id: 'op_bg2_nikola', location_id: 'loc_bg_nbg', full_name: 'Nikola Stanković', username: 'nikola.nbg', pin_code: '2580', role: 'Slot Sala', is_active: true, location_name: 'Grand Slot Novi Beograd' },
  { id: 'op_ns1_milan', location_id: 'loc_ns_centar', full_name: 'Milan Popović', username: 'milan.ns', pin_code: '9876', role: 'Šank & Kasa', is_active: true, location_name: 'Grand Slot Novi Sad' }
];

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

  const { locationId, operatorId, pinCode } = req.body || {};

  if (!operatorId || !pinCode) {
    return res.status(400).json({ success: false, error: 'Identifikator operatera i PIN su obavezni.' });
  }

  const cleanPin = String(pinCode).trim();

  // Demo fallback
  if (!isDbConfigured()) {
    const op = DEMO_OPERATORS.find(o => 
      (o.id === operatorId || o.username === operatorId) && 
      (!locationId || o.location_id === locationId)
    );

    if (!op) {
      return res.status(401).json({
        success: false,
        error: 'Operater nije pronađen ili nije dodeljen izabranom lokalu.'
      });
    }

    if (!op.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Nalog ovog operatera je DEAKTIVIRAN od strane menadžmenta kazina.'
      });
    }

    if (op.pin_code !== cleanPin) {
      return res.status(401).json({
        success: false,
        error: 'Pogrešan sigurnosni PIN za ovog operatera.'
      });
    }

    return res.status(200).json({
      success: true,
      operator: {
        id: op.id,
        full_name: op.full_name,
        username: op.username,
        role: op.role,
        location_id: op.location_id,
        location_name: op.location_name
      },
      token: `gsc_op_tok_${op.id}_${Date.now()}`
    });
  }

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT 
        o.id,
        o.location_id,
        o.full_name,
        o.username,
        o.pin_code,
        o.role,
        o.is_active,
        l.name as location_name,
        l.is_active as location_active
      FROM scanner_operators o
      LEFT JOIN scanner_locations l ON o.location_id = l.id
      WHERE (o.id = ${operatorId} OR o.username = ${operatorId})
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Operater nije pronađen u bazi ovlašćenog osoblja.'
      });
    }

    const op = rows[0];

    if (locationId && op.location_id !== locationId) {
      return res.status(403).json({
        success: false,
        error: `Operater [${op.full_name}] nije ovlašćen za rad u ovom lokalu.`
      });
    }

    if (!op.location_active) {
      return res.status(403).json({
        success: false,
        error: 'Izabrani lokal je trenutno neaktivan u sistemu.'
      });
    }

    if (!op.is_active) {
      return res.status(403).json({
        success: false,
        error: `Nalog operatera [${op.full_name}] je blokiran radi sprečavanja zloupotrebe.`
      });
    }

    if (op.pin_code !== cleanPin) {
      return res.status(401).json({
        success: false,
        error: 'Neispravan sigurnosni PIN operatera.'
      });
    }

    // Update last_active_at
    await sql`
      UPDATE scanner_operators
      SET last_active_at = NOW()
      WHERE id = ${op.id};
    `;

    return res.status(200).json({
      success: true,
      operator: {
        id: op.id,
        full_name: op.full_name,
        username: op.username,
        role: op.role,
        location_id: op.location_id,
        location_name: op.location_name || 'Grand Slot Club'
      },
      token: `gsc_op_tok_${op.id}_${Date.now()}`
    });

  } catch (err) {
    console.error('Operator auth error:', err);
    return res.status(500).json({
      success: false,
      error: 'Greška pri autentifikaciji osoblja: ' + err.message
    });
  }
}
