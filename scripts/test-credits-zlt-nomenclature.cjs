/**
 * Verification Test: Clean Nomenclature (Credits, ZLT, Denominations & Ratios)
 * Ensures NO user-facing RSD exists in active client code, banners, jackpots, or games.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: CREDITS & ZLT NOMENCLATURE VERIFICATION ===\n');

const filesToCheck = [
  'index.html',
  'js/app.js',
  'js/i18n.js',
  'js/core/admin.js',
  'js/core/admin-bridge-v2.js',
  'js/core/bonus-features.js',
  'js/core/notifications.js',
  'js/core/wallet.js',
  'js/core/wheel.js',
  'js/games/mines/mines.js',
  'js/games/mines/mini-mines.js',
  'js/games/xtension/xtension.js',
  'js/games/crash/crash.js',
  'js/games/plinko/plinko.js',
  'js/games/blackjack/blackjack.js',
  'js/games/video-poker/video-poker.js',
  'js/games/casino-holdem/casino-holdem.js'
];

// --- TEST 1: No user-facing RSD in active production files ---
console.log('--- TEST 1: Checking for residual user-facing RSD strings ---');
let residualRsdCount = 0;

filesToCheck.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Exclude code variable names or HTML ID/classes (balance_rsd, hud-sub-rsd, addFictionalRsd, etc.)
    // Check if line contains user-facing string or text with visible RSD currency label
    if (/(['"`>][^'"`>]*?\b)RSD(\b[^'"`<]*?['"`<])/i.test(line)) {
      if (!line.includes('balance_rsd') && !line.includes('addFictionalRsd') && !line.includes('hud-sub-rsd') && !line.includes('hud-balance-rsd') && !line.includes('hud-bet-rsd')) {
        console.error(`Residual RSD found in ${relPath}:${idx + 1}: ${line.trim()}`);
        residualRsdCount++;
      }
    }
  });
});

assert.strictEqual(residualRsdCount, 0, `Found ${residualRsdCount} user-facing RSD strings!`);
console.log('✓ Zero user-facing RSD strings found in all active files');

// --- TEST 2: HUD Denomination & Balance Elements ---
console.log('\n--- TEST 2: HUD Denomination & Ratio Markup in index.html ---');
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(htmlContent.includes('id="hud-balance-rsd">≈ 1,000 ZLT<'), 'HUD balance subtext must be ZLT');
assert(htmlContent.includes('id="hud-denom-sub">1 KR = 1 ZLT<'), 'HUD denom subtext must show 1 KR = 1 ZLT');
assert(htmlContent.includes('id="hud-bet-rsd">≈ 20 ZLT<'), 'HUD bet subtext must be ZLT');
console.log('✓ HUD dashboard correctly showcases Credits as primary and ZLT as conversion');

// --- TEST 3: Mines & Mini-Mines KREDITA/KR Labels ---
console.log('\n--- TEST 3: Mines & Mini-Mines Action & Win Units ---');
const minesJs = fs.readFileSync(path.join(__dirname, '../js/games/mines/mines.js'), 'utf8');
const miniMinesJs = fs.readFileSync(path.join(__dirname, '../js/games/mines/mini-mines.js'), 'utf8');
assert(minesJs.includes('${this.currentBet} KR'), 'Mines bet button must show KR');
assert(minesJs.includes('0 KR'), 'Mines 0 win must show 0 KR');
assert(minesJs.includes('${currentWin.toLocaleString()} KR'), 'Mines cashout button must show KR');
assert(minesJs.includes('OSVOJENO: ${winAmount.toLocaleString()} KREDITA!'), 'Mines win banner must show KREDITA');
assert(miniMinesJs.includes('+${starterPrize} KREDITA!'), 'Mini mines start banner must show KREDITA');
assert(miniMinesJs.includes('${this.totalWin.toLocaleString()} KR'), 'Mini mines cashout button must show KR');
assert(miniMinesJs.includes('IZGUBLJEN SAV DOBITAK (0 KREDITA)!'), 'Mini mines wipe must show 0 KREDITA');
console.log('✓ Mines and Mini-Mines completely express bets and wins in KR / KREDITA');

// --- TEST 4: Mystery Jackpot & Xtension Payouts in Credits ---
console.log('\n--- TEST 4: Mystery Jackpot & Xtension Payout Announcements ---');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const xtensionJs = fs.readFileSync(path.join(__dirname, '../js/games/xtension/xtension.js'), 'utf8');
const i18nJs = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');

assert(appJs.includes('💎 DIAMOND JACKPOT! +${prize.toLocaleString()} KREDITA! 💎'), 'App diamond jackpot must announce in KREDITA');
assert(appJs.includes('🏆 GOLD JACKPOT! +${prize.toLocaleString()} KREDITA! 🏆'), 'App gold jackpot must announce in KREDITA');
assert(appJs.includes('🥈 SILVER JACKPOT! +${prize.toLocaleString()} KREDITA! 🥈'), 'App silver jackpot must announce in KREDITA');
assert(appJs.includes('DENOMINACIJA: 1 KR = ${this.wallet.activeDenom} ZLT'), 'Denom toggle message must show 1 KR = X ZLT');
assert(xtensionJs.includes('GRAND JACKPOT OSVOJEN! +${finalWin.toLocaleString()} KREDITA!'), 'Xtension grand jackpot must announce in KREDITA');
assert(i18nJs.includes('jackpotWonSilver: \'🥈 ČESTITAMO! OSVOJILI STE SILVER JACKPOT: +{amount} KREDITA! 🥈\''), 'i18n silver jackpot must announce in KREDITA');
assert(i18nJs.includes('jackpotWonGold: \'🏆 GRAND POGODAK! OSVOJILI STE GOLD JACKPOT: +{amount} KREDITA! 🏆\''), 'i18n gold jackpot must announce in KREDITA');
assert(i18nJs.includes('jackpotWonDiamond: \'💎 MEGA BANGER! OSVOJILI STE DIAMOND JACKPOT: +{amount} KREDITA! 💎\''), 'i18n diamond jackpot must announce in KREDITA');
console.log('✓ Jackpot announcements consistently reward and report in KREDITA');

// --- TEST 5: Wallet Mathematical Consistency (1 KR = Denom ZLT) ---
console.log('\n--- TEST 5: Wallet Mathematical Ratio Verification ---');
const walletJs = fs.readFileSync(path.join(__dirname, '../js/core/wallet.js'), 'utf8');
assert(walletJs.includes("this.balanceRsdEl.textContent = `≈ ${this.rsdBalance.toLocaleString"), 'Wallet must render ZLT secondary');
assert(walletJs.includes("this.denomSubEl.textContent = `1 KR = ${this.activeDenom} ZLT`"), 'Wallet must render ratio 1 KR = X ZLT');
console.log('✓ Wallet math correctly teaches player the live credit-to-denomination relationship');

console.log('\n================================================================');
console.log('🎉 ALL 5 CREDITS & ZLT NOMENCLATURE TESTS PASSED PERFECTLY! 🎉');
console.log('================================================================');
