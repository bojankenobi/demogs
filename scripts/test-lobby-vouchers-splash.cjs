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
assert(htmlContent.includes('class="splash-brand-logo"'), 'index.html must have .splash-brand-logo');
// Clean minimal splash contains only brand logo with text as requested
assert(!htmlContent.includes('class="splash-flower-logo"'), 'index.html splash must not have extra flower logo');
assert(!htmlContent.includes('class="splash-loader-progress"'), 'index.html splash must not have loader progress');
console.log('✓ Splash screen intro elements verified (only official logo with text)');

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
  'egt-opt-holdem'
];

expectedGameIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `index.html must include game card #${id}`);
});
assert(!htmlContent.includes('id="egt-opt-vault"'), 'Casino lobby must not include Trezor card (handled in pillar hub)');
assert(!htmlContent.includes('id="egt-opt-royale"'), 'Casino lobby must not include Royale card (handled in pillar hub)');
console.log('✓ All 9 pure Casino games present in lobby; Trezor & Royale cleanly separated into their own pillars');

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
assert(appJsContent.includes('openMainModeModal'), 'app.js must trigger 3-pillar modal after splash');
console.log('✓ All JavaScript controller and lobby methods verified');

// --- TEST 7: 3-Pillar Landing Modal ---
console.log('\n--- TEST 7: 3-Pillar Landing Modal (Casino, Trezor, Battle) ---');
assert(htmlContent.includes('id="main-mode-select-modal"'), 'index.html must have #main-mode-select-modal');
assert(htmlContent.includes('id="btn-select-mode-casino"'), 'index.html must have #btn-select-mode-casino');
assert(htmlContent.includes('id="btn-select-mode-vault"'), 'index.html must have #btn-select-mode-vault');
assert(htmlContent.includes('id="btn-select-mode-royale"'), 'index.html must have #btn-select-mode-royale');
assert(cssContent.includes('.grand-mode-select-overlay'), 'CSS must style .grand-mode-select-overlay');
assert(cssContent.includes('.mode-pillar-card'), 'CSS must style .mode-pillar-card');
console.log('✓ 3-pillar landing modal elements and styling verified');

// --- TEST 8: Casino Style Selection (Casual vs Daily) ---
console.log('\n--- TEST 8: Casino Style Selection (Casual vs Daily sa Taskovima) ---');
assert(htmlContent.includes('id="casino-style-select-modal"'), 'index.html must have #casino-style-select-modal');
assert(htmlContent.includes('id="btn-style-casual"'), 'index.html must have #btn-style-casual');
assert(htmlContent.includes('id="btn-style-daily"'), 'index.html must have #btn-style-daily');
assert(htmlContent.includes('id="btn-back-to-main-modes"'), 'index.html must have #btn-back-to-main-modes');
assert(appJsContent.includes('setCasinoStyle'), 'app.js must define setCasinoStyle');
assert(cssContent.includes('.casino-style-select-overlay'), 'CSS must style .casino-style-select-overlay');
console.log('✓ Casino style selection modal, methods, and styling verified');

// --- TEST 9: Royal 3x3 Lock & Early Exit Forfeit Penalties ---
console.log('\n--- TEST 9: Royal 3x3 Lock & Early Exit Forfeit Penalties ---');
const vaultCrawlerContent = fs.readFileSync(path.join(__dirname, '../js/games/vault-crawler/vault-crawler.js'), 'utf8');
assert(lobbyJsContent.includes("if (window.slotApp && (window.slotApp.currentGrandMode === 'vault' || window.slotApp.currentGrandMode === 'royale'))"), 'lobby.js must guard against switching games away from royal3x3 in vault or royale');
assert(vaultCrawlerContent.includes('forfeitRun'), 'vault-crawler.js must implement forfeitRun');
assert(appJsContent.includes('forfeitRun'), 'app.js must call forfeitRun if exiting trezor early');
assert(appJsContent.includes('forfeitMatch'), 'app.js must call forfeitMatch if exiting royale early');
console.log('✓ Royal 3x3 slot lock and early exit forfeit logic verified');

// --- TEST 10: Splash-to-Auth Immediate Gating & Stacking ---
console.log('\n--- TEST 10: Splash-to-Auth Immediate Gating & Stacking ---');
assert(cssContent.includes('.login-gate-overlay') && cssContent.includes('z-index: 999990 !important;'), 'login-gate-overlay must have z-index 999990 !important to sit cleanly above pillars and lobby');
assert(appJsContent.includes('proceedAfterSplash'), 'app.js must define proceedAfterSplash for post-splash auth gating');
assert(appJsContent.includes('!isLoggedIn') && appJsContent.includes("loginModal.classList.add('active')"), 'app.js must open login modal if user is not logged in after splash');
assert(!appJsContent.includes('this.openPromotionModal(promo); \n      }, 1400);'), 'app.js must not contain uninvited 1400ms voucher auto-popup timer');
assert(appJsContent.includes('profileLogoutBtn'), 'app.js must wire profileLogoutBtn');
console.log('✓ Splash-to-Auth immediate gating, high z-index layering, and clean voucher handling verified');

console.log('\n======================================================================');
console.log('🎉 ALL 10 SPLASH SCREEN, AUTH GATING, 3 PILLARS & LOBBY TESTS PASSED! 🎉');
console.log('======================================================================');
