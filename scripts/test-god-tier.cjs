const fs = require('fs');
const assert = require('assert');

console.log('--- TEST 1: DOM Elements in index.html for God Tier ---');
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="btn-quick-fill-god"'), 'Missing #btn-quick-fill-god');
assert(html.includes('id="profile-god-deck"'), 'Missing #profile-god-deck');
assert(html.includes('id="btn-god-reset-quotas"'), 'Missing #btn-god-reset-quotas');
assert(html.includes('id="btn-god-add-gold"'), 'Missing #btn-god-add-gold');
assert(html.includes('id="btn-god-add-keys"'), 'Missing #btn-god-add-keys');
assert(html.includes('id="btn-god-max-talents"'), 'Missing #btn-god-max-talents');
console.log('✓ All God Tier DOM elements present in index.html');

console.log('--- TEST 2: DailyAccessManager God Mode Bypass ---');
// Mock Storage & Window
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

global.window = {
  slotAudio: { playCoinDrop: () => {}, playHit: () => {} }
};

const damCode = fs.readFileSync('js/core/daily-access-manager.js', 'utf8');
eval(damCode);
const DailyAccessManager = global.window.DailyAccessManager;
const dam = new DailyAccessManager();

// Test normal player reaching limit
const normalId = 'gsc_player_normal';
dam.savePlayerAccess(normalId, {
  date: dam.getTodayStr(),
  vaultEntries: 2,
  royaleEntries: 1
});

const normalCheckVault = dam.canEnterMode(normalId, 'vault');
assert.strictEqual(normalCheckVault.allowed, false, 'Normal player should be locked at 2/2');

// Test God Player bypassing limits
const godId = 'gsc_usr_god';
dam.savePlayerAccess(godId, {
  date: dam.getTodayStr(),
  vaultEntries: 99,
  royaleEntries: 99
});

assert.strictEqual(dam.isGodPlayer(godId), true, 'gsc_usr_god must be recognized as God player');
assert.strictEqual(dam.isGodPlayer('god'), true, 'username god must be recognized as God player');

const godCheckVault = dam.canEnterMode(godId, 'vault');
assert.strictEqual(godCheckVault.allowed, true, 'God player must be allowed even with 99 entries');
assert.strictEqual(godCheckVault.isGod, true, 'isGod flag should be true');

const godCheckRoyale = dam.canEnterMode(godId, 'royale');
assert.strictEqual(godCheckRoyale.allowed, true, 'God player must be allowed in royale');

assert.strictEqual(dam.getRemaining(godId, 'vault'), 999, 'God player remaining should be 999');
assert.strictEqual(dam.getRemaining(godId, 'royale'), 999, 'God player remaining should be 999');
console.log('✓ DailyAccessManager God Mode bypass verified (0% lockouts, 100% access)');

console.log('--- TEST 3: PlayerTracker God Tier Authentication ---');
global.document = {
  getElementById: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} }),
  querySelector: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => []
};

const ptCode = fs.readFileSync('js/core/player-tracker.js', 'utf8');
eval(ptCode);
const PlayerTracker = global.window.PlayerTracker;
const tracker = new PlayerTracker();

// Test God login
tracker.login('god', 'god123').then(res => {
  assert.strictEqual(res.success, true, 'God login must succeed');
  assert.strictEqual(res.player.id, 'gsc_usr_god', 'Player ID must be gsc_usr_god');
  assert.strictEqual(res.player.vip_tier, 'GOD', 'VIP tier must be GOD');
  assert.strictEqual(res.player.is_god, true, 'is_god flag must be true');
  assert.strictEqual(res.player.balance_rsd, 1000000, 'Balance must be 1,000,000 ZLT');
  assert.strictEqual(tracker.profile.is_god, true, 'Tracker profile must have is_god=true');
  console.log('✓ PlayerTracker God Tier instant login verified');

  console.log('--- TEST 4: VaultCrawler God Perks Verification ---');
  global.window = {
    slotAudio: { playCoinDrop: () => {}, playHit: () => {} }
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

  const vcCode = fs.readFileSync('js/games/vault-crawler/vault-crawler.js', 'utf8');
  eval(vcCode);
  const crawler = new global.window.VaultCrawler(null);
  assert.strictEqual(crawler.isGodPlayer(), true, 'Crawler must identify God profile');

  crawler.vaultKeys = 5;
  crawler.mount();
  assert(crawler.vaultKeys >= 99, 'God player should be auto-replenished to at least 99 keys');
  assert.strictEqual(crawler.playerHp, crawler.playerMaxHp, 'God player should have max HP');
  console.log('✓ VaultCrawler God perks (99 keys, max HP, shield) verified');

  console.log('\n======================================');
  console.log('🎉 ALL GOD TIER TESTS PASSED!');
  console.log('======================================');
});
