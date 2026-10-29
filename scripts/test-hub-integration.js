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
    getBoundingClientRect() { return { width: 480, height: 260 }; },
    getContext(type) {
      if (type === '2d') {
        return {
          clearRect() {},
          fillRect() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          stroke() {},
          arc() {},
          fill() {},
          ellipse() {},
          closePath() {},
          save() {},
          restore() {},
          translate() {},
          scale() {},
          rotate() {},
          createLinearGradient() { return { addColorStop() {} }; },
          createRadialGradient() { return { addColorStop() {} }; },
          roundRect() {},
          fillText() {},
          setTransform() {}
        };
      }
      return null;
    },
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

global.window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
global.window.cancelAnimationFrame = (id) => clearTimeout(id);
global.window.addEventListener = () => {};
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.cancelAnimationFrame = global.window.cancelAnimationFrame;

global.window.slotAudio = {
  playClick() {},
  playWin() {},
  playBigWin() {},
  playLever() {},
  playCashout() {},
  playMineExplode() {}
};

// Load classes via vm
const vaultCode = fs.readFileSync(path.join(__dirname, '../js/games/vault-crawler/vault-crawler.js'), 'utf-8');
const royaleCode = fs.readFileSync(path.join(__dirname, '../js/games/battle-royale/battle-royale.js'), 'utf-8');
const crashCode = fs.readFileSync(path.join(__dirname, '../js/games/crash/crash.js'), 'utf-8');
const plinkoCode = fs.readFileSync(path.join(__dirname, '../js/games/plinko/plinko.js'), 'utf-8');

vm.runInThisContext(vaultCode);
vm.runInThisContext(royaleCode);
vm.runInThisContext(crashCode);
vm.runInThisContext(plinkoCode);

console.log('✅ Loaded VaultCrawler, SlotBattleRoyale, GrandCrashGame, and PlinkoDeluxeGame classes into execution context.');

// Mock wallet & lobby
const mockWallet = {
  balance: 5000,
  bet: 20,
  addCredits(amt) { this.balance += amt; },
  deductBet(amt) {
    if (this.balance < amt) return false;
    this.balance -= amt;
    return true;
  },
  addWin(amt) { this.balance += amt; }
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

// 1.1 Test Visual Tower Progression & Floating FX
crawler.renderTowerFloors();
const heistPctEl = global.document.getElementById('vault-heist-pct');
console.log('   Tower floors rendered. Current heist progress:', heistPctEl.textContent);

crawler.spawnFloatingNumber(120, 'dmg');
const fxOverlay = global.document.getElementById('vault-fx-overlay');
console.log('   Spawned floating combat damage number. Overlay children count:', fxOverlay.children.length);

// 1.2 Test Vault Raider Leaderboard Modal
crawler.openLeaderboardModal();
const lbModal = global.document.getElementById('vault-leaderboard-modal');
if (!lbModal.classList.contains('active')) {
  throw new Error('Vault Leaderboard modal did not open!');
}
const sortedRaiders = crawler.getSortedLeaderboard();
console.log(`   Vault Leaderboard sorted: ${sortedRaiders.length} entries. Top player: ${sortedRaiders[0].name} (Rank #${sortedRaiders[0].rank})`);
crawler.closeLeaderboardModal();

// 1.3 Test Vault Talent Tree Modal & Upgrade
crawler.vaultKeys = 10;
crawler.openTalentsModal();
const talentsModal = global.document.getElementById('vault-talents-modal');
if (!talentsModal.classList.contains('active')) {
  throw new Error('Vault Talents modal did not open!');
}
const prevWildLuck = crawler.talents.wildLuck;
const upgraded = crawler.upgradeTalent('wildLuck');
console.log(`   Talent upgrade test: wildLuck ${prevWildLuck} -> ${crawler.talents.wildLuck}, remaining keys = ${crawler.vaultKeys}`);
if (!upgraded || crawler.talents.wildLuck !== prevWildLuck + 1) {
  throw new Error('Talent upgrade failed to increment level!');
}
crawler.closeTalentsModal();

// 1.4 Test Room Clearance / Victory Modal Flow
crawler.openVictoryModal(2, 1, 500);
const victoryModal = global.document.getElementById('vault-victory-modal');
if (!victoryModal.classList.contains('active')) {
  throw new Error('Vault Victory modal did not open!');
}
console.log('   Vault Victory modal opened with loot.');
crawler.onVictoryContinue();
if (victoryModal.classList.contains('active')) {
  throw new Error('Vault Victory modal did not close on continue!');
}
console.log('   Vault Victory continue succeeded. Node advanced to:', crawler.nodeIndex);

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

// 3. Test Grand Crash (Aviator)
console.log('3. Instantiating GrandCrashGame...');
const crash = new window.GrandCrashGame(mockWallet, null);
crash.mount();
console.log('   Mounted GrandCrashGame: state =', crash.gameState, 'bet =', crash.currentBet);

// Place a bet during waiting phase
const balBeforeBet = mockWallet.balance;
crash.handleMainAction();
if (!crash.hasActiveBet || mockWallet.balance !== balBeforeBet - crash.currentBet) {
  throw new Error(`Crash bet placement failed! Active: ${crash.hasActiveBet}, Balance: ${mockWallet.balance}`);
}
console.log('   Bet placed successfully. Active bet =', crash.hasActiveBet, 'Balance:', mockWallet.balance);

// Launch flight
crash.launchFlight();
if (crash.gameState !== 'flying') {
  throw new Error(`Crash flight launch failed! State: ${crash.gameState}`);
}
console.log('   Flight launched. Target crash point =', crash.targetCrashPoint, 'x');

// Simulate multiplier growth & manual cashout
crash.currentMultiplier = 2.50;
const balBeforeCashout = mockWallet.balance;
crash.cashout();
const expectedWin = Math.round(crash.currentBet * 2.50);
if (!crash.hasCashedOut || mockWallet.balance !== balBeforeCashout + expectedWin) {
  throw new Error(`Crash cashout failed! HasCashedOut: ${crash.hasCashedOut}, Balance: ${mockWallet.balance}`);
}
console.log(`   Cashed out at 2.50x. Win: +${expectedWin} ZLT, New Balance: ${mockWallet.balance}`);

// Simulate crash
crash.handleCrash();
if (crash.gameState !== 'crashed') {
  throw new Error(`Crash handling failed! State: ${crash.gameState}`);
}
console.log('   Handled crash event. History count:', crash.history.length, 'Latest:', crash.history[0]);

// Verify multiplayer state
if (!crash.roundPlayers || crash.roundPlayers.length === 0) {
  throw new Error('Multiplayer round players not generated!');
}
const you = crash.roundPlayers.find(p => p.isYou);
if (!you || you.state !== 'won') {
  throw new Error('Multiplayer player state tracking failed!');
}
console.log(`   Multiplayer active round players: ${crash.roundPlayers.length}, You state: ${you.state}`);

crash.unmount();
console.log('   Unmounted GrandCrashGame.');

// 4. Test Plinko Deluxe
console.log('4. Instantiating PlinkoDeluxeGame...');
const plinko = new window.PlinkoDeluxeGame(mockWallet, null);
plinko.mount();
console.log('   Mounted PlinkoDeluxeGame: rows =', plinko.rows, 'risk =', plinko.risk, 'bins =', plinko.bins.length);

if (plinko.rows !== 12 || plinko.bins.length !== 13) {
  throw new Error(`Plinko initial layout failed! Rows: ${plinko.rows}, Bins: ${plinko.bins.length}`);
}

// Test dropping a ball
const balBeforeDrop = mockWallet.balance;
const dropSuccess = plinko.dropBall();
if (!dropSuccess || plinko.balls.length !== 1 || mockWallet.balance !== balBeforeDrop - plinko.currentBet) {
  throw new Error(`Plinko dropBall failed! Drop: ${dropSuccess}, Balls: ${plinko.balls.length}, Balance: ${mockWallet.balance}`);
}
console.log('   Ball dropped successfully. Active balls =', plinko.balls.length, 'Balance:', mockWallet.balance);

// Test landing ball in bin
const testBall = plinko.balls[0];
const testBin = plinko.bins[0]; // Outermost high multiplier bin
const balBeforeLand = mockWallet.balance;
const expectedPlinkoWin = Math.round(testBall.bet * testBin.mult);
plinko.handleBallLanding(testBall, testBin);

if (mockWallet.balance !== balBeforeLand + expectedPlinkoWin || plinko.history[0] !== testBin.mult) {
  throw new Error(`Plinko bin landing failed! Balance: ${mockWallet.balance}, History top: ${plinko.history[0]}`);
}
console.log(`   Ball landed in bin (${testBin.mult}x). Win: +${expectedPlinkoWin} ZLT, History updated.`);

// Test changing pyramid rows & risk
plinko.rows = 16;
plinko.risk = 'high';
plinko.buildPyramid();

if (plinko.bins.length !== 17 || plinko.bins[0].mult !== 1000) {
  throw new Error(`Plinko 16-row high-risk layout failed! Bins: ${plinko.bins.length}, Max multiplier: ${plinko.bins[0].mult}`);
}
console.log(`   16-row High-Risk pyramid built: ${plinko.bins.length} bins, Max multiplier = ${plinko.bins[0].mult}x 💥`);

// Test 8-row pyramid
plinko.rows = 8;
plinko.risk = 'low';
plinko.buildPyramid();
if (plinko.bins.length !== 9 || plinko.bins[0].mult !== 5.6) {
  throw new Error(`Plinko 8-row low-risk layout failed! Bins: ${plinko.bins.length}, Outer: ${plinko.bins[0].mult}`);
}
console.log(`   8-row Low-Risk pyramid built: ${plinko.bins.length} bins, Outer multiplier = ${plinko.bins[0].mult}x`);

plinko.unmount();
console.log('   Unmounted PlinkoDeluxeGame.');

console.log('✅ All Vault Crawler, Battle Royale, Grand Crash, and Plinko Deluxe tests PASSED successfully!');
