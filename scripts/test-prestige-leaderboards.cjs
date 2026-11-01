/**
 * Verification test for Kuća Slavnih / Prestige Leaderboards System
 */

const assert = require('assert');
const fs = require('fs');

// Mock browser environment for Node.js
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockStorage();

global.window = {
  wallet: {
    balance: 1000,
    addFictionalRsd: function(amount) { this.balance += amount; }
  },
  PrestigeManager: null
};

global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
};

// Load PrestigeManager
const code = fs.readFileSync('js/core/prestige-manager.js', 'utf8');
eval(code);

const PrestigeManager = global.window.PrestigeManager;
assert.ok(PrestigeManager, 'PrestigeManager must be defined');

console.log('--- TEST 1: Initialization & Defaults ---');
const pm = new PrestigeManager();
assert.ok(pm.season, 'Season should be initialized');
assert.ok(pm.season.seasonName.includes('Sezona'), 'Season name should contain "Sezona"');
assert.strictEqual(pm.season.prizePool.first, 5000, 'First prize should be 5000 ZLT');
assert.strictEqual(pm.season.prizePool.second, 2500, 'Second prize should be 2500 ZLT');
assert.strictEqual(pm.season.prizePool.third, 1000, 'Third prize should be 1000 ZLT');
assert.ok(pm.boards.casino.length >= 5, 'Casino leaderboard should have default competitors');
assert.ok(pm.boards.vault.length >= 5, 'Vault leaderboard should have default competitors');
assert.ok(pm.boards.royale.length >= 5, 'Royale leaderboard should have default competitors');
console.log('✓ Initialization & Defaults passed');

console.log('--- TEST 2: Scoring Formulas ---');
const casinoScore = pm.calcCasinoScore({ highestWinX: 100, totalWagered: 5000, totalSpins: 50 });
// (100 * 10) + (5000 / 50) + (50 * 2) = 1000 + 100 + 100 = 1200
assert.strictEqual(casinoScore, 1200, `Casino score should be 1200, got ${casinoScore}`);

const vaultScore = pm.calcVaultScore({ maxFloor: 4, bossesDefeated: 2, keysCollected: 20, totalLootZlt: 3000 });
// (4 * 1000) + (2 * 500) + (20 * 25) + (3000 / 10) = 4000 + 1000 + 500 + 300 = 5800
assert.strictEqual(vaultScore, 5800, `Vault score should be 5800, got ${vaultScore}`);

const royaleScore = pm.calcRoyaleScore({ wins: 2, kills: 10, finaleTickets: 1, matchesPlayed: 5 });
// (2 * 2500) + (10 * 150) + (1 * 500) + (5 * 30) = 5000 + 1500 + 500 + 150 = 7150
assert.strictEqual(royaleScore, 7150, `Royale score should be 7150, got ${royaleScore}`);
console.log('✓ Scoring Formulas passed');

console.log('--- TEST 3: Event Hooks & Progression ---');
// Casino Spin
pm.recordCasinoSpin(200, 10000); // 50x multiplier
assert.strictEqual(pm.playerRecord.casino.totalWagered, 200);
assert.strictEqual(pm.playerRecord.casino.totalSpins, 1);
assert.strictEqual(pm.playerRecord.casino.highestWinX, 50);

// Vault Progress
pm.recordVaultProgress(3, true, 8, 800);
assert.strictEqual(pm.playerRecord.vault.maxFloor, 3);
assert.strictEqual(pm.playerRecord.vault.bossesDefeated, 1);
assert.strictEqual(pm.playerRecord.vault.keysCollected, 8);
assert.strictEqual(pm.playerRecord.vault.totalLootZlt, 800);

// Battle Royale Match
pm.recordRoyaleMatch(1, 5, true);
assert.strictEqual(pm.playerRecord.royale.wins, 1);
assert.strictEqual(pm.playerRecord.royale.kills, 5);
assert.strictEqual(pm.playerRecord.royale.finaleTickets, 1);
assert.strictEqual(pm.playerRecord.royale.matchesPlayed, 1);
console.log('✓ Event Hooks & Progression passed');

console.log('--- TEST 4: Ranking & Player Position ---');
const sortedRoyale = pm.getSortedLeaderboard('royale');
const meInRoyale = sortedRoyale.find(x => x.isYou);
assert.ok(meInRoyale, 'Player entry should exist in Royale leaderboard');
assert.ok(meInRoyale.rank >= 1, `Rank should be valid number: ${meInRoyale.rank}`);
assert.ok(sortedRoyale[0].score >= sortedRoyale[1].score, 'Leaderboard must be sorted descending by score');
console.log('✓ Ranking & Player Position passed');

console.log('--- TEST 5: Admin Prize Pool & Disqualification ---');
pm.updatePrizePool(6000, 3000, 1500);
assert.strictEqual(pm.season.prizePool.first, 6000);
assert.strictEqual(pm.season.prizePool.second, 3000);
assert.strictEqual(pm.season.prizePool.third, 1500);

const initialCount = pm.boards.casino.length;
const victimId = pm.boards.casino[0].id;
const dqSuccess = pm.disqualifyEntry('casino', victimId);
assert.strictEqual(dqSuccess, true);
assert.strictEqual(pm.boards.casino.length, initialCount - 1);
console.log('✓ Admin Prize Pool & Disqualification passed');

console.log('--- TEST 6: Season Reset & Hall of Fame Archiving ---');
const initialFameCount = pm.hallOfFame.length;
const archived = pm.executeSeasonReset(true);
assert.strictEqual(pm.hallOfFame.length, initialFameCount + 1, 'Hall of fame should receive new archived season');
assert.ok(archived.casinoChamp, 'Archive should record Casino champion');
assert.ok(archived.vaultChamp, 'Archive should record Vault champion');
assert.ok(archived.royaleChamp, 'Archive should record Royale champion');

// Seasonal reset stats check
assert.strictEqual(pm.playerRecord.casino.totalSpins, 0, 'Seasonal spins should reset to 0');
assert.strictEqual(pm.playerRecord.vault.keysCollected, 0, 'Seasonal keys should reset to 0');
assert.strictEqual(pm.playerRecord.royale.wins, 0, 'Seasonal wins should reset to 0');
console.log('✓ Season Reset & Hall of Fame Archiving passed');

console.log('\n========================================');
console.log('🎉 ALL PRESTIGE LEADERBOARD TESTS PASSED!');
console.log('========================================');
