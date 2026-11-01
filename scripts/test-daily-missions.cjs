/**
 * Verification test for Casino Daily Missions & 7-Day Streak Retention System
 */

const assert = require('assert');
const fs = require('fs');

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
}

global.localStorage = new MockStorage();

class MockWallet {
  constructor(initial = 1000) {
    this.balance = initial;
  }
  addFictionalRsd(amt) {
    this.balance += amt;
  }
}

global.window = {
  wallet: new MockWallet(1000),
  DailyMissionsManager: null,
  igtApp: {
    wallet: new MockWallet(1000),
    showMessage: () => {},
    openVoucherModal: () => {}
  }
};

global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
};

// Load DailyMissionsManager code
const code = fs.readFileSync('js/core/daily-missions-manager.js', 'utf8');
eval(code);

const DailyMissionsManager = global.window.DailyMissionsManager;
assert.ok(DailyMissionsManager, 'DailyMissionsManager class must be defined');

console.log('--- TEST 1: Initialization & Defaults ---');
const dmm = new DailyMissionsManager();
assert.ok(dmm.state, 'State should be initialized');
assert.strictEqual(dmm.state.streak, 1, 'Initial streak must be 1');
assert.strictEqual(dmm.state.missions.length, 3, 'Must have exactly 3 daily missions');

const slotTask = dmm.state.missions.find(m => m.id === 'task_slot');
const arcadeTask = dmm.state.missions.find(m => m.id === 'task_arcade');
const tableTask = dmm.state.missions.find(m => m.id === 'task_table');

assert.ok(slotTask, 'Slot task must exist');
assert.strictEqual(slotTask.target, 15, 'Slot task target is 15');
assert.strictEqual(slotTask.reward, 20, 'Slot task reward is 20 ZLT');

assert.ok(arcadeTask, 'Arcade task must exist');
assert.strictEqual(arcadeTask.target, 1, 'Arcade task target is 1');
assert.strictEqual(arcadeTask.reward, 25, 'Arcade task reward is 25 ZLT');

assert.ok(tableTask, 'Table task must exist');
assert.strictEqual(tableTask.target, 5, 'Table task target is 5');
assert.strictEqual(tableTask.reward, 25, 'Table task reward is 25 ZLT');
console.log('✓ Initialization & Defaults passed');

console.log('--- TEST 2: Action Tracking & Completion ---');
// 1. Slot Spins
for (let i = 0; i < 14; i++) {
  dmm.recordSlotSpin();
}
assert.strictEqual(slotTask.current, 14, 'Slot task should have 14 spins');
assert.strictEqual(slotTask.completed, false, 'Should not be completed at 14/15');

dmm.recordSlotSpin(); // 15th spin
assert.strictEqual(slotTask.current, 15);
assert.strictEqual(slotTask.completed, true, 'Should be completed at 15/15');

// 2. Arcade Wins
dmm.recordArcadeWin(1.5); // < 2.0x -> should NOT advance
assert.strictEqual(arcadeTask.current, 0, 'Multiplier under 2.0x must not count');

dmm.recordArcadeWin(2.4); // >= 2.0x -> should advance
assert.strictEqual(arcadeTask.current, 1);
assert.strictEqual(arcadeTask.completed, true, 'Arcade task should complete on >=2.0x');

// 3. Table Actions
for (let i = 0; i < 5; i++) {
  dmm.recordTableAction();
}
assert.strictEqual(tableTask.current, 5);
assert.strictEqual(tableTask.completed, true, 'Table task should be completed at 5/5');
console.log('✓ Action Tracking & Completion passed');

console.log('--- TEST 3: Claiming Missions Rewards ---');
const startBalance = global.window.wallet.balance; // 1000
dmm.claimMission('task_slot'); // +20 ZLT
assert.strictEqual(global.window.wallet.balance, startBalance + 20);
assert.strictEqual(slotTask.claimed, true, 'Task must be marked claimed');

// Attempt double claim:
dmm.claimMission('task_slot');
assert.strictEqual(global.window.wallet.balance, startBalance + 20, 'Double claim must not award extra credits');

dmm.claimMission('task_arcade'); // +25 ZLT
assert.strictEqual(global.window.wallet.balance, startBalance + 20 + 25);
console.log('✓ Claiming Missions Rewards passed');

console.log('--- TEST 4: Daily Streak Claims & Day 7 Mystery Reward ---');
assert.strictEqual(dmm.canClaimStreakToday(), true, 'Player should be able to claim Day 1 streak');
const balBeforeStreak = global.window.wallet.balance;
dmm.claimDailyStreak(); // Day 1 = +15 ZLT
assert.strictEqual(global.window.wallet.balance, balBeforeStreak + 15);
assert.strictEqual(dmm.canClaimStreakToday(), false, 'Cannot claim twice on the same day');

// Test Day 7 Grand Reward Trigger
let voucherModalTriggered = false;
global.window.igtApp.openVoucherModal = (payload) => {
  voucherModalTriggered = true;
  assert.strictEqual(payload.rewardType, 'voucher_drink');
};

dmm.state.streak = 7;
dmm.state.lastClaimDate = '2026-10-31'; // set to yesterday
assert.strictEqual(dmm.canClaimStreakToday(), true);

const balBeforeDay7 = global.window.wallet.balance;
dmm.claimDailyStreak(); // Day 7 = +150 ZLT
assert.strictEqual(global.window.wallet.balance, balBeforeDay7 + 150);
console.log('✓ Daily Streak Claims & Day 7 passed');

console.log('--- TEST 5: Streak Continuity & Missed Day Reset ---');
// If player claimed yesterday, streak progresses:
dmm.state.streak = 3;
dmm.state.lastClaimDate = dmm.getYesterdayString();
dmm.state.todayDate = '2026-01-01'; // simulate old date in storage
dmm.saveState();
dmm.initState();
assert.strictEqual(dmm.state.streak, 4, 'Streak should advance from 3 to 4 if claimed yesterday');

// If player missed a day (last claim was 3 days ago):
dmm.state.streak = 5;
dmm.state.lastClaimDate = '2026-10-25'; // far in the past
dmm.state.todayDate = '2026-01-01';
dmm.saveState();
dmm.initState();
assert.strictEqual(dmm.state.streak, 1, 'Missed day must reset streak back to Day 1');
console.log('✓ Streak Continuity & Missed Day Reset passed');

console.log('\n========================================');
console.log('🎉 ALL DAILY MISSIONS & STREAK TESTS PASSED!');
console.log('========================================');
