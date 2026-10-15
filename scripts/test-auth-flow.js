import fs from 'fs';

// Load .env manually if not already populated
if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

import registerHandler from '../api/auth/register.js';
import loginHandler from '../api/auth/login.js';
import meHandler from '../api/auth/me.js';
import syncHandler from '../api/players/sync.js';
import { getDb } from '../api/_db.js';

// Simple mock for Vercel/Node request & response
function createMockReqRes(body = {}, headers = {}, query = {}) {
  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(name, val) {
      resHeaders[name] = val;
    },
    json(data) {
      responseData = data;
      return this;
    },
    end() {
      return this;
    },
    _getStatusCode: () => statusCode,
    _getData: () => responseData
  };

  const req = {
    method: 'POST',
    body,
    headers,
    query
  };

  return { req, res };
}

async function runTest() {
  console.log('🧪 Pokrećem kompletan test autentifikacije i Neon DB integracije...\n');

  const testUser = 'test_vip_' + Date.now();
  const testPass = 'lozinka123';
  const testPhone = '0649988776';

  let testPlayerId = null;
  let testToken = null;

  // 1. Test Registracije
  console.log('1️⃣ Test registracije novog igrača...');
  const regMocks = createMockReqRes({
    username: testUser,
    password: testPass,
    phone: testPhone
  });

  await registerHandler(regMocks.req, regMocks.res);
  const regCode = regMocks.res._getStatusCode();
  const regData = regMocks.res._getData();

  console.log(`Status registracije: ${regCode}`);
  console.log('Odgovor registracije:', regData);

  if (regCode !== 200 || !regData || !regData.success) {
    throw new Error('Registracija nije uspela: ' + JSON.stringify(regData));
  }

  if (Number(regData.player.balance_rsd) !== 1000) {
    throw new Error(`Početni balans nije 1.000 RSD! Dobijeno: ${regData.player.balance_rsd}`);
  }

  testPlayerId = regData.player.id;
  testToken = regData.token;
  console.log('✅ Registracija uspešna! Balans: 1.000 RSD, ID:', testPlayerId);

  // 2. Test Prijave (Login)
  console.log('\n2️⃣ Test prijave sa novim nalogom...');
  const loginMocks = createMockReqRes({
    username: testUser,
    password: testPass
  });

  await loginHandler(loginMocks.req, loginMocks.res);
  const loginCode = loginMocks.res._getStatusCode();
  const loginData = loginMocks.res._getData();

  console.log(`Status prijave: ${loginCode}`);
  if (loginCode !== 200 || !loginData || !loginData.success) {
    throw new Error('Prijava nije uspela: ' + JSON.stringify(loginData));
  }

  testToken = loginData.token;
  console.log('✅ Prijava uspešna! Token generisan:', testToken.substring(0, 16) + '...');

  // 3. Test Sesije (api/auth/me)
  console.log('\n3️⃣ Test provere sesije (api/auth/me)...');
  const meMocks = createMockReqRes({}, {
    'authorization': `Bearer ${testToken}`
  });
  meMocks.req.method = 'GET';

  await meHandler(meMocks.req, meMocks.res);
  const meCode = meMocks.res._getStatusCode();
  const meData = meMocks.res._getData();

  console.log(`Status sesije: ${meCode}`);
  if (meCode !== 200 || !meData || !meData.success) {
    throw new Error('Provera sesije nije uspela: ' + JSON.stringify(meData));
  }
  console.log('✅ Sesija validna! Igrač:', meData.player.username, 'Balans:', meData.player.balance_rsd, 'RSD');

  // 4. Test Sinhronizacije balansa i statistike (api/players/sync)
  console.log('\n4️⃣ Test sinhronizacije promenjenog balansa (nakon dobitka)...');
  const syncMocks = createMockReqRes({
    id: testPlayerId,
    balance_rsd: 1450.00,
    total_spins: 5,
    total_turnover: 100,
    total_wins: 550,
    favorite_game: 'royal3x3'
  }, {
    'authorization': `Bearer ${testToken}`
  });

  await syncHandler(syncMocks.req, syncMocks.res);
  const syncCode = syncMocks.res._getStatusCode();
  const syncData = syncMocks.res._getData();

  console.log(`Status sync: ${syncCode}`);
  if (syncCode !== 200 || !syncData || !syncData.success) {
    throw new Error('Sync nije uspeo: ' + JSON.stringify(syncData));
  }

  // 5. Verifikacija u Neon DB da je balans ažuriran
  const sql = getDb();
  const checkRows = await sql`
    SELECT id, username, phone, balance_rsd, total_turnover, total_spins, total_wins
    FROM players 
    WHERE id = ${testPlayerId};
  `;

  console.log('Podaci iz Neon DB-a:', checkRows[0]);
  if (Number(checkRows[0].balance_rsd) !== 1450) {
    throw new Error('Balans u Neon DB nije ažuriran na 1450 RSD!');
  }
  console.log('✅ Sinhronizacija u Neon DB uspešna! Balans sačuvan: 1450 RSD');

  // 6. Cleanup test playera
  await sql`DELETE FROM players WHERE id = ${testPlayerId};`;
  console.log('\n🧹 Test korisnik uspešno obrisan iz Neon DB.');
  console.log('\n🎉 SVI TESTOVI SU USPEŠNO PROŠLI! Neon DB i autentifikacija rade besprekorno.');
}

runTest().catch((err) => {
  console.error('❌ Greška u testu:', err);
  process.exit(1);
});
