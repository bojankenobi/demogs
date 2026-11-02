/**
 * Integration Test: Grand Slot 2s Splash Screen, Open Luxury Game Lobby & Dedicated Vouchers Portal
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: SPLASH SCREEN, MODERN OPEN LOBBY & VOUCHERS PORTAL ===\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
const lobbyJsContent = fs.readFileSync(path.join(__dirname, '../js/core/lobby.js'), 'utf8');
const appJsContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// --- TEST 1: Splash Screen DOM Elements ---
console.log('--- TEST 1: Splash Screen Brand Intro DOM Elements ---');
assert(htmlContent.includes('id="grand-splash-screen"'), 'index.html must have #grand-splash-screen');
assert(htmlContent.includes('class="splash-flower-logo"'), 'index.html must have .splash-flower-logo');
assert(htmlContent.includes('class="splash-brand-logo"'), 'index.html must have .splash-brand-logo');
assert(htmlContent.includes('class="splash-loader-progress"'), 'index.html must have .splash-loader-progress');
console.log('✓ Splash screen intro elements verified');

// --- TEST 2: Header Navigation & Voucher Pill ---
console.log('\n--- TEST 2: Header Navigation & Voucher Counter Pill ---');
assert(htmlContent.includes('id="btn-header-lobby"'), 'index.html must have #btn-header-lobby');
assert(htmlContent.includes('id="btn-header-vouchers"'), 'index.html must have #btn-header-vouchers');
assert(htmlContent.includes('id="header-voucher-counter"'), 'index.html must have #header-voucher-counter');
console.log('✓ Header quick navigation verified');

// --- TEST 3: Modern Open Game Lobby & Separation from Voucher ---
console.log('\n--- TEST 3: Modern Open Game Lobby & Separation from Voucher ---');
assert(htmlContent.includes('id="egt-games-modal"'), 'index.html must have #egt-games-modal');
assert(!htmlContent.includes('id="lobby-promo-banner-wrap"'), '#lobby-promo-banner-wrap must be removed from game selector');
assert(htmlContent.includes('class="lobby-category-bar"'), 'index.html must have .lobby-category-bar');

const expectedGameIds = [
  'egt-opt-classic',
  'egt-opt-royal',
  'egt-opt-fullfocus',
  'egt-opt-mines',
  'egt-opt-crash',
  'egt-opt-plinko',
  'egt-opt-blackjack',
  'egt-opt-videopoker',
  'egt-opt-holdem',
  'egt-opt-vault',
  'egt-opt-royale'
];

expectedGameIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `index.html must include game card #${id}`);
});
console.log('✓ All 11 games present in lobby with category tags');

// --- TEST 4: Dedicated "Moji Vaučeri" Modal ---
console.log('\n--- TEST 4: Dedicated "Moji Vaučeri" Management Modal ---');
assert(htmlContent.includes('id="my-vouchers-modal"'), 'index.html must have #my-vouchers-modal');
assert(htmlContent.includes('id="tab-vouchers-active"'), 'index.html must have #tab-vouchers-active');
assert(htmlContent.includes('id="tab-vouchers-redeemed"'), 'index.html must have #tab-vouchers-redeemed');
assert(htmlContent.includes('id="tab-vouchers-expired"'), 'index.html must have #tab-vouchers-expired');
assert(htmlContent.includes('id="my-vouchers-list"'), 'index.html must have #my-vouchers-list');
assert(htmlContent.includes('id="btn-profile-my-vouchers"'), 'index.html must have #btn-profile-my-vouchers in profile');
console.log('✓ "Moji Vaučeri" modal markup & profile link verified');

// --- TEST 5: CSS Styles Verification ---
console.log('\n--- TEST 5: CSS Responsive & Visual Styles ---');
assert(cssContent.includes('.grand-splash-screen'), 'CSS must style .grand-splash-screen');
assert(cssContent.includes('.grand-splash-screen.fade-out'), 'CSS must have .grand-splash-screen.fade-out transition');
assert(cssContent.includes('.lobby-category-bar'), 'CSS must style .lobby-category-bar');
assert(cssContent.includes('.my-vouchers-card'), 'CSS must style .my-vouchers-card');
assert(cssContent.includes('.voucher-filter-tabs'), 'CSS must style .voucher-filter-tabs');
assert(cssContent.includes('.header-voucher-counter'), 'CSS must style .header-voucher-counter');
console.log('✓ All CSS rules verified');

// --- TEST 6: JavaScript Logic Verification ---
console.log('\n--- TEST 6: JavaScript Orchestration & Logic ---');
assert(lobbyJsContent.includes('filterCategory'), 'lobby.js must contain filterCategory method');
assert(lobbyJsContent.includes('btn-header-lobby'), 'lobby.js must wire #btn-header-lobby');
assert(appJsContent.includes('getMyVouchersList'), 'app.js must contain getMyVouchersList');
assert(appJsContent.includes('openMyVouchersModal'), 'app.js must contain openMyVouchersModal');
assert(appJsContent.includes('renderMyVouchersList'), 'app.js must contain renderMyVouchersList');
assert(appJsContent.includes('grand-splash-screen'), 'app.js must manage 2s splash screen fade-out');
assert(appJsContent.includes('gsc_vip_voucher_claimed'), 'app.js must check gsc_vip_voucher_claimed for one-time modal');
console.log('✓ All JavaScript controller and lobby methods verified');

console.log('\n======================================================================');
console.log('🎉 ALL 6 SPLASH SCREEN, LOBBY & VOUCHERS INTEGRATION TESTS PASSED! 🎉');
console.log('======================================================================');
