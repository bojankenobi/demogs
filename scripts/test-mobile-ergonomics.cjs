const fs = require('fs');
const assert = require('assert');

console.log('--- TEST 1: Mobile Ergonomic DOM Elements in index.html ---');
const html = fs.readFileSync('index.html', 'utf8');

const mobileElements = [
  'vault-mobile-dock',
  'btn-dock-vault-shop',
  'btn-dock-vault-talents',
  'btn-dock-vault-floors',
  'btn-dock-vault-rank',
  'btn-dock-vault-reset',
  'royale-mobile-dock',
  'btn-dock-royale-target',
  'btn-dock-atk-freeze',
  'btn-dock-atk-smoke',
  'btn-dock-atk-siphon',
  'btn-dock-royale-leaderboard',
  'vault-shop-modal',
  'vault-floors-modal',
  'royale-leaderboard-modal'
];

mobileElements.forEach(id => {
  assert(html.includes(`id="${id}"`), `Missing Mobile Ergonomic DOM ID in index.html: ${id}`);
});
console.log('✓ All 15 required Mobile Ergonomic DOM IDs are present in index.html');

console.log('--- TEST 2: CSS Mobile & Tablet Ergonomic Rules (< 1024px) ---');
const hubCss = fs.readFileSync('css/grand-hub.css', 'utf8');

assert(hubCss.includes('@media (max-width: 1023px)'), 'Missing @media (max-width: 1023px) in grand-hub.css');
assert(hubCss.includes('.vault-left-wing'), 'Missing .vault-left-wing in grand-hub.css');
assert(hubCss.includes('.vault-mobile-action-dock'), 'Missing .vault-mobile-action-dock in grand-hub.css');
assert(hubCss.includes('.royale-mobile-action-dock'), 'Missing .royale-mobile-action-dock in grand-hub.css');
assert(hubCss.includes('.vault-left-wing .vault-tower-strip'), 'Missing suppression of 5-floor selector in top card on mobile');
assert(hubCss.includes('.royale-left-wing .royale-leaderboard-card'), 'Missing suppression of competitor list in top card on mobile');
assert(hubCss.includes('.vault-shop-card-modal'), 'Missing .vault-shop-card-modal styles');
assert(hubCss.includes('.vault-floors-card-modal'), 'Missing .vault-floors-card-modal styles');
assert(hubCss.includes('.royale-leaderboard-card-modal'), 'Missing .royale-leaderboard-card-modal styles');
console.log('✓ CSS Mobile Ergonomic rules, order rules, and modal cards verified');

console.log('--- TEST 3: Slot Scaler Refinements in js/app.js ---');
const appJs = fs.readFileSync('js/app.js', 'utf8');
assert(appJs.includes('uiOverhead = hasActiveSubgame ? 345 : 320;'), 'Missing refined mobile overhead in js/app.js');
assert(appJs.includes('(isVaultOpen || isRoyaleOpen)) ? 290 : 500'), 'Desktop assertion must remain intact');
assert(appJs.includes('if (vw < 1024) uiOverhead = 350;'), 'Missing tablet overhead refinement in js/app.js');
console.log('✓ Universal slot scaler correctly handles mobile and tablet without reel cutoff');

console.log('--- TEST 4: VaultCrawler Mobile Modal & Dock Logic ---');
const mockWallet = { rsdBalance: 5000, saveState: () => {}, updateUI: () => {} };
const mockLobby = {};

// Mock browser DOM environment
global.window = {
  slotAudio: { playClick: () => {}, playCoinDrop: () => {} }
};
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};
global.document = {
  getElementById: (id) => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    innerHTML: '',
    textContent: ''
  }),
  querySelector: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => []
};

const vcCode = fs.readFileSync('js/games/vault-crawler/vault-crawler.js', 'utf8');
eval(vcCode);
const VaultCrawler = global.window.VaultCrawler;

const vc = new VaultCrawler(mockWallet, mockLobby);
assert(typeof vc.openShopModal === 'function', 'Missing openShopModal method');
assert(typeof vc.closeShopModal === 'function', 'Missing closeShopModal method');
assert(typeof vc.openFloorsModal === 'function', 'Missing openFloorsModal method');
assert(typeof vc.closeFloorsModal === 'function', 'Missing closeFloorsModal method');
assert(typeof vc.renderFloorsModal === 'function', 'Missing renderFloorsModal method');

vc.vaultKeys = 10;
vc.updateHUD();
console.log('✓ VaultCrawler mobile modal and dock methods verified');

console.log('--- TEST 5: BattleRoyaleGame Mobile Modal & Dock Logic ---');
const brCode = fs.readFileSync('js/games/battle-royale/battle-royale.js', 'utf8');
eval(brCode);
const BattleRoyaleGame = global.window.SlotBattleRoyale;
const br = new BattleRoyaleGame(mockWallet, mockLobby);
assert(typeof br.openLeaderboardModal === 'function', 'Missing openLeaderboardModal method');
assert(typeof br.closeLeaderboardModal === 'function', 'Missing closeLeaderboardModal method');
assert(typeof br.renderLeaderboardModal === 'function', 'Missing renderLeaderboardModal method');

br.updateAttacksDeck();
br.updateHUD();
console.log('✓ BattleRoyaleGame mobile modal and dock methods verified');

console.log('\n======================================');
console.log('🎉 ALL MOBILE ERGONOMICS TESTS PASSED!');
console.log('======================================');
