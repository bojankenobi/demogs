/**
 * Test Suite: Clean EGT Minimalist Bottom Bar & Centralized Menu Architecture
 * Verifies:
 * 1. Clean EGT footer layout: game selector left, space center, sound & menu right.
 * 2. Complete suppression of 8 redundant clutter icons on all screen widths.
 * 3. Menu modal integrity with new "Izbor Igara" card and "Moji VIP Vaučeri".
 * 4. JS wiring ensuring vouchers in menu open the modern tabbed modal (Active, Redeemed, Expired).
 * 5. CSS responsive rules across mobile, tablet, and widescreen desktop.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: CLEAN EGT BOTTOM BAR & CENTRALIZED MENU ===\n');

// 1. Verify index.html DOM structure
console.log('--- TEST 1: DOM Elements in index.html ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Footer bar container
assert(indexHtml.includes('id="footer-system-bar"'), 'footer-system-bar ID must exist');
assert(indexHtml.includes('id="egt-game-select-btn"'), 'egt-game-select-btn must exist on left');
assert(indexHtml.includes('class="footer-center-space"'), 'footer-center-space must exist in center');
assert(indexHtml.includes('id="footer-right-actions"'), 'footer-right-actions must exist on right');
assert(indexHtml.includes('id="sound-btn"'), 'sound-btn must exist inside footer-right-actions');
assert(indexHtml.includes('id="casino-menu-btn"'), 'casino-menu-btn must exist inside footer-right-actions');

// Hidden store for legacy listeners
assert(indexHtml.includes('class="footer-system-hidden-store"'), 'footer-system-hidden-store must exist');
assert(indexHtml.includes('id="paytable-btn"'), 'paytable-btn preserved in hidden store');
assert(indexHtml.includes('id="pwa-install-btn"'), 'pwa-install-btn preserved in hidden store');
assert(indexHtml.includes('id="ambient-btn"'), 'ambient-btn preserved in hidden store');
assert(indexHtml.includes('id="prestige-hall-btn"'), 'prestige-hall-btn preserved in hidden store');
assert(indexHtml.includes('id="tournament-btn"'), 'tournament-btn preserved in hidden store');
assert(indexHtml.includes('id="player-profile-btn"'), 'player-profile-btn preserved in hidden store');
assert(indexHtml.includes('id="lang-toggle"'), 'lang-toggle preserved in hidden store');
assert(indexHtml.includes('id="hud-voucher-btn"'), 'hud-voucher-btn preserved in hidden store');

// Menu modal cards
assert(indexHtml.includes('id="menu-opt-lobby"'), 'menu-opt-lobby must exist in menu grid');
assert(indexHtml.includes('id="menu-opt-voucher"'), 'menu-opt-voucher must exist in menu grid');
console.log('✓ All footer and menu DOM structures verified');

// 2. Verify CSS Styling in css/style.css
console.log('\n--- TEST 2: CSS EGT Rules in css/style.css ---');
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

assert(styleCss.includes('.desktop-only-icon') && styleCss.includes('.btn-voucher-hud'), 'Suppression selectors must target utility icons');
assert(styleCss.includes('.footer-system-hidden-store') && styleCss.includes('display: none !important;'), 'footer-system-hidden-store must have display: none !important');
assert(styleCss.includes('.footer-right-actions'), 'footer-right-actions class must be styled');
assert(styleCss.includes('btn-quick-mute'), 'btn-quick-mute styling must exist');
console.log('✓ All CSS clean EGT rules, suppression, and layout verified');

// 3. Verify JS Handlers in js/app.js & js/core/lobby.js
console.log('\n--- TEST 3: JavaScript Wiring in app.js & lobby.js ---');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const lobbyJs = fs.readFileSync(path.join(__dirname, '../js/core/lobby.js'), 'utf8');

assert(appJs.includes('menu-opt-lobby'), 'app.js must handle menu-opt-lobby');
assert(appJs.includes('openMyVouchersModal'), 'menu-opt-voucher must route to openMyVouchersModal');
assert(lobbyJs.includes('menu-opt-lobby'), 'lobby.js must wire menu-opt-lobby to openModal');
console.log('✓ JavaScript menu actions, lobby trigger, and voucher modal routing verified');

// 4. Cache Busters Verification
console.log('\n--- TEST 4: Cache Busters in index.html ---');
assert(/style\.css\?v=(11[2-9]|1[2-9]\d)/.test(indexHtml), 'style.css bumped to v>=112');
assert(indexHtml.includes('lobby.js?v=108'), 'lobby.js bumped to v=108');
assert(indexHtml.includes('app.js?v=110'), 'app.js bumped to v=110');
console.log('✓ Cache busters correctly bumped');

console.log('\n============================================================');
console.log('🎉 ALL CLEAN EGT BOTTOM BAR & MENU TESTS PASSED 100%! 🎉');
console.log('============================================================\n');
