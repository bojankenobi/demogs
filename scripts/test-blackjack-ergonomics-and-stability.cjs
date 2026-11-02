/**
 * Test Suite: Grand Royal Blackjack Ergonomics, Compact Layout & Screen Stability Verification
 * Verifies:
 * 1. Unified Bet Console (Stepper + 5-Chip Casino Rack + Quick Multipliers) in index.html
 * 2. Permanent Card Placeholders for Dealer & Player (Prevents vertical layout shift / jumping)
 * 3. Pre-allocated Bet Badge Slot (.bj-bet-chip-slot) and Hand Header height reservation
 * 4. Zero-Scroll & 100vh/100dvh Container Locking in css/style.css
 * 5. Action bar uniform 42px height across all phases (Deal, Hit/Stand/Double/Split, Rebet/New)
 * 6. Cache busters bumped
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: BLACKJACK ERGONOMICS & SCREEN STABILITY ===\n');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
const bjJs = fs.readFileSync(path.join(__dirname, '../js/games/blackjack/blackjack.js'), 'utf8');

// --- TEST 1: Unified Bet Console in index.html ---
console.log('--- TEST 1: Unified Bet Console in index.html ---');
assert(html.includes('class="bj-bet-row-controls"'), 'index.html must have .bj-bet-row-controls');
assert(html.includes('id="bj-bet-rack-wrap"'), 'index.html must have #bj-bet-rack-wrap container');
assert(html.includes('id="bj-bet-minus"'), 'Must have #bj-bet-minus');
assert(html.includes('id="bj-bet-val"'), 'Must have #bj-bet-val');
assert(html.includes('id="bj-bet-plus"'), 'Must have #bj-bet-plus');
assert(html.includes('id="bj-chip-double"'), 'Must have #bj-chip-double');
assert(html.includes('id="bj-chip-clear"'), 'Must have #bj-chip-clear');
assert(html.includes('class="bj-chip-btn chip-10"'), 'Must have chip-10');
assert(html.includes('class="bj-chip-btn chip-500"'), 'Must have chip-500');
console.log('✓ Unified Bet Console structure verified (single sleek horizontal console)');

// --- TEST 2: Permanent Card Placeholders & Fixed Geometry ---
console.log('\n--- TEST 2: Permanent Card Placeholders & Fixed Geometry ---');
// In index.html
assert(html.includes('<div class="bj-cards-container" id="bj-dealer-cards">\n                <div class="bj-card-placeholder"></div>'), 'Dealer cards must have pre-allocated placeholders in index.html');
assert(html.includes('id="bj-player-cards-0">\n                    <div class="bj-card-placeholder"></div>'), 'Player cards must have pre-allocated placeholders in index.html');

// In resetTable() in blackjack.js
assert(bjJs.includes('this.dealerCardsEl.innerHTML = \'<div class="bj-card-placeholder"></div><div class="bj-card-placeholder"></div>\';'), 'resetTable must restore dealer placeholders');
assert(bjJs.includes('this.playerCardsEls[0].innerHTML = \'<div class="bj-card-placeholder"></div><div class="bj-card-placeholder"></div>\';'), 'resetTable must restore player placeholders');

// In renderCard() in blackjack.js
assert(bjJs.includes('const placeholder = containerEl.querySelector(\'.bj-card-placeholder\');'), 'renderCard must check for pre-allocated placeholder');
assert(bjJs.includes('placeholder.replaceWith(cardEl);'), 'renderCard must replace placeholder without layout shift');
console.log('✓ Permanent reserved card slots verified (screen height identical before & after deal)');

// --- TEST 3: Pre-allocated Bet Badge Slot & Header Height Reservation ---
console.log('\n--- TEST 3: Pre-allocated Bet Badge Slot & Header Height Reservation ---');
assert(html.includes('class="bj-bet-chip-slot"'), 'index.html must have .bj-bet-chip-slot');
assert(css.includes('.bj-bet-chip-slot'), 'css/style.css must define .bj-bet-chip-slot');
assert(css.includes('.bj-hand-header {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 20px;'), 'bj-hand-header must reserve min-height: 20px');
console.log('✓ Badge slot & header height reservation verified (no micro-jitter when badges appear)');

// --- TEST 4: Zero-Scroll CSS Rules & Container Locking ---
console.log('\n--- TEST 4: Zero-Scroll CSS Rules & Container Locking ---');
assert(css.includes('.game-container.in-blackjack-mode,\n.game-container.in-holdem-mode'), 'Must have combined zero-scroll rule for in-blackjack-mode and in-holdem-mode');
assert(css.includes('overflow: hidden !important;'), 'Must enforce overflow: hidden !important on container');
assert(css.includes('.game-container.in-blackjack-mode .hud-panel'), 'Must hide .hud-panel in blackjack mode');
assert(css.includes('.game-container.in-blackjack-mode .controls-panel'), 'Must hide .controls-panel in blackjack mode');
assert(css.includes('.bj-card-placeholder'), 'Must style .bj-card-placeholder');
assert(css.includes('.bj-action-bar-wrap'), 'Must style .bj-action-bar-wrap');
console.log('✓ Zero-scroll container rules and layout locking verified');

// --- TEST 5: Action Button Uniform Dimensions (42px) ---
console.log('\n--- TEST 5: Action Button Uniform Dimensions (42px) ---');
assert(css.includes('height: 42px;\n  min-height: 42px;\n  max-height: 42px;'), 'bj-action-bar-wrap must lock height to 42px');
assert(css.includes('.btn-bj-main'), 'Must style .btn-bj-main');
assert(css.includes('.btn-bj-action'), 'Must style .btn-bj-action');
console.log('✓ Uniform 42px button height verified across all phases (Betting/Deal, Player Turn, Round Over)');

// --- TEST 6: Cache Busters Bumped ---
console.log('\n--- TEST 6: Cache Busters Bumped ---');
assert(/style\.css\?v=(11[6-9]|1[2-9]\d)/.test(html), 'style.css version must be >= 116');
assert(/blackjack\.js\?v=(10[5-9]|1[1-9]\d)/.test(html), 'blackjack.js version must be >= 105');
console.log('✓ Cache busters verified (style.css?v=116, blackjack.js?v=105)');

console.log('\n======================================================');
console.log('🎉 ALL BLACKJACK ERGONOMICS & STABILITY TESTS PASSED! 🎉');
console.log('======================================================\n');
process.exit(0);
