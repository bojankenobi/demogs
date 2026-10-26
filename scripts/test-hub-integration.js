import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup minimal DOM simulation
global.window = global;
global.localStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = String(v); },
  removeItem(k) { delete this.data[k]; },
  clear() { this.data = {}; }
};

// Mock elements needed by scripts
function createMockEl(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    style: {},
    children: [],
    innerHTML: '',
    textContent: '',
    appendChild(child) { this.children.push(child); return child; },
    addEventListener(event, fn) { this[`on_${event}`] = fn; },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    disabled: false
  };
}

const domElements = {
  'vault-crawler-view': createMockEl('vault-crawler-view'),
  'battle-royale-view': createMockEl('battle-royale-view'),
  'vault-floor-title': createMockEl('vault-floor-title'),
  'vault-floor-sub': createMockEl('vault-floor-sub'),
  'vault-keys-val': createMockEl('vault-keys-val'),
  'vault-player-hp-fill': createMockEl('vault-player-hp-fill'),
  'vault-player-hp-val': createMockEl('vault-player-hp-val'),
  'vault-player-shield-fill': createMockEl('vault-player-shield-fill'),
  'vault-player-shield-val': createMockEl('vault-player-shield-val'),
  'vault-enemy-name': createMockEl('vault-enemy-name'),
  'vault-enemy-hp-fill': createMockEl('vault-enemy-hp-fill'),
  'vault-enemy-hp-val': createMockEl('vault-enemy-hp-val'),
  'vault-combat-log': createMockEl('vault-combat-log'),
  'vault-map-nodes': createMockEl('vault-map-nodes'),
  'btn-vault-talents': createMockEl('btn-vault-talents'),
  'btn-vault-reset-run': createMockEl('btn-vault-reset-run'),
  'royale-timer-val': createMockEl('royale-timer-val'),
  'royale-rank-val': createMockEl('royale-rank-val'),
  'royale-score-val': createMockEl('royale-score-val'),
  'royale-zone-banner': createMockEl('royale-zone-banner'),
  'btn-pvp-freeze': createMockEl('btn-pvp-freeze'),
  'btn-pvp-smoke': createMockEl('btn-pvp-smoke'),
  'btn-pvp-siphon': createMockEl('btn-pvp-siphon'),
  'royale-leaderboard-strip': createMockEl('royale-leaderboard-strip'),
  'btn-start-royale-round': createMockEl('btn-start-royale-round'),
  'btn-exit-royale-round': createMockEl('btn-exit-royale-round'),
  'royale-frozen-overlay': createMockEl('royale-frozen-overlay'),
  'royale-smoke-overlay': createMockEl('royale-smoke-overlay')
};

global.document = {
  getElementById(id) {
    if (!domElements[id]) {
      domElements[id] = createMockEl(id);
    }
    return domElements[id];
  },
  querySelector(sel) {
    if (sel === '.slot-stage-scaler') return createMockEl('slot-stage-scaler');
    return null;
  },
  querySelectorAll() { return []; },
  createElement(tag) { return createMockEl('', tag); },
  body: createMockEl('body')
};

global.window.slotAudio = {
  playClick() {},
  playWin() {},
  playBigWin() {},
  playLever() {}
};

// Load classes via vm
const vaultCode = fs.readFileSync(path.join(__dirname, '../js/games/vault-crawler/vault-crawler.js'), 'utf-8');
const royaleCode = fs.readFileSync(path.join(__dirname, '../js/games/battle-royale/battle-royale.js'), 'utf-8');

vm.runInThisContext(vaultCode);
vm.runInThisContext(royaleCode);

console.log('✅ Loaded VaultCrawler and SlotBattleRoyale classes into execution context.');

// Mock wallet & lobby
const mockWallet = {
  balance: 5000,
  addCredits(amt) { this.balance += amt; }
};
const mockLobby = {
  currentGameId: 'royal3x3'
};

// 1. Test Vault Crawler
const crawler = new window.VaultCrawler(mockWallet, mockLobby);
console.log('1. Instantiated VaultCrawler: Floor =', crawler.floor);

crawler.mount();
console.log('   Mounted VaultCrawler: isCombatActive =', crawler.isCombatActive, 'Enemy =', crawler.currentEnemy.name);

// Simulate spin win
const initialEnemyHp = crawler.currentEnemy.hp;
crawler.handleSpinResult(250, ['crown', 'crown', 'seven']);
console.log(`   After 250 win spin: Enemy HP ${initialEnemyHp} -> ${crawler.currentEnemy.hp}`);

if (crawler.currentEnemy.hp >= initialEnemyHp) {
  throw new Error('Vault Crawler damage not applied to enemy!');
}

// 2. Test Battle Royale
const royale = new window.SlotBattleRoyale(mockWallet, mockLobby);
console.log('2. Instantiated SlotBattleRoyale');

royale.mount();
console.log('   Mounted SlotBattleRoyale: timeLeft =', royale.timeLeft, 'competitors =', royale.competitors.length);

// Simulate spin win in Royale
royale.handleSpinResult(400, ['wild', 'diamond', 'scatter']);
console.log('   After 400 win spin: Player score =', royale.playerScore, 'Attacks deck:', royale.attacks);

if (royale.playerScore !== 1000) {
  throw new Error(`Battle Royale player score expected 1000 but got ${royale.playerScore}`);
}

// Test PvP attack execution
if (royale.attacks.freeze) {
  royale.executeAttack('freeze');
  console.log('   Executed PvP Freeze attack successfully.');
}

// Clean up
crawler.unmount();
royale.unmount();
console.log('✅ All Vault Crawler and Battle Royale unit & flow tests PASSED successfully!');
