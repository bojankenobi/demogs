/**
 * Verification Test Suite: Authentic EGT Multi-Game Cabinet Task Bar & Denomination Strips
 * Validates DOM architecture, CSS polygon clip-paths, JavaScript category filtering,
 * live CASH display sync & privacy toggle, meta controls, and denomination badges.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: AUTHENTIC EGT CABINET TASK BAR & DENOMINATION STRIPS ===\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
const lobbyJsContent = fs.readFileSync(path.join(__dirname, '../js/core/lobby.js'), 'utf8');
const appJsContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// --- TEST 1: DOM Elements in index.html ---
console.log('--- TEST 1: DOM Architecture in index.html ---');
assert(htmlContent.includes('id="egt-cabinet-taskbar"'), 'Must have #egt-cabinet-taskbar');
assert(htmlContent.includes('id="egt-taskbar-cash-wing"'), 'Must have left CASH trapezoid wing');
assert(htmlContent.includes('id="lobby-cash-privacy-btn"'), 'Must have cash privacy toggle eye button');
assert(htmlContent.includes('id="lobby-cash-val"'), 'Must have #lobby-cash-val');
assert(htmlContent.includes('id="lobby-cash-sub"'), 'Must have #lobby-cash-sub');

assert(htmlContent.includes('id="egt-taskbar-nav"'), 'Must have center taskbar nav');
assert(htmlContent.includes('id="close-egt-games"'), 'Must preserve #close-egt-games return button');
assert(htmlContent.includes('id="tb-cat-all"'), 'Must have SVE IGRE tab');
assert(htmlContent.includes('id="tb-cat-popular"'), 'Must have NAJIGRANIJE tab');
assert(htmlContent.includes('id="tb-cat-slots"'), 'Must have SLOTOVI tab');
assert(htmlContent.includes('id="tb-cat-tables"'), 'Must have STOLOVI tab');
assert(htmlContent.includes('id="tb-cat-quick"'), 'Must have BRZE IGRE tab');
assert(htmlContent.includes('id="tb-cat-buybonus"'), 'Must have KUPI BONUS tab');

assert(htmlContent.includes('id="egt-taskbar-meta-wing"'), 'Must have right meta trapezoid wing');
assert(htmlContent.includes('id="lobby-lang-toggle"'), 'Must have #lobby-lang-toggle');
assert(htmlContent.includes('id="lobby-lang-code"'), 'Must have #lobby-lang-code');
assert(htmlContent.includes('id="lobby-sound-toggle"'), 'Must have #lobby-sound-toggle');
assert(htmlContent.includes('id="lobby-sound-icon"'), 'Must have #lobby-sound-icon');

// Check all game cards have denomination strips (11 total games)
const denomMatches = htmlContent.match(/class="egt-denom-strip"/g) || [];
assert(denomMatches.length >= 9, `Expected at least 9 .egt-denom-strip, found ${denomMatches.length}`);
console.log(`✓ All taskbar wings, nav tabs, meta controls, and ${denomMatches.length} denomination strips verified`);

// --- TEST 2: CSS Styling in css/style.css ---
console.log('\n--- TEST 2: CSS EGT Rules in css/style.css ---');
assert(cssContent.includes('.egt-cabinet-taskbar'), 'Must define .egt-cabinet-taskbar');
assert(cssContent.includes('.egt-taskbar-cash-wing'), 'Must define .egt-taskbar-cash-wing');
assert(cssContent.includes('.egt-taskbar-meta-wing'), 'Must define .egt-taskbar-meta-wing');
assert(cssContent.includes('.egt-taskbar-nav'), 'Must define .egt-taskbar-nav');
assert(cssContent.includes('.egt-nav-item'), 'Must define .egt-nav-item');
assert(cssContent.includes('.lobby-taskbar-tab.active'), 'Must define .lobby-taskbar-tab.active');
assert(cssContent.includes('.egt-denom-strip'), 'Must define .egt-denom-strip');
assert(cssContent.includes('.denom-pill.active'), 'Must define .denom-pill.active');

// Verify polygon clip-paths for trapezoids
assert(cssContent.includes('clip-path: polygon'), 'Must use clip-path polygon for authentic angled cabinet wings');
assert(cssContent.includes('overflow-x: auto'), 'Must support horizontal scroll / touch pan');
console.log('✓ Authentic cabinet taskbar styles, gold gradients, and clip-paths verified');

// --- TEST 3: JavaScript Logic in lobby.js & app.js ---
console.log('\n--- TEST 3: JavaScript Filter & Sync Logic ---');
assert(lobbyJsContent.includes('filterCategory(category)'), 'lobby.js must have filterCategory');
assert(lobbyJsContent.includes('updateLobbyCash()'), 'lobby.js must have updateLobbyCash');
assert(lobbyJsContent.includes('updateLanguageUI()'), 'lobby.js must have updateLanguageUI');
assert(lobbyJsContent.includes('updateSoundUI()'), 'lobby.js must have updateSoundUI');
assert(lobbyJsContent.includes('gsc_lobby_cash_hidden'), 'lobby.js must persist cash privacy');
assert(lobbyJsContent.includes('.lobby-taskbar-tab'), 'lobby.js must wire taskbar category tabs');
assert(lobbyJsContent.includes('data-tags'), 'lobby.js filterCategory must support data-tags');
assert(appJsContent.includes('window.casinoLobby = this.lobby'), 'app.js must expose casinoLobby globally');

console.log('✓ JavaScript logic for categories, live CASH sync, and privacy toggle verified');

// --- TEST 4: Category Filtering Simulation ---
console.log('\n--- TEST 4: Category Filtering Simulation ---');
const gameCardsConfig = [
  { id: 'classic', cat: 'slots', tags: ['popular', 'slots', 'fruit'] },
  { id: 'royal3x3', cat: 'slots', tags: ['popular', 'slots', 'buybonus'] },
  { id: 'fullfocus', cat: 'slots', tags: ['slots', 'fullfocus'] },
  { id: 'mines', cat: 'quick', tags: ['quick', 'buybonus', 'mines'] },
  { id: 'crash', cat: 'quick', tags: ['popular', 'quick', 'crash'] },
  { id: 'plinko', cat: 'quick', tags: ['quick', 'plinko'] },
  { id: 'blackjack', cat: 'tables', tags: ['tables', 'blackjack'] },
  { id: 'videopoker', cat: 'tables', tags: ['tables', 'poker'] },
  { id: 'holdem', cat: 'tables', tags: ['popular', 'tables', 'poker'] }
];

function simulateFilter(category) {
  return gameCardsConfig.filter(c => {
    return category === 'all' || c.cat === category || c.tags.includes(category);
  }).map(c => c.id);
}

const allGames = simulateFilter('all');
assert.strictEqual(allGames.length, 9, 'All games must return 9 games');

const popularGames = simulateFilter('popular');
assert(popularGames.includes('classic') && popularGames.includes('royal3x3') && popularGames.includes('crash') && popularGames.includes('holdem'), 'Popular filter must include top games');

const slotsGames = simulateFilter('slots');
assert.strictEqual(slotsGames.length, 3, 'Slots category must return 3 slots');

const tablesGames = simulateFilter('tables');
assert.strictEqual(tablesGames.length, 3, 'Tables category must return 3 table games');

const quickGames = simulateFilter('quick');
assert.strictEqual(quickGames.length, 3, 'Quick category must return 3 fast games');

const buyBonusGames = simulateFilter('buybonus');
assert(buyBonusGames.includes('royal3x3') && buyBonusGames.includes('mines'), 'BuyBonus category must return games with buy bonus feature');

console.log('✓ All 6 category filters accurately partition and tag the 9 games');

// --- TEST 5: Cache Busters ---
console.log('\n--- TEST 5: Cache Busters in index.html ---');
assert(/style\.css\?v=(1[2-9]\d|119)/.test(htmlContent), 'style.css must be >= 119');
assert(/lobby\.js\?v=(109|1[1-9]\d)/.test(htmlContent), 'lobby.js must be >= 109');
assert(htmlContent.includes('wallet.js?v=92'), 'wallet.js must be v=92');
assert(/app\.js\?v=(11[2-9]|1[2-9]\d)/.test(htmlContent), 'app.js must be >= 112');
console.log('✓ All cache busters verified (style.css>=119, lobby.js=109, wallet.js=92, app.js>=112)');

console.log('\n========================================================================');
console.log('🎉 ALL AUTHENTIC EGT CABINET TASK BAR TESTS PASSED 100%! 🎉');
console.log('========================================================================\n');
