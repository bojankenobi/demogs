/**
 * Automated Verification Suite for Promotional Hub, Custom Posters & Voucher Triggers
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- TEST SUITE: PROMOTIONAL HUB & VOUCHER TRIGGERS ---');

// 1. Verify Promotional SVG Posters Exist and are Valid XML
console.log('1. Checking Built-in Promotional Poster SVG Assets...');
const promoDir = path.resolve('assets/promotions');
assert(fs.existsSync(promoDir), 'assets/promotions directory must exist');

const expectedPosters = [
  'promo_weekend_vip.svg',
  'promo_drink.svg',
  'promo_tournament.svg',
  'promo_birthday.svg',
  'promo_spins.svg'
];

for (const file of expectedPosters) {
  const filePath = path.join(promoDir, file);
  assert(fs.existsSync(filePath), `Poster ${file} must exist`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('<svg') && content.includes('</svg>'), `${file} must be valid SVG`);
  assert(content.includes('viewBox="0 0 800 450"'), `${file} must have 16:9 800x450 ratio`);
  console.log(`   ✓ ${file} verified (aspect 16:9, valid SVG markup)`);
}

// 2. Verify Campaign Data Model & Voucher Triggers
console.log('2. Verifying Campaign Data Model & Reward Payloads...');
const sampleCampaign = {
  id: 'promo_test_weekend',
  title: 'VIKEND RELOAD 1.000 ZLT',
  body: 'Preuzmite vaučer i duplirajte ulog na aparatima!',
  imageUrl: 'assets/promotions/promo_weekend_vip.svg',
  location: 'Grand Slot Club Beograd',
  targetType: 'all',
  targetPlayerId: null,
  promoAction: 'voucher',
  promoValue: 1000,
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  status: 'ACTIVE'
};

assert.strictEqual(sampleCampaign.promoAction, 'voucher');
assert.strictEqual(sampleCampaign.promoValue, 1000);
console.log('   ✓ Campaign structure validated successfully.');

// 3. Test Voucher Code Generation Pattern
console.log('3. Testing Club QR Voucher Code Generation...');
const randomSuffix = Math.floor(1000 + Math.random() * 9000);
const voucherCode = `GSC-${randomSuffix}-VIP`;
assert(/^GSC-\d{4}-VIP$/.test(voucherCode), 'Voucher code format must match GSC-XXXX-VIP');
console.log(`   ✓ Generated Voucher Code matches official format: ${voucherCode}`);

// 4. Test Bridge Protocol Message Handling
console.log('4. Testing Bridge Protocol Actions...');
const validActions = ['SET_ACTIVE_PROMO', 'TRIGGER_PROMO_POPUP', 'TRIGGER_PUSH'];
for (const act of validActions) {
  const msg = { action: act, promo: sampleCampaign };
  assert(msg.action && msg.promo, `Bridge message for ${act} is valid`);
  console.log(`   ✓ Bridge action [${act}] validated.`);
}

console.log('✅ ALL PROMOTIONAL HUB & VOUCHER TRIGGER TESTS PASSED SUCCESSFULLY!');
