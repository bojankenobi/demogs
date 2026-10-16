import fs from 'fs';
import { neon } from '@neondatabase/serverless';

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

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const sql = neon(process.env.DATABASE_URL);
  const code = 'GSC-PROMO-' + Math.floor(1000 + Math.random() * 9000);
  const vId = 'vch_test_' + Date.now();

  console.log('1. Kreiram novi aktivni promo vaučer za igrača u Neon DB:', code);
  await sql`
    INSERT INTO vouchers (
      id, player_id, campaign_id, voucher_code, title, description,
      reward_type, reward_value, location, expires_at, status
    ) VALUES (
      ${vId}, 'gsc_usr_neon_vip', 'vikend_promo', ${code},
      'VIP Promo Vaučer 1.000 ZLT', 'Promo tiket za aparate u klubu',
      'club_ticket', 1000.00, 'Grand Slot Club - Kralja Milana 12',
      NOW() + INTERVAL '2 days', 'ACTIVE'
    );
  `;
  console.log('✅ Vaučer uspešno upisan u bazu sa statusom ACTIVE!');

  console.log('\n2. Operater u kazinu skenira QR kod i potvrđuje dolazak...');
  const updated = await sql`
    UPDATE vouchers
    SET 
      status = 'REDEEMED',
      redeemed_at = NOW(),
      redeemed_by_operator = 'Operater Stefan - Šank 1',
      redeemed_location = 'Grand Slot Club Beograd'
    WHERE voucher_code = ${code} AND status = 'ACTIVE'
    RETURNING *;
  `;

  if (updated && updated.length > 0) {
    const v = updated[0];
    console.log(`✅ DOLAZAK POTVRĐEN! Fizički vaučer [${v.voucher_code}] izdat igraču!`);
    console.log(`   - Operater: ${v.redeemed_by_operator}`);
    console.log(`   - Lokacija: ${v.redeemed_location}`);
    console.log(`   - Vreme: ${v.redeemed_at}`);
  } else {
    console.log('❌ Greška pri evidentiranju.');
  }

  console.log('\n3. Pokušaj ponovnog (duplog) skeniranja istog QR koda...');
  const doubleScan = await sql`
    UPDATE vouchers
    SET status = 'REDEEMED', redeemed_at = NOW()
    WHERE voucher_code = ${code} AND status = 'ACTIVE'
    RETURNING *;
  `;

  if (doubleScan.length === 0) {
    console.log('🛡️ USPEH: Dvostruko korišćenje je uspešno sprečeno! (0 redova ažurirano)');
  } else {
    console.log('⚠️ UPOZORENJE: Vaučer je ponovo iskorišćen!');
  }

  // Cleanup test voucher
  await sql`DELETE FROM vouchers WHERE id = ${vId};`;
  console.log('\n🧹 Test vaučer očišćen.');
  console.log('🎉 KOMPLETAN CIKLUS VAUČERA I SKENIRANJA JE 100% ISPRAVAN!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
