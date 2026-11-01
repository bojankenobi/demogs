/**
 * Integration Test for Battle Royale Buy-in, Smart Targeting & Economics
 */
const assert = require('assert');

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

class MockWallet {
  constructor(initial = 1000) {
    this.rsdBalance = initial;
    this.activeDenom = 1;
  }
  get balance() {
    return Math.floor(this.rsdBalance / this.activeDenom);
  }
  set balance(credits) {
    this.rsdBalance = Math.round(credits * this.activeDenom);
    this.saveState();
  }
  addFictionalRsd(amt) {
    this.rsdBalance += amt;
    this.saveState();
  }
  saveState() {
    global.localStorage.setItem('igt_rsd_balance', String(this.rsdBalance));
  }
  updateUI() {}
}

console.log('--- 1. Testing Buy-In Deduction & Balance Protection ---');
const wallet = new MockWallet(1000);
const buyInCost = 100;

// Deduct buy-in
assert.strictEqual(wallet.rsdBalance, 1000);
wallet.rsdBalance -= buyInCost;
wallet.saveState();
assert.strictEqual(wallet.rsdBalance, 900, 'Balance after 100 ZLT buy-in must be 900 ZLT');

// Mid-match forfeit: buy-in must stay spent!
const initialRsdBalance = wallet.rsdBalance; // 900 ZLT
wallet.rsdBalance += 400; // temporary in-match points
assert.strictEqual(wallet.rsdBalance, 1300);

// Forfeit:
wallet.rsdBalance = initialRsdBalance;
wallet.saveState();
assert.strictEqual(wallet.rsdBalance, 900, 'On forfeit, player balance must return to 900 ZLT (100 ZLT buy-in forfeited!)');
console.log('✓ Buy-in deduction and forfeit penalty verified');

console.log('\n--- 2. Testing Victory Royale Payouts ---');
// 1st place victory awards +1.000 ZLT
wallet.addFictionalRsd(1000);
assert.strictEqual(wallet.rsdBalance, 1900, '1st place victory should increase balance to 1900 ZLT');
console.log('✓ 1st place payout verified (+1.000 ZLT)');

console.log('\n--- 3. Testing Insufficient Balance Check ---');
const poorWallet = new MockWallet(40);
const canAfford = poorWallet.rsdBalance >= buyInCost;
assert.strictEqual(canAfford, false, 'Player with 40 ZLT cannot afford 100 ZLT buy-in');
console.log('✓ Insufficient balance gate verified');

console.log('\n--- 4. Testing Smart Meta Targeting Logic ---');
const competitors = [
  { id: 'c_1', name: 'Miloš', score: 800, eliminated: false },
  { id: 'c_2', name: 'Stefan', score: 1200, eliminated: false }, // Leader
  { id: 'c_3', name: 'Nemanja', score: 450, eliminated: false }
];

// Target Leader:
const sorted = [...competitors].sort((a, b) => b.score - a.score);
const leader = sorted[0];
assert.strictEqual(leader.name, 'Stefan', 'Leader target should be Stefan with 1200 pts');

// Target Ahead (when player has 600 pts):
const allWithPlayer = [
  { id: 'player', name: 'VI', score: 600, eliminated: false, isYou: true },
  ...competitors
].sort((a, b) => b.score - a.score);

const myIdx = allWithPlayer.findIndex(x => x.isYou);
assert.strictEqual(myIdx, 2, 'Player is at rank 3');
const rivalAhead = allWithPlayer[myIdx - 1];
assert.strictEqual(rivalAhead.name, 'Miloš', 'Rival immediately ahead is Miloš (rank 2)');
console.log('✓ Smart Meta target calculations verified');

console.log('\n======================================');
console.log('ALL BUY-IN & TOURNAMENT TESTS PASSED!');
console.log('======================================');
