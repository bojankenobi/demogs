const fs = require('fs');
const assert = require('assert');

console.log('--- TEST 1: DOM Structure & Element IDs in index.html ---');
const html = fs.readFileSync('index.html', 'utf8');

const requiredIds = [
  'vault-crawler-view',
  'vault-floor-title',
  'vault-floor-sub',
  'vault-heist-pct',
  'vault-tower-floors',
  'vault-heist-progress-fill',
  'vault-map-laser-line',
  'vault-map-nodes',
  'vault-player-card',
  'vault-player-hp-val',
  'vault-player-hp-fill',
  'vault-player-shield-val',
  'vault-player-shield-fill',
  'vault-enemy-card',
  'vault-enemy-name',
  'vault-enemy-hp-val',
  'vault-enemy-hp-fill',
  'vault-enemy-status-tip',
  'vault-combat-log',
  'vault-keys-display',
  'vault-keys-val',
  'btn-vault-shop-potion',
  'btn-vault-shop-shield',
  'btn-vault-shop-shock',
  'vault-prev-wild',
  'vault-prev-armor',
  'vault-prev-magnet',
  'btn-vault-talents',
  'btn-vault-leaderboard',
  'btn-vault-reset-run'
];

requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `Missing ID in index.html: ${id}`);
});
console.log('✓ All 30 required Vault DOM IDs are present in index.html');

console.log('--- TEST 2: Semantic Cockpit Wings Verification ---');
assert(html.includes('vault-cockpit-wing vault-left-wing'), 'Missing left wing in index.html');
assert(html.includes('vault-cockpit-wing vault-right-wing'), 'Missing right wing in index.html');
assert(html.includes('vault-panel-card vault-progression-card'), 'Missing progression card');
assert(html.includes('vault-panel-card vault-combat-card'), 'Missing combat card');
assert(html.includes('vault-panel-card vault-keys-card'), 'Missing keys card');
assert(html.includes('vault-panel-card vault-shop-card'), 'Missing shop card');
assert(html.includes('vault-panel-card vault-talents-card'), 'Missing talents card');
assert(html.includes('vault-panel-card vault-actions-card'), 'Missing actions card');
console.log('✓ Left and Right Cockpit Wings correctly host all modular panels');

console.log('--- TEST 3: CSS Cockpit & Zero-Scroll Rules ---');
const hubCss = fs.readFileSync('css/grand-hub.css', 'utf8');
assert(hubCss.includes('.vault-cockpit-wing'), 'Missing .vault-cockpit-wing in grand-hub.css');
assert(hubCss.includes('.vault-panel-card'), 'Missing .vault-panel-card in grand-hub.css');
assert(hubCss.includes('.vault-shop-btn'), 'Missing .vault-shop-btn in grand-hub.css');
assert(hubCss.includes('body.theme-vault'), 'Missing body.theme-vault in grand-hub.css');
assert(hubCss.includes('.game-container.in-vault-mode'), 'Missing .game-container.in-vault-mode in grand-hub.css');
assert(hubCss.includes('.vault-progression-card .tower-fl-badge'), 'Missing compact tower badge suppression');

const styleCss = fs.readFileSync('css/style.css', 'utf8');
assert(styleCss.includes('.game-container.in-vault-mode .daily-missions-ticker-bar'), 'Missing daily-missions-ticker-bar hide in style.css');
console.log('✓ CSS Cockpit rules, zero-scrolling properties and component styles verified');

console.log('--- TEST 4: Vault Crawler Shop Logic Unit Test ---');
// Mock browser environment for VaultCrawler logic testing
global.window = {
  slotAudio: {
    playCoinDrop: () => {},
    playHit: () => {}
  }
};
global.document = {
  getElementById: (id) => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    querySelectorAll: () => [],
    appendChild: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
  }),
  querySelector: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add: () => {} }, textContent: '', remove: () => {} })
};
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

const vcCode = fs.readFileSync('js/games/vault-crawler/vault-crawler.js', 'utf8');
eval(vcCode);
const VaultCrawlerGame = global.window.VaultCrawler;
const crawler = new VaultCrawlerGame(null);
crawler.isActive = true;
crawler.vaultKeys = 5;
crawler.playerHp = 50;
crawler.playerMaxHp = 100;
crawler.playerShield = 0;
crawler.currentEnemy = { name: 'Stražar', icon: '👮', hp: 100, maxHp: 100, attack: 10 };

// Test Potion
const boughtPotion = crawler.buyShopItem('potion');
assert.strictEqual(boughtPotion, true, 'Potion buy should succeed');
assert.strictEqual(crawler.vaultKeys, 4, 'Keys should decrement by 1');
assert.strictEqual(crawler.playerHp, 80, 'HP should increase by 30');

// Test Shield
const boughtShield = crawler.buyShopItem('shield');
assert.strictEqual(boughtShield, true, 'Shield buy should succeed');
assert.strictEqual(crawler.vaultKeys, 3, 'Keys should decrement by 1');
assert.strictEqual(crawler.playerShield, 20, 'Shield should increase by 20');

// Test Shock
const boughtShock = crawler.buyShopItem('shock');
assert.strictEqual(boughtShock, true, 'Shock buy should succeed');
assert.strictEqual(crawler.vaultKeys, 1, 'Keys should decrement by 2');
assert.strictEqual(crawler.currentEnemy.hp, 60, 'Enemy HP should drop by 40');

// Test Insufficient Keys for Shock (costs 2, has 1)
const failShock = crawler.buyShopItem('shock');
assert.strictEqual(failShock, false, 'Shock buy should fail with 1 key');
assert.strictEqual(crawler.vaultKeys, 1, 'Keys should remain 1');

console.log('✓ Shop consumables (Potion, Shield, Shock) buy logic passed 100%');

console.log('\n======================================');
console.log('🎉 ALL VAULT COCKPIT TESTS PASSED!');
console.log('======================================');
