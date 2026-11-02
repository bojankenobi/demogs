/**
 * Test Suite: Multi-Tier Progression & Loyalty System (Silver, Gold, VIP)
 * Verifies:
 * 1. Default Tier assignment (SILVER) and metadata
 * 2. XP accumulation engine (Spins, Login Streak, Missions, Trezor, Royale, Crash)
 * 3. Progression thresholds (Silver -> Gold at 2,500 XP + 5,000 ZLT; Gold -> VIP at 15,000 XP + 25,000 ZLT)
 * 4. Level-Up instant one-time bonuses (+500 ZLT for Gold, +2,000 ZLT for VIP)
 * 5. 72-Hour Grace Period (Activation, Recovery, and Expiration Demotion)
 * 6. Dynamic Tier Limits & Grants (Silver: 100/2/1, Gold: 200/3/2, VIP: 400/4/3)
 * 7. Admin Dashboard Tier Controls & Targeted Voucher Segments
 * 8. DOM Integrity in index.html, admin.html, and css/style.css
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: MULTI-TIER PROGRESSION (SILVER, GOLD, VIP) ===\n');

// 1. Check TierManager Module
console.log('--- TEST 1: TierManager Structure & Configuration ---');
const tierManagerPath = path.join(__dirname, '../js/core/tier-manager.js');
assert(fs.existsSync(tierManagerPath), 'js/core/tier-manager.js must exist');
const tierManagerContent = fs.readFileSync(tierManagerPath, 'utf8');

assert(tierManagerContent.includes('SILVER'), 'Must define SILVER tier');
assert(tierManagerContent.includes('GOLD'), 'Must define GOLD tier');
assert(tierManagerContent.includes('VIP'), 'Must define VIP tier');
assert(tierManagerContent.includes('nextXp: 2500'), 'Gold threshold must be 2500 XP');
assert(tierManagerContent.includes('nextZlt: 5000'), 'Gold wallet threshold must be 5000 ZLT');
assert(tierManagerContent.includes('levelUpBonus: 500'), 'Gold level-up bonus must be 500 ZLT');
assert(tierManagerContent.includes('nextXp: 15000'), 'VIP threshold must be 15000 XP');
assert(tierManagerContent.includes('nextZlt: 25000'), 'VIP wallet threshold must be 25000 ZLT');
assert(tierManagerContent.includes('levelUpBonus: 2000'), 'VIP level-up bonus must be 2000 ZLT');
assert(tierManagerContent.includes('72 * 3600 * 1000'), 'Grace period must be exactly 72 hours');
console.log('✓ TierManager thresholds, bonuses and 72h grace period verified');

// 2. Functional Test of Tier Progression Engine
console.log('\n--- TEST 2: Functional Progression & Grace Period Simulation ---');
// Mock global window/localStorage
global.window = {
  slotTierManager: null,
  document: {
    getElementById: () => null,
    querySelectorAll: () => []
  }
};
global.document = global.window.document;

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

// Evaluate TierManager class in node
eval(tierManagerContent);
const TierManager = global.window.TierManager;

const mockApp = {
  playerTracker: {
    profile: {
      id: 'test_player',
      username: 'Marko_Dorcol',
      vipTier: 'SILVER',
      xp: 0,
      claimedTiers: { GOLD: false, VIP: false },
      gracePeriod: { active: false, expiresAt: null, originalTier: null },
      balance_rsd: 1000,
      isLoggedIn: true
    },
    saveProfile: function() {
      storage['gsc_player_profile'] = JSON.stringify(this.profile);
    }
  },
  wallet: {
    rsdBalance: 1000,
    addFictionalRsd: function(amount) {
      this.rsdBalance += amount;
      mockApp.playerTracker.profile.balance_rsd = this.rsdBalance;
      return amount;
    }
  },
  showMessage: () => {},
  updateModeQuotaPills: () => {}
};

const tm = new TierManager(mockApp);
tm.init(mockApp);

// Step A: Initial state is SILVER
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'SILVER', 'Initial tier must be SILVER');
const silverLimits = tm.getEffectiveLimits('SILVER');
assert.strictEqual(silverLimits.dailyGrant, 100, 'Silver daily grant = 100');
assert.strictEqual(silverLimits.vaultLimit, 2, 'Silver vault limit = 2');
assert.strictEqual(silverLimits.royaleLimit, 1, 'Silver royale limit = 1');
console.log('✓ Initial SILVER status and limits verified (100 ZLT, 2 Vault, 1 Royale)');

// Step B: Add XP below threshold -> stays Silver
tm.addXP(1500, 'Test spins');
assert.strictEqual(mockApp.playerTracker.profile.xp, 1500, 'Player accumulated 1500 XP');
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'SILVER', 'Should remain SILVER with 1500 XP');

// Step C: Player reaches 2,500 XP but balance is only 1,000 ZLT -> Still SILVER
tm.addXP(1200, 'Missions');
assert.strictEqual(mockApp.playerTracker.profile.xp, 2700, 'Player has 2700 XP');
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'SILVER', 'Should remain SILVER if wallet balance < 5000 ZLT');
console.log('✓ Wallet balance gating verified (XP met, but ZLT missing keeps tier at SILVER)');

// Step D: Player wins and wallet reaches 5,500 ZLT -> Promoted to GOLD with +500 ZLT bonus!
mockApp.wallet.rsdBalance = 5500;
mockApp.playerTracker.profile.balance_rsd = 5500;
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'GOLD', 'Should be promoted to GOLD!');
assert.strictEqual(mockApp.playerTracker.profile.claimedTiers.GOLD, true, 'Gold bonus claimed flag set');
assert.strictEqual(mockApp.wallet.rsdBalance, 6000, 'Awarded +500 ZLT level-up bonus (5500 + 500 = 6000)');
const goldLimits = tm.getEffectiveLimits('GOLD');
assert.strictEqual(goldLimits.dailyGrant, 200, 'Gold daily grant = 200');
assert.strictEqual(goldLimits.vaultLimit, 3, 'Gold vault limit = 3 (+1)');
assert.strictEqual(goldLimits.royaleLimit, 2, 'Gold royale limit = 2 (+1)');
console.log('✓ Promotion to GOLD with +500 ZLT bonus & upgraded limits verified (200 ZLT, 3 Vault, 2 Royale)');

// Step E: Player balance drops below 5,000 ZLT -> Grace Period of 72 hours activated!
mockApp.wallet.rsdBalance = 3200;
mockApp.playerTracker.profile.balance_rsd = 3200;
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'GOLD', 'Tier remains GOLD during grace period');
assert.strictEqual(mockApp.playerTracker.profile.gracePeriod.active, true, 'Grace period must be active');
assert(mockApp.playerTracker.profile.gracePeriod.expiresAt > Date.now() + 70 * 3600 * 1000, 'Expires in ~72 hours');
console.log('✓ Grace period activation verified (72h timer, tier retained)');

// Step F: Player recovers balance to 5,200 ZLT -> Grace Period cleared, status safe!
mockApp.wallet.rsdBalance = 5200;
mockApp.playerTracker.profile.balance_rsd = 5200;
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.gracePeriod.active, false, 'Grace period safely cleared');
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'GOLD', 'Tier remains GOLD');
console.log('✓ Grace period recovery verified (balance restored clears timer)');

// Step G: Test Grace Period Expiration Demotion
mockApp.wallet.rsdBalance = 2500;
mockApp.playerTracker.profile.balance_rsd = 2500;
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.gracePeriod.active, true, 'Grace period active again');
// Simulate 72 hours passing:
mockApp.playerTracker.profile.gracePeriod.expiresAt = Date.now() - 1000;
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'SILVER', 'Should be demoted to SILVER after grace period expires');
assert.strictEqual(mockApp.playerTracker.profile.gracePeriod.active, false, 'Grace period reset after demotion');
console.log('✓ Grace period expiration demotion (GOLD -> SILVER) verified');

// Step H: High roller jump to VIP (15,000 XP + 26,000 ZLT)
tm.addXP(13000, 'Mega jackpot run'); // 2700 + 13000 = 15700 XP
mockApp.wallet.rsdBalance = 26000;
mockApp.playerTracker.profile.balance_rsd = 26000;
tm.checkTierProgression();
assert.strictEqual(mockApp.playerTracker.profile.vipTier, 'VIP', 'Should be promoted to VIP!');
assert.strictEqual(mockApp.playerTracker.profile.claimedTiers.VIP, true, 'VIP bonus claimed flag set');
assert.strictEqual(mockApp.wallet.rsdBalance, 28000, 'Awarded +2000 ZLT level-up bonus (26000 + 2000 = 28000)');
const vipLimits = tm.getEffectiveLimits('VIP');
assert.strictEqual(vipLimits.dailyGrant, 400, 'VIP daily grant = 400');
assert.strictEqual(vipLimits.vaultLimit, 4, 'VIP vault limit = 4 (+2)');
assert.strictEqual(vipLimits.royaleLimit, 3, 'VIP royale limit = 3 (+2)');
console.log('✓ Direct promotion to VIP with +2,000 ZLT bonus & elite limits verified (400 ZLT, 4 Vault, 3 Royale)');

// 3. Inspect Daily Access Manager Integration
console.log('\n--- TEST 3: DailyAccessManager Dynamic Tier Quotas & Grants ---');
const damPath = path.join(__dirname, '../js/core/daily-access-manager.js');
const damContent = fs.readFileSync(damPath, 'utf8');
assert(damContent.includes('getPlayerTier'), 'DailyAccessManager must implement getPlayerTier');
assert(damContent.includes('getEffectiveLimits'), 'DailyAccessManager must utilize getEffectiveLimits');
assert(damContent.includes('dailyGrant_silver') || damContent.includes('dailyGrant'), 'DailyAccessManager handles tier grants');
console.log('✓ DailyAccessManager dynamic tier resolution verified');

// 4. Inspect Daily Missions Manager & Gameplay Hooks
console.log('\n--- TEST 4: Gameplay & Retention XP Hooks ---');
const dmmPath = path.join(__dirname, '../js/core/daily-missions-manager.js');
const dmmContent = fs.readFileSync(dmmPath, 'utf8');
assert(dmmContent.includes('streakXpTable'), 'DailyMissionsManager must award streak XP');
assert(dmmContent.includes('addXP'), 'DailyMissionsManager must award mission XP');

const vaultPath = path.join(__dirname, '../js/games/vault-crawler/vault-crawler.js');
const vaultContent = fs.readFileSync(vaultPath, 'utf8');
assert(vaultContent.includes('addXP'), 'Vault crawler must award XP for room / boss clears');

const royalePath = path.join(__dirname, '../js/games/battle-royale/battle-royale.js');
const royaleContent = fs.readFileSync(royalePath, 'utf8');
assert(royaleContent.includes('addXP'), 'Battle royale must award XP for victory / rankings');

const crashPath = path.join(__dirname, '../js/games/crash/crash.js');
const crashContent = fs.readFileSync(crashPath, 'utf8');
assert(crashContent.includes('addXP'), 'Crash must award XP for high multiplier flights (5.00x+)');

const trackerPath = path.join(__dirname, '../js/core/player-tracker.js');
const trackerContent = fs.readFileSync(trackerPath, 'utf8');
assert(trackerContent.includes('Math.floor(betAmount / 10)'), 'PlayerTracker must award turnover XP for spins');
console.log('✓ All 6 gameplay XP hooks verified (Spins, Login Streak, Missions, Trezor, Royale, Crash)');

// 5. Inspect DOM Architecture in index.html, admin.html, and CSS
console.log('\n--- TEST 5: DOM Architecture & Visual Styles ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(indexHtml.includes('id="btn-header-tier"'), 'index.html must have #btn-header-tier');
assert(indexHtml.includes('id="profile-tier-hub"'), 'index.html must have #profile-tier-hub');
assert(indexHtml.includes('id="tier-celebration-modal"'), 'index.html must have #tier-celebration-modal');
assert(indexHtml.includes('tier-manager.js'), 'index.html must load tier-manager.js');

const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
assert(styleCss.includes('.profile-tier-hub'), 'CSS must style .profile-tier-hub');
assert(styleCss.includes('.tier-celebration-overlay'), 'CSS must style .tier-celebration-overlay');
assert(styleCss.includes('.btn-header-tier'), 'CSS must style .btn-header-tier');
assert(styleCss.includes('.tier-grace-alert'), 'CSS must style .tier-grace-alert');

const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
assert(adminHtml.includes('input-daily-grant-silver'), 'admin.html must have Silver grant input');
assert(adminHtml.includes('input-daily-grant-gold'), 'admin.html must have Gold grant input');
assert(adminHtml.includes('input-daily-grant-vip'), 'admin.html must have VIP grant input');
assert(adminHtml.includes('value="gold_vip"'), 'admin.html must have gold_vip targeted push option');

const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin-dashboard.js'), 'utf8');
assert(adminJs.includes('input-daily-grant-silver'), 'admin-dashboard.js must read/write tier grants');
assert(adminJs.includes('cycleMap'), 'admin-dashboard.js must support cycling player tiers in CRM');

console.log('✓ All DOM components, CSS rules, and Admin controls verified');

console.log('\n===============================================================');
console.log('🎉 ALL MULTI-TIER PROGRESSION & LOYALTY TESTS PASSED 100%! 🎉');
console.log('===============================================================');

process.exit(0);
