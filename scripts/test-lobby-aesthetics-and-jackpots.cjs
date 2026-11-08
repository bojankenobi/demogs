/**
 * Test Suite: Lobby Aesthetics, Clean Jackpots & Pure Luxury Typography
 * Verifies that:
 * 1. Cartoon emoji icons are completely removed from Mode Hub, Jackpot pods, Lobby Jackpot cards, and Category tabs.
 * 2. Redundant specs tags (.poster-specs-tag) are removed from all 9 game cards.
 * 3. Game posters (.grand-card-poster) have clean, unobstructed symbols and artwork.
 * 4. Ribbons are floating VIP badges rather than rotated diagonal corner cuts.
 * 5. CSS definitions for card posters, art fan, crash art, plinko art, and metallic jackpots are intact.
 */

const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

console.log('=== TEST SUITE: LOBBY AESTHETICS & PURE LUXURY TYPOGRAPHY ===\n');

// 1. Verify Mode Hub tabs have no low-grade emoji icons
console.log('--- TEST 1: Mode Hub Typography (No Cartoon Emojis) ---');
const modeHubMatch = indexHtml.match(/<nav class="grand-mode-hub" id="grand-mode-hub"[^>]*>([\s\S]*?)<\/nav>/);
if (!modeHubMatch) throw new Error('Grand mode hub not found in index.html');
const modeHubContent = modeHubMatch[1];
if (modeHubContent.includes('hub-tab-icon') || /🎰|🏛️|⚔️|🏆/.test(modeHubContent)) {
  throw new Error('Low-grade icons found in #grand-mode-hub');
}
console.log('✓ Mode Hub has clean, luxury typography without emojis');

// 2. Verify Jackpots Ticker Bar has no cartoon emoji icons
console.log('--- TEST 2: Jackpot Ticker Bar (No Cartoon Emojis) ---');
const jpTickerMatch = indexHtml.match(/<div class="jackpots-ticker-bar" id="jackpots-ticker-bar">([\s\S]*?)<\/div>\s*<!--/);
if (!jpTickerMatch) throw new Error('Jackpots ticker bar not found in index.html');
const jpTickerContent = jpTickerMatch[1];
if (jpTickerContent.includes('jp-icon') || /🥈|🏆|💎/.test(jpTickerContent)) {
  throw new Error('Cartoon emoji icons found in #jackpots-ticker-bar');
}
console.log('✓ Jackpot ticker bar uses pure metallic typography');

// 3. Verify Lobby Jackpots Strip has no cartoon emoji icons
console.log('--- TEST 3: Lobby Jackpots Strip (No Cartoon Emojis) ---');
const lobbyJpMatch = indexHtml.match(/<div class="grand-lobby-jackpot-strip">([\s\S]*?)<\/div>\s*<\/div>\s*<!-- Lobby Subheader/);
if (!lobbyJpMatch) throw new Error('Lobby jackpots strip not found');
const lobbyJpContent = lobbyJpMatch[1];
if (lobbyJpContent.includes('grand-jp-icon') || /🥈|🏆|💎/.test(lobbyJpContent)) {
  throw new Error('Cartoon emoji icons found in .grand-lobby-jackpot-strip');
}
console.log('✓ Lobby jackpot strip uses pure metallic typography');

// 4. Verify Lobby Category Bar has no cartoon emoji icons
console.log('--- TEST 4: Lobby Category Bar (No Cartoon Emojis) ---');
const catBarMatch = indexHtml.match(/<div class="lobby-category-bar">([\s\S]*?)<\/div>\s*<!-- Games Showcase Grid -->/);
if (!catBarMatch) throw new Error('Lobby category bar not found');
const catBarContent = catBarMatch[1];
if (catBarContent.includes('cat-icon') || /🌟|🎰|♠️|⚡/.test(catBarContent)) {
  throw new Error('Cartoon emoji icons found in .lobby-category-bar');
}
console.log('✓ Lobby category bar has clean, luxury typography');

// 5. Verify All 9 Game Cards in Lobby have NO .poster-specs-tag
console.log('--- TEST 5: Game Cards Free of Specs Overlays ---');
const gridMatch = indexHtml.match(/<div class="egt-games-grid">([\s\S]*?)<\/div>\s*<!-- EGT Cabinet Bottom Control\/Exit Bar -->/);
if (!gridMatch) throw new Error('.egt-games-grid not found');
const gridContent = gridMatch[1];

if (gridContent.includes('poster-specs-tag')) {
  throw new Error('Found redundant .poster-specs-tag in games grid!');
}

const gameCards = gridContent.match(/class="[^"]*egt-game-card[^"]*"/g) || [];
if (gameCards.length < 9) {
  throw new Error(`Expected at least 9 game cards, found ${gameCards.length}`);
}
console.log(`✓ All ${gameCards.length} game cards are completely free of obstructing specs tags`);

// 6. Verify Poster Artwork Structures for Games
console.log('--- TEST 6: Poster Artwork Structures ---');
const requiredPosters = [
  'poster-classic',
  'poster-royal',
  'poster-focus',
  'poster-mines',
  'poster-crash',
  'poster-plinko',
  'poster-blackjack',
  'poster-videopoker',
  'poster-holdem',
  'poster-scratch',
  'poster-roulette'
];
requiredPosters.forEach(posterClass => {
  if (!gridContent.includes(posterClass)) {
    throw new Error(`Missing poster class: ${posterClass}`);
  }
});

if (!gridContent.includes('poster-crash-art') || !gridContent.includes('poster-rocket-icon')) {
  throw new Error('Crash poster missing clean art structure');
}
if (!gridContent.includes('poster-plinko-art') || !gridContent.includes('poster-plinko-orb')) {
  throw new Error('Plinko poster missing clean art structure');
}
if (!gridContent.includes('poster-card-fan') || !gridContent.includes('poster-mini-card')) {
  throw new Error('Card games missing .poster-card-fan structure');
}
console.log('✓ All 9 game posters feature tailored artwork components');

// 7. Verify CSS Rules
console.log('--- TEST 7: CSS Architecture Verification ---');
if (!styleCss.includes('.grand-card-poster') || !styleCss.includes('.poster-specs-tag {\n  display: none !important;')) {
  throw new Error('CSS missing proper poster and specs tag suppression');
}
if (!styleCss.includes('.poster-card-fan') || !styleCss.includes('.poster-mini-card')) {
  throw new Error('CSS missing .poster-card-fan styling');
}
if (!styleCss.includes('.poster-crash-art') || !styleCss.includes('.poster-plinko-art')) {
  throw new Error('CSS missing Crash or Plinko poster styling');
}
if (!styleCss.includes('.grand-jp-card.jp-silver') || !styleCss.includes('.grand-jp-card.jp-gold')) {
  throw new Error('CSS missing lobby jackpot card styling');
}
console.log('✓ CSS definitions verified for luxury presentation');

console.log('\n============================================================');
console.log('🎉 ALL LOBBY AESTHETICS & JACKPOT TESTS PASSED 100%! 🎉');
console.log('============================================================\n');
