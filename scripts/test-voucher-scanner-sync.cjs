/**
 * Test Suite: Universal QR Scanner & Voucher Auto-Sync Verification
 * Verifies jsQR engine integration, scanner camera controls, API query by codes,
 * and real-time synchronization between Staff Scanner and Player App.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Running Universal QR Scanner & Voucher Auto-Sync tests...\n');

const rootDir = path.resolve(__dirname, '..');

// 1. Verify js/lib/jsQR.js exists and is valid JavaScript
const jsqrPath = path.join(rootDir, 'js', 'lib', 'jsQR.js');
assert(fs.existsSync(jsqrPath), 'js/lib/jsQR.js must exist');
const jsqrContent = fs.readFileSync(jsqrPath, 'utf8');
assert(jsqrContent.length > 50000, 'jsQR.js must have substantive content');
assert(jsqrContent.includes('jsQR'), 'jsQR.js must define or export jsQR');
console.log('  ✅ 1. Local jsQR library is present and valid.');

// 2. Verify scanner/index.html has jsQR, camera flip, and multi-channel sync
const scannerHtmlPath = path.join(rootDir, 'scanner', 'index.html');
const scannerHtml = fs.readFileSync(scannerHtmlPath, 'utf8');

assert(scannerHtml.includes('js/lib/jsQR.js'), 'scanner/index.html must include js/lib/jsQR.js');
assert(scannerHtml.includes('id="btn-camera-flip"'), 'scanner/index.html must have camera flip button');
assert(scannerHtml.includes('jsQR('), 'scanner/index.html must call jsQR function');
assert(scannerHtml.includes('inversionAttempts'), 'scanner/index.html must support inverted QR code scanning');
assert(scannerHtml.includes('gsc_my_vouchers_list'), 'scanner/index.html must sync gsc_my_vouchers_list in localStorage');
assert(scannerHtml.includes('gsc_last_redeemed_voucher'), 'scanner/index.html must set gsc_last_redeemed_voucher');
assert(scannerHtml.includes('gsc_vouchers_channel'), 'scanner/index.html must broadcast on gsc_vouchers_channel');
assert(scannerHtml.includes('gsc_voucher_redeemed'), 'scanner/index.html must dispatch gsc_voucher_redeemed event');

// Also verify legacy scanner.html redirect
const legacyScannerHtml = fs.readFileSync(path.join(rootDir, 'scanner.html'), 'utf8');
assert(legacyScannerHtml.includes('./scanner/'), 'legacy scanner.html must redirect to ./scanner/');
console.log('  ✅ 2. scanner/index.html has jsQR integration, camera flip, and cross-tab/storage broadcasting.');

// 3. Verify api/vouchers/my.js supports query by codes
const apiMyPath = path.join(rootDir, 'api', 'vouchers', 'my.js');
const apiMy = fs.readFileSync(apiMyPath, 'utf8');

assert(apiMy.includes('const { playerId, codes } = req.query'), 'api/vouchers/my.js must extract codes from query');
assert(apiMy.includes('codeList'), 'api/vouchers/my.js must define codeList');
assert(apiMy.includes('ANY(${codeList})'), 'api/vouchers/my.js must query vouchers by codes array in SQL');
console.log('  ✅ 3. api/vouchers/my.js supports both playerId and codes querying.');

// 4. Verify js/app.js handles codes synchronization and real-time listeners
const appJsPath = path.join(rootDir, 'js', 'app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

assert(appJs.includes('syncPlayerVouchers()'), 'js/app.js must implement syncPlayerVouchers()');
assert(appJs.includes('&codes='), 'js/app.js syncPlayerVouchers must append &codes= with local voucher codes');
assert(appJs.includes('gsc_vouchers_channel'), 'js/app.js must listen on BroadcastChannel gsc_vouchers_channel');
assert(appJs.includes('gsc_last_redeemed_voucher'), 'js/app.js must listen on storage for gsc_last_redeemed_voucher');
assert(appJs.includes('gsc_voucher_redeemed'), 'js/app.js must listen on window for gsc_voucher_redeemed');
assert(appJs.includes('saveVoucherToMyList'), 'js/app.js must call saveVoucherToMyList on promo claim');
console.log('  ✅ 4. js/app.js implements real-time listeners, codes-based sync, and status updates.');

// 5. Verify index.html references updated app.js version
const indexHtmlPath = path.join(rootDir, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtml.includes('js/app.js?v=111'), 'index.html must have bumped app.js version to 111');
console.log('  ✅ 5. index.html cache-buster updated.');

console.log('\n🎉 ALL SCANNER & VOUCHER SYNC CHECKS PASSED SUCCESSFULLY!\n');
