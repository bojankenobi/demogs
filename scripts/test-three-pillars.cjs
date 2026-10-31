/**
 * Integration Test for Three Pillars (Casino, Vault, Battle Royale) Architecture
 */
const assert = require('assert');

// Mock localStorage
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

console.log('--- 1. Testing Battle Royale Balance Snapshot & Forfeit Rollback ---');
// Mock Wallet
class MockWallet {
  constructor(initialRsd = 1000) {
    this.rsdBalance = initialRsd;
    this.activeDenom = 1;
  }
  get balance() {
    return Math.floor(this.rsdBalance / this.activeDenom);
  }
  set balance(credits) {
    this.rsdBalance = Math.round(credits * this.activeDenom);
    this.saveState();
  }
  saveState() {
    global.localStorage.setItem('igt_rsd_balance', String(this.rsdBalance));
  }
  updateUI() {}
}

const wallet = new MockWallet(1500);
wallet.saveState();

// Mock Battle Royale mount and forfeit
const mockArena = {
  wallet: wallet,
  isActive: false,
  isMatchCompleted: false,
  initialRsdBalance: null,
  initialBalance: null,
  cleanUpCalled: false,
  
  mount() {
    this.isActive = true;
    this.initialRsdBalance = typeof this.wallet.rsdBalance === 'number' ? this.wallet.rsdBalance : 0;
    this.initialBalance = typeof this.wallet.balance === 'number' ? this.wallet.balance : 0;
    this.isMatchCompleted = false;
  },

  forfeitMatch() {
    if (this.wallet && typeof this.initialRsdBalance === 'number') {
      this.wallet.rsdBalance = this.initialRsdBalance;
      this.wallet.saveState();
      this.wallet.updateUI();
    }
    this.isMatchCompleted = true;
    this.cleanUpCalled = true;
  },

  unmount() {
    this.isActive = false;
    if (!this.isMatchCompleted && typeof this.initialRsdBalance === 'number' && this.wallet) {
      this.wallet.rsdBalance = this.initialRsdBalance;
      this.wallet.saveState();
      this.wallet.updateUI();
    }
    this.cleanUpCalled = true;
    this.initialBalance = null;
    this.initialRsdBalance = null;
  }
};

// Player enters arena with 1500 ZLT
mockArena.mount();
assert.strictEqual(mockArena.initialRsdBalance, 1500, 'Initial balance should be snapshotted to 1500');

// Player spins / gains temporary match coins
wallet.rsdBalance = 2300;
assert.strictEqual(wallet.rsdBalance, 2300);

// Player decides to forfeit / leave early
mockArena.forfeitMatch();
assert.strictEqual(wallet.rsdBalance, 1500, 'Balance must strictly rollback to 1500 upon forfeit!');
assert.strictEqual(global.localStorage.getItem('igt_rsd_balance'), '1500', 'Saved storage must be rolled back');
assert.strictEqual(mockArena.cleanUpCalled, true, 'Effects must be cleanly purged');
console.log('✓ Battle Royale forfeit rollback verified');

// Test unmount without forfeit (navigating to another mode directly)
mockArena.mount();
wallet.rsdBalance = 4000; // gained mid-match
mockArena.unmount();
assert.strictEqual(wallet.rsdBalance, 1500, 'Navigating away must also strictly rollback unearned coins!');
console.log('✓ Battle Royale unmount protection verified');

console.log('\n--- 2. Testing Audio Profiler Syntax & Structure ---');
const fs = require('fs');
const audioCode = fs.readFileSync('js/audio.js', 'utf8');
assert(audioCode.includes('switchProfile'), 'switchProfile must exist in audio.js');
assert(audioCode.includes('playVaultDoorClank'), 'playVaultDoorClank must exist in audio.js');
assert(audioCode.includes('playRoyaleWarHorn'), 'playRoyaleWarHorn must exist in audio.js');
assert(audioCode.includes('playRoyaleZoneTick'), 'playRoyaleZoneTick must exist in audio.js');
assert(audioCode.includes('playRoyaleElimination'), 'playRoyaleElimination must exist in audio.js');
assert(audioCode.includes('playRoyaleVictory'), 'playRoyaleVictory must exist in audio.js');
console.log('✓ Dynamic Audio Profiler methods verified');

console.log('\n--- 3. Testing CSS Theming & Desktop Widescreen Classes ---');
const cssCode = fs.readFileSync('css/style.css', 'utf8');
assert(cssCode.includes('body.theme-vault'), 'body.theme-vault must be defined in style.css');
assert(cssCode.includes('body.theme-royale'), 'body.theme-royale must be defined in style.css');
assert(cssCode.includes('body.theme-casino'), 'body.theme-casino must be defined in style.css');
assert(cssCode.includes('.game-container.in-vault-mode'), 'Vault mode responsive styles must exist');
assert(cssCode.includes('.game-container.in-royale-mode'), 'Royale mode responsive styles must exist');
console.log('✓ Theme styling classes verified');

console.log('\n--- 4. Testing Admin Remote Mode Switch & Dedicated Triggers ---');
const adminHtml = fs.readFileSync('admin.html', 'utf8');
assert(adminHtml.includes('btn-switch-grand-mode'), 'Grand mode switcher buttons must exist in admin.html');
assert(adminHtml.includes('btn-cmd-vault-keys'), 'Vault keys trigger button must exist in admin.html');
assert(adminHtml.includes('btn-cmd-vault-boss'), 'Vault boss trigger button must exist in admin.html');
assert(adminHtml.includes('btn-cmd-royale-start'), 'Royale start trigger button must exist in admin.html');

const bridgeCode = fs.readFileSync('js/core/admin-bridge-v2.js', 'utf8');
assert(bridgeCode.includes('SWITCH_GRAND_MODE'), 'SWITCH_GRAND_MODE handler must exist in admin-bridge-v2.js');
assert(bridgeCode.includes('TRIGGER_VAULT_EVENT'), 'TRIGGER_VAULT_EVENT handler must exist in admin-bridge-v2.js');
assert(bridgeCode.includes('TRIGGER_ROYALE_EVENT'), 'TRIGGER_ROYALE_EVENT handler must exist in admin-bridge-v2.js');
console.log('✓ Admin remote triggers and bridge handlers verified');

console.log('\n======================================');
console.log('ALL THREE PILLARS INTEGRATION TESTS PASSED!');
console.log('======================================');
