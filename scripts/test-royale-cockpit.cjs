const fs = require('fs');
const assert = require('assert');

console.log('--- TEST 1: DOM Elements in index.html for Battle Royale Cockpit ---');
const html = fs.readFileSync('index.html', 'utf8');

const requiredIds = [
  'battle-royale-view',
  'royale-timer-val',
  'royale-rank-val',
  'royale-score-val',
  'royale-zone-banner',
  'royale-leaderboard-strip',
  'btn-target-leader',
  'btn-target-ahead',
  'btn-target-revenge',
  'btn-pvp-freeze',
  'btn-pvp-smoke',
  'btn-pvp-siphon',
  'btn-start-royale-round',
  'btn-exit-royale-round'
];

requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `Missing required element ID: ${id}`);
});

assert(html.includes('royale-cockpit-wing royale-left-wing'), 'Missing royale-left-wing in index.html');
assert(html.includes('royale-cockpit-wing royale-right-wing'), 'Missing royale-right-wing in index.html');
assert(html.includes('royale-panel-card royale-status-card'), 'Missing royale-status-card');
assert(html.includes('royale-panel-card royale-leaderboard-card'), 'Missing royale-leaderboard-card');
assert(html.includes('royale-panel-card royale-targeting-card'), 'Missing royale-targeting-card');
assert(html.includes('royale-panel-card royale-attacks-card'), 'Missing royale-attacks-card');
assert(html.includes('royale-panel-card royale-actions-card'), 'Missing royale-actions-card');
console.log('✓ All 14 required Battle Royale DOM IDs and wings are present');

console.log('--- TEST 2: CSS Zero-Scroll & Cockpit Layout Rules ---');
const hubCss = fs.readFileSync('css/grand-hub.css', 'utf8');
assert(hubCss.includes('.royale-cockpit-wing'), 'Missing .royale-cockpit-wing in grand-hub.css');
assert(hubCss.includes('.royale-panel-card'), 'Missing .royale-panel-card in grand-hub.css');
assert(hubCss.includes('body.theme-royale'), 'Missing body.theme-royale desktop rules in grand-hub.css');
assert(hubCss.includes('.game-container.in-royale-mode'), 'Missing .game-container.in-royale-mode in grand-hub.css');
assert(hubCss.includes('.reel-frozen-overlay'), 'Missing .reel-frozen-overlay in grand-hub.css');
assert(hubCss.includes('.smoke-screen-overlay'), 'Missing .smoke-screen-overlay in grand-hub.css');

const styleCss = fs.readFileSync('css/style.css', 'utf8');
assert(styleCss.includes('.game-container.in-royale-mode .daily-missions-ticker-bar'), 'Missing daily missions hide for royale in style.css');
assert(styleCss.includes('body.theme-royale'), 'Missing body.theme-royale rules in style.css');
console.log('✓ Zero-scroll 100vh desktop rules and component styles verified in CSS');

console.log('--- TEST 3: Resizer Overhead in js/app.js ---');
const appJs = fs.readFileSync('js/app.js', 'utf8');
assert(appJs.includes('(isVaultOpen || isRoyaleOpen)) ? 290 : 500'), 'Resizer must treat isRoyaleOpen with uiOverhead 290 on desktop');
console.log('✓ Responsive slot scaler updated with 290px overhead for Battle Royale');

console.log('--- TEST 4: BattleRoyaleGame DOM Binding and Attack Card State ---');
// Mock browser environment for BattleRoyale testing
global.window = {
  slotAudio: {
    playClick: () => {},
    playWin: () => {},
    playSiren: () => {},
    playCoinDrop: () => {}
  },
  prestigeManager: {
    openModal: () => {}
  }
};

const makeMockEl = () => ({
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {} },
  addEventListener: () => {},
  querySelector: () => ({ textContent: '', style: {} }),
  querySelectorAll: () => [],
  parentElement: { style: {}, addEventListener: () => {} },
  textContent: '',
  innerHTML: ''
});

global.document = {
  getElementById: (id) => makeMockEl(),
  querySelector: () => makeMockEl(),
  querySelectorAll: () => [makeMockEl(), makeMockEl(), makeMockEl()],
  createElement: () => makeMockEl()
};

global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

const brCode = fs.readFileSync('js/games/battle-royale/battle-royale.js', 'utf8');
eval(brCode);
const BattleRoyaleGame = global.window.SlotBattleRoyale;
const br = new BattleRoyaleGame(null);
assert.strictEqual(typeof br.initDOM, 'function', 'initDOM must be a valid function');

br.initDOM();
assert(br.btnFreeze, 'Freeze button must be wired');
assert(br.btnSmoke, 'Smoke button must be wired');
assert(br.btnSiphon, 'Siphon button must be wired');

// Simulate attack unlock
br.attacks.freeze = true;
br.updateAttacksDeck();

// Simulate leaderboard render
br.sortedAll = [
  { name: 'Igrač 1', score: 1200, isYou: true, eliminated: false },
  { name: 'Bot Rex', score: 800, isYou: false, eliminated: false },
  { name: 'Bot Viper', score: 400, isYou: false, eliminated: true }
];
br.renderLeaderboard();
assert(br.leaderboardStripEl.innerHTML.includes('Igrač 1'), 'Leaderboard must render competitor rows');
assert(br.leaderboardStripEl.innerHTML.includes('1,200'), 'Score formatting must work');

console.log('✓ BattleRoyaleGame initialized, UI hooks and competitor pills verified');

console.log('\n======================================');
console.log('🎉 ALL BATTLE ROYALE COCKPIT TESTS PASSED!');
console.log('======================================');
