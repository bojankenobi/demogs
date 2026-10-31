/**
 * Integration Test for DailyAccessManager & Operator Limits
 */
const assert = require('assert');

// Mock localStorage for Node.js
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
  get length() {
    return Object.keys(this.store).length;
  }
  key(index) {
    return Object.keys(this.store)[index] || null;
  }
}

global.localStorage = new MockStorage();
global.window = {
  innerWidth: 1920,
  DailyAccessManager: null
};

// Load DailyAccessManager
const fs = require('fs');
const code = fs.readFileSync('js/core/daily-access-manager.js', 'utf8');
eval(code);

const DailyAccessManager = global.window.DailyAccessManager;
assert(DailyAccessManager, 'DailyAccessManager should be loaded');

console.log('--- 1. Testing Default Operator Limits ---');
const dam = new DailyAccessManager();
let limits = dam.getLimits();
assert.strictEqual(limits.vaultDailyLimit, 2, 'Default vault limit should be 2');
assert.strictEqual(limits.royaleDailyLimit, 1, 'Default royale limit should be 1');
assert.strictEqual(limits.dailyLoginGrantZlt, 100, 'Default daily login grant should be 100');
console.log('✓ Default limits verified: Vault=2, Royale=1, Grant=100');

console.log('--- 2. Testing Daily Grant (100 ZLT) ---');
const p1 = 'player_marko_1';
let grant1 = dam.checkAndClaimDailyGrant(p1, 'Marko');
assert.strictEqual(grant1.awarded, true, 'First daily grant should be awarded');
assert.strictEqual(grant1.amount, 100, 'Grant amount should be 100 ZLT');
assert.strictEqual(dam.hasClaimedDailyGrant(p1), true, 'hasClaimedDailyGrant should return true');

// Second attempt today should not be awarded
let grant2 = dam.checkAndClaimDailyGrant(p1, 'Marko');
assert.strictEqual(grant2.awarded, false, 'Second grant today should be rejected');
console.log('✓ Daily grant awarded once per day (+100 ZLT) verified');

console.log('--- 3. Testing Login Audit Trail ---');
const initialLogins = dam.getTodayLoginsCount();
dam.recordLoginAudit({
  playerId: 'player_test_2',
  playerName: 'Jovan',
  bonusAwarded: 100,
  isNewLogin: true
});
assert.strictEqual(dam.getTodayLoginsCount(), initialLogins + 1, 'Today logins count should increment by 1');
const logs = dam.getLoginAuditTrail();
assert.strictEqual(logs[0].playerId, 'player_test_2');
assert.strictEqual(logs[0].bonusAwarded, 100);
console.log('✓ Login audit trail verified');

console.log('--- 4. Testing Trezor Daily Limits (Default 2) ---');
// 1st entry
let check1 = dam.canEnterMode(p1, 'vault');
assert.strictEqual(check1.allowed, true, 'Entry 1 should be allowed');
dam.recordEntry(p1, 'vault');
assert.strictEqual(dam.getUsage(p1, 'vault'), 1);
assert.strictEqual(dam.getRemaining(p1, 'vault'), 1);

// 2nd entry
let check2 = dam.canEnterMode(p1, 'vault');
assert.strictEqual(check2.allowed, true, 'Entry 2 should be allowed');
dam.recordEntry(p1, 'vault');
assert.strictEqual(dam.getUsage(p1, 'vault'), 2);
assert.strictEqual(dam.getRemaining(p1, 'vault'), 0);

// 3rd entry (Quota exhausted!)
let check3 = dam.canEnterMode(p1, 'vault');
assert.strictEqual(check3.allowed, false, 'Entry 3 should be blocked!');
assert(check3.reason.includes('iskorišćena'), 'Reason should explain quota exhaustion');
assert(check3.resetInMs > 0, 'Reset timer ms should be > 0');
console.log('✓ Trezor 2/2 limit enforcement verified');

console.log('--- 5. Testing Battle Royale Daily Limits (Default 1) ---');
// 1st entry
let rCheck1 = dam.canEnterMode(p1, 'royale');
assert.strictEqual(rCheck1.allowed, true, 'Royale entry 1 should be allowed');
dam.recordEntry(p1, 'royale');
assert.strictEqual(dam.getUsage(p1, 'royale'), 1);
assert.strictEqual(dam.getRemaining(p1, 'royale'), 0);

// 2nd entry (Quota exhausted!)
let rCheck2 = dam.canEnterMode(p1, 'royale');
assert.strictEqual(rCheck2.allowed, false, 'Royale entry 2 should be blocked!');
console.log('✓ Battle Royale 1/1 limit enforcement verified');

console.log('--- 6. Testing Operator Reset Single Player Limits ---');
dam.resetPlayerLimits(p1);
assert.strictEqual(dam.getUsage(p1, 'vault'), 0, 'Vault usage should reset to 0');
assert.strictEqual(dam.getUsage(p1, 'royale'), 0, 'Royale usage should reset to 0');
assert.strictEqual(dam.canEnterMode(p1, 'vault').allowed, true, 'Vault should be accessible again');
assert.strictEqual(dam.canEnterMode(p1, 'royale').allowed, true, 'Royale should be accessible again');
console.log('✓ Operator reset player limits verified');

console.log('--- 7. Testing Operator Custom Limits ---');
dam.setLimits({
  vaultDailyLimit: 5,
  royaleDailyLimit: 3,
  dailyLoginGrantZlt: 250
});
assert.strictEqual(dam.getLimit('vault'), 5, 'Vault limit should be updated to 5');
assert.strictEqual(dam.getLimit('royale'), 3, 'Royale limit should be updated to 3');
assert.strictEqual(dam.getLimits().dailyLoginGrantZlt, 250, 'Daily grant should be updated to 250');
console.log('✓ Operator custom limit modification verified');

console.log('--- 8. Testing Reset All Player Limits ---');
dam.recordEntry(p1, 'vault');
dam.recordEntry(p1, 'vault');
assert.strictEqual(dam.getUsage(p1, 'vault'), 2);
dam.resetAllPlayerLimits();
assert.strictEqual(dam.getUsage(p1, 'vault'), 0, 'Vault usage after reset all should be 0');
console.log('✓ Reset all player limits verified');

console.log('\n======================================');
console.log('ALL ACCESS CONTROL & AUDIT TESTS PASSED!');
console.log('======================================');
