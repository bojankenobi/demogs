import { getDb, isDbConfigured } from '../_db.js';

const DEFAULT_LOCATIONS = [
  { id: 'loc_bg_centar', name: 'Grand Slot Beograd - Centar', code: 'BG-01', address: 'Kralja Milana 12', city: 'Beograd', is_active: true },
  { id: 'loc_bg_nbg', name: 'Grand Slot Novi Beograd', code: 'BG-02', address: 'Bulevar Mihajla Pupina 10', city: 'Beograd', is_active: true },
  { id: 'loc_ns_centar', name: 'Grand Slot Novi Sad', code: 'NS-01', address: 'Zmaj Jovina 8', city: 'Novi Sad', is_active: true },
  { id: 'loc_nis_centar', name: 'Grand Slot Niš', code: 'NI-01', address: 'Obrenovićeva 22', city: 'Niš', is_active: true }
];

const DEFAULT_OPERATORS = [
  { id: 'op_bg1_marko', location_id: 'loc_bg_centar', full_name: 'Marko Petrović', username: 'marko.bg1', pin_code: '1234', role: 'Šank 1', is_active: true, total_scans: 28, last_active_at: new Date().toISOString() },
  { id: 'op_bg1_jelena', location_id: 'loc_bg_centar', full_name: 'Jelena Jovanović', username: 'jelena.bg1', pin_code: '4321', role: 'Glavna Blagajna', is_active: true, total_scans: 45, last_active_at: new Date().toISOString() },
  { id: 'op_bg2_nikola', location_id: 'loc_bg_nbg', full_name: 'Nikola Stanković', username: 'nikola.nbg', pin_code: '2580', role: 'Slot Sala', is_active: true, total_scans: 19, last_active_at: new Date().toISOString() },
  { id: 'op_ns1_milan', location_id: 'loc_ns_centar', full_name: 'Milan Popović', username: 'milan.ns', pin_code: '9876', role: 'Šank & Kasa', is_active: true, total_scans: 31, last_active_at: new Date().toISOString() }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- GET: Fetch Locations & Operators ---
  if (req.method === 'GET') {
    const { all } = req.query || {};
    const showAll = all === 'true' || all === '1';

    if (!isDbConfigured()) {
      const locations = showAll ? DEFAULT_LOCATIONS : DEFAULT_LOCATIONS.filter(l => l.is_active);
      const operators = showAll ? DEFAULT_OPERATORS : DEFAULT_OPERATORS.filter(o => o.is_active);

      return res.status(200).json({
        success: true,
        isLiveDb: false,
        locations,
        operators: operators.map(o => ({
          ...o,
          pin_code: showAll ? o.pin_code : undefined // Mask PIN on public scanner fetch
        }))
      });
    }

    const sql = getDb();
    try {
      const locQuery = showAll
        ? sql`SELECT * FROM scanner_locations ORDER BY created_at ASC;`
        : sql`SELECT * FROM scanner_locations WHERE is_active = TRUE ORDER BY name ASC;`;

      const opQuery = showAll
        ? sql`
            SELECT o.*, l.name as location_name 
            FROM scanner_operators o
            LEFT JOIN scanner_locations l ON o.location_id = l.id
            ORDER BY o.created_at ASC;
          `
        : sql`
            SELECT id, location_id, full_name, username, role, is_active, total_scans, last_active_at
            FROM scanner_operators 
            WHERE is_active = TRUE 
            ORDER BY full_name ASC;
          `;

      const [locations, operators] = await Promise.all([locQuery, opQuery]);

      return res.status(200).json({
        success: true,
        isLiveDb: true,
        locations: locations || [],
        operators: operators || []
      });
    } catch (err) {
      console.error('Fetch scanner locations error:', err);
      return res.status(500).json({ success: false, error: 'Greška pri čitanju lokacija i operatera: ' + err.message });
    }
  }

  // --- POST: Admin Management Actions ---
  if (req.method === 'POST') {
    const { action, payload } = req.body || {};

    if (!action) {
      return res.status(400).json({ success: false, error: 'Akcija je obavezna.' });
    }

    if (!isDbConfigured()) {
      return res.status(200).json({
        success: true,
        isLiveDb: false,
        message: `Akcija [${action}] je uspešno simulirana u demo režimu.`,
        action,
        payload
      });
    }

    const sql = getDb();

    try {
      switch (action) {
        case 'create_location': {
          const { id, name, code, address, city } = payload || {};
          if (!name || !code) {
            return res.status(400).json({ success: false, error: 'Naziv i kod lokala su obavezni.' });
          }
          const locId = id || ('loc_' + code.toLowerCase().replace(/[^a-z0-9]/g, '_'));
          const created = await sql`
            INSERT INTO scanner_locations (id, name, code, address, city, is_active)
            VALUES (${locId}, ${name}, ${code}, ${address || ''}, ${city || 'Beograd'}, TRUE)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              code = EXCLUDED.code,
              address = EXCLUDED.address,
              city = EXCLUDED.city
            RETURNING *;
          `;
          return res.status(200).json({ success: true, location: created[0] });
        }

        case 'toggle_location': {
          const { locationId, is_active } = payload || {};
          const updated = await sql`
            UPDATE scanner_locations
            SET is_active = ${Boolean(is_active)}
            WHERE id = ${locationId}
            RETURNING *;
          `;
          return res.status(200).json({ success: true, location: updated[0] });
        }

        case 'create_operator': {
          const { location_id, full_name, username, pin_code, role } = payload || {};
          if (!location_id || !full_name || !username || !pin_code) {
            return res.status(400).json({ success: false, error: 'Sva polja su obavezna (lokal, ime, korisničko ime, PIN).' });
          }
          const opId = 'op_' + username.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
          const created = await sql`
            INSERT INTO scanner_operators (id, location_id, full_name, username, pin_code, role, is_active)
            VALUES (${opId}, ${location_id}, ${full_name}, ${username}, ${pin_code}, ${role || 'Šank'}, TRUE)
            RETURNING *;
          `;
          return res.status(200).json({ success: true, operator: created[0] });
        }

        case 'toggle_operator': {
          const { operatorId, is_active } = payload || {};
          const updated = await sql`
            UPDATE scanner_operators
            SET is_active = ${Boolean(is_active)}
            WHERE id = ${operatorId}
            RETURNING *;
          `;
          return res.status(200).json({ success: true, operator: updated[0] });
        }

        case 'update_pin': {
          const { operatorId, new_pin } = payload || {};
          if (!operatorId || !new_pin || new_pin.length < 4) {
            return res.status(400).json({ success: false, error: 'PIN mora imati najmanje 4 cifre.' });
          }
          const updated = await sql`
            UPDATE scanner_operators
            SET pin_code = ${new_pin}
            WHERE id = ${operatorId}
            RETURNING id, full_name, username, is_active;
          `;
          return res.status(200).json({ success: true, operator: updated[0] });
        }

        case 'delete_operator': {
          const { operatorId } = payload || {};
          await sql`DELETE FROM scanner_operators WHERE id = ${operatorId};`;
          return res.status(200).json({ success: true, message: 'Operater obrisan.' });
        }

        default:
          return res.status(400).json({ success: false, error: 'Nepoznata akcija: ' + action });
      }
    } catch (err) {
      console.error('Scanner management action error:', err);
      return res.status(500).json({ success: false, error: 'Greška pri obradi: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
