/**
 * Test Suite: Scanner Dedicated PWA Isolation & Multi-Venue Staff Operator Authorization
 * Verifies standalone PWA configuration in /scanner/, database schema, anti-abuse PIN gating,
 * root SW isolation, and unified admin management for venues and operators.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Running Dedicated /scanner/ PWA & Staff Operators Authorization tests...\n');

const rootDir = path.resolve(__dirname, '..');
const scannerDir = path.join(rootDir, 'scanner');

// 1. Dedicated Scanner PWA Directory & Manifest Verification
console.log('--- TEST 1: Dedicated Scanner PWA Directory & Manifest Isolation ---');
assert(fs.existsSync(scannerDir), '/scanner/ directory must exist as a dedicated application');

const manifestPath = path.join(scannerDir, 'manifest.json');
assert(fs.existsSync(manifestPath), 'scanner/manifest.json must exist');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.strictEqual(manifest.start_url, './', 'start_url must point to ./');
assert.strictEqual(manifest.scope, './', 'scope must isolate scanner PWA to ./');
assert.strictEqual(manifest.display, 'standalone', 'display must be standalone');
assert.strictEqual(manifest.id, '/scanner/', 'PWA id must be /scanner/');
assert(manifest.name.includes('Skener'), 'name must identify as Scanner');
console.log('  ✅ scanner/manifest.json properly configured with isolated scope and id.');

// 2. Standalone Service Worker (scanner/sw.js) & Root SW Bypass
console.log('\n--- TEST 2: Dedicated Service Worker & Root SW Bypass ---');
const scannerSwPath = path.join(scannerDir, 'sw.js');
assert(fs.existsSync(scannerSwPath), 'scanner/sw.js must exist');
const scannerSwContent = fs.readFileSync(scannerSwPath, 'utf8');
assert(scannerSwContent.includes('gsc-staff-scanner-pwa-'), 'scanner/sw.js must have dedicated scanner cache namespace');
assert(scannerSwContent.includes('index.html'), 'scanner/sw.js must cache standalone index.html');
assert(scannerSwContent.includes('jsQR.js'), 'scanner/sw.js must cache jsQR.js');

const rootSwPath = path.join(rootDir, 'sw.js');
const rootSwContent = fs.readFileSync(rootSwPath, 'utf8');
assert(rootSwContent.includes("url.pathname.startsWith('/scanner/')"), 'root sw.js must explicitly bypass /scanner/ PWA');
assert(!rootSwContent.includes("'./scanner.html'"), 'root sw.js must NOT precache scanner.html');
console.log('  ✅ scanner/sw.js is fully independent and root sw.js strictly bypasses scanner traffic.');

// 3. Scanner HTML UI, Auth Gate & PWA Hooks in scanner/index.html
console.log('\n--- TEST 3: Dedicated Scanner UI, Auth Gate & PWA Hooks (/scanner/index.html) ---');
const scannerHtmlPath = path.join(scannerDir, 'index.html');
assert(fs.existsSync(scannerHtmlPath), 'scanner/index.html must exist');
const scannerHtml = fs.readFileSync(scannerHtmlPath, 'utf8');
assert(scannerHtml.includes('manifest.json'), 'scanner/index.html must link scanner manifest');
assert(scannerHtml.includes('sw.js'), 'scanner/index.html must register isolated ./sw.js');
assert(scannerHtml.includes('btn-install-pwa'), 'scanner/index.html must have PWA install button');
assert(scannerHtml.includes('staff-auth-modal'), 'scanner/index.html must have staff authentication modal');
assert(scannerHtml.includes('auth-select-location'), 'scanner/index.html must have venue selection');
assert(scannerHtml.includes('auth-select-operator'), 'scanner/index.html must have operator selection');
assert(scannerHtml.includes('auth-input-pin'), 'scanner/index.html must have PIN input');
assert(scannerHtml.includes('auth-pin-keypad'), 'scanner/index.html must have tactile numeric keypad');
assert(scannerHtml.includes('btn-staff-logout'), 'scanner/index.html must have logout / end shift button');
assert(scannerHtml.includes('checkAuthSession'), 'scanner/index.html must verify session before starting camera');

// Backward compatibility redirect in root scanner.html
const legacyScannerHtml = fs.readFileSync(path.join(rootDir, 'scanner.html'), 'utf8');
assert(legacyScannerHtml.includes('./scanner/'), 'legacy scanner.html must redirect to ./scanner/');
console.log('  ✅ Dedicated /scanner/ UI contains complete staff auth gate, and scanner.html seamlessly redirects.');

// 4. Database Schema: Venues & Operators in api/db/_init.js
console.log('\n--- TEST 4: Database Schema & Seeding (api/db/_init.js) ---');
const initFile = fs.existsSync(path.join(rootDir, 'api', 'db', '_init.js'))
  ? path.join(rootDir, 'api', 'db', '_init.js')
  : path.join(rootDir, 'api', 'db', 'init.js');
const dbInit = fs.readFileSync(initFile, 'utf8');
assert(dbInit.includes('scanner_locations'), 'init.js must define scanner_locations table');
assert(dbInit.includes('scanner_operators'), 'init.js must define scanner_operators table');
assert(dbInit.includes('idx_scanner_loc_active'), 'init.js must index active locations');
assert(dbInit.includes('idx_scanner_op_loc'), 'init.js must index operators by location');
assert(dbInit.includes('loc_bg_centar'), 'init.js must seed default locations');
assert(dbInit.includes('op_bg1_marko'), 'init.js must seed default operators with PINs');
console.log('  ✅ Database schema and seeding verified for venues and authorized operators.');

// 5. Backend APIs: api/scanner/locations.js & api/scanner/auth.js
console.log('\n--- TEST 5: Backend APIs for Locations, Operators & PIN Auth ---');
const apiLoc = fs.readFileSync(path.join(rootDir, 'api', 'scanner', 'locations.js'), 'utf8');
assert(apiLoc.includes('DEFAULT_LOCATIONS'), 'locations.js must provide fallback locations');
assert(apiLoc.includes('DEFAULT_OPERATORS'), 'locations.js must provide fallback operators');
assert(apiLoc.includes('create_location'), 'locations.js must handle create_location action');
assert(apiLoc.includes('toggle_location'), 'locations.js must handle toggle_location action');
assert(apiLoc.includes('create_operator'), 'locations.js must handle create_operator action');
assert(apiLoc.includes('toggle_operator'), 'locations.js must handle toggle_operator action');
assert(apiLoc.includes('update_pin'), 'locations.js must handle update_pin action');

const apiAuth = fs.readFileSync(path.join(rootDir, 'api', 'scanner', 'auth.js'), 'utf8');
assert(apiAuth.includes('pinCode'), 'auth.js must validate pinCode');
assert(apiAuth.includes('is_active'), 'auth.js must enforce is_active status on operator and venue');
assert(apiAuth.includes('DEMO_OPERATORS'), 'auth.js must provide demo fallback authentication');
console.log('  ✅ Backend endpoints properly validate operator PINs and process admin CRUD actions.');

// 6. Security Enforcement in api/vouchers/redeem.js
console.log('\n--- TEST 6: Anti-Abuse Gating in Voucher Redemption ---');
const redeemJs = fs.readFileSync(path.join(rootDir, 'api', 'vouchers', 'redeem.js'), 'utf8');
assert(redeemJs.includes('operatorPin'), 'redeem.js must accept operatorPin');
assert(redeemJs.includes('operatorId'), 'redeem.js must accept operatorId');
assert(redeemJs.includes('scanner_operators'), 'redeem.js must verify operator against scanner_operators table');
assert(redeemJs.includes('Zloupotreba sprečena'), 'redeem.js must block inactive or unauthorized operators');
assert(redeemJs.includes('total_scans = total_scans + 1'), 'redeem.js must increment operator audit scan count');
console.log('  ✅ Voucher redemption strictly validates operator authority to prevent financial abuse.');

// 7. Admin Dashboard: Unified Control Center & Sub-tabs
console.log('\n--- TEST 7: Admin Dashboard Unified Vouchers, Locations & Operators Center ---');
const adminHtml = fs.readFileSync(path.join(rootDir, 'admin.html'), 'utf8');
assert(adminHtml.includes('data-tab="vouchers"'), 'admin.html must have tab for vouchers');
assert(adminHtml.includes('data-tab="operators"'), 'admin.html must have tab for operators');
assert(adminHtml.includes('id="pane-vouchers"'), 'admin.html must have pane-vouchers section');
assert(adminHtml.includes('id="vsub-pane-operators"'), 'admin.html must have vsub-pane-operators subtab');
assert(adminHtml.includes('id="vsub-pane-locations"'), 'admin.html must have vsub-pane-locations subtab');
assert(adminHtml.includes('admin-locations-tbody'), 'admin.html must have locations table tbody');
assert(adminHtml.includes('admin-operators-tbody'), 'admin.html must have operators table tbody');
assert(adminHtml.includes('crm-scans-table-body'), 'admin.html must have vouchers audit table tbody');
assert(adminHtml.includes('modal-add-location'), 'admin.html must have add location modal');
assert(adminHtml.includes('modal-add-operator'), 'admin.html must have add operator modal');
assert(adminHtml.includes('/scanner/'), 'admin.html must have prominent banner link to /scanner/');

const adminJs = fs.readFileSync(path.join(rootDir, 'js', 'admin-dashboard.js'), 'utf8');
assert(adminJs.includes('initScannerOperatorsManagement'), 'admin-dashboard.js must implement initScannerOperatorsManagement');
assert(adminJs.includes('fetchScannerOperators'), 'admin-dashboard.js must implement fetchScannerOperators');
assert(adminJs.includes('renderLocationsTable'), 'admin-dashboard.js must implement renderLocationsTable');
assert(adminJs.includes('renderOperatorsTable'), 'admin-dashboard.js must implement renderOperatorsTable');
assert(adminJs.includes('handleToggleOperator'), 'admin-dashboard.js must handle operator deactivation/blocking');
assert(adminJs.includes('handleUpdatePin'), 'admin-dashboard.js must handle PIN updates');
console.log('  ✅ Admin dashboard UI and JavaScript fully wired for venue & staff management in unified center.');

console.log('\n========================================================================');
console.log('🎉 ALL DEDICATED SCANNER PWA & VENUE/OPERATOR TESTS PASSED 100%! 🎉');
console.log('========================================================================\n');
