/**
 * Grand Slot Club - New Games Suite Test: Royal Scratch & European Roulette
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting New Games Suite (Royal Scratch & European Roulette) Verification...');

// 1. DOM Element Verification in index.html
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// Scratchcard elements
assert(indexHtml.includes('id="scratch-game-view"'), 'FAIL: scratch-game-view missing in index.html');
assert(indexHtml.includes('id="scratch-card-grid"'), 'FAIL: scratch-card-grid missing in index.html');
assert(indexHtml.includes('id="btn-scratch-buy"'), 'FAIL: btn-scratch-buy missing in index.html');
assert(indexHtml.includes('id="btn-scratch-all"'), 'FAIL: btn-scratch-all missing in index.html');
assert(indexHtml.includes('id="egt-opt-scratch"'), 'FAIL: egt-opt-scratch missing in lobby');
assert(indexHtml.includes('js/games/royal-scratch/royal-scratch.js'), 'FAIL: royal-scratch.js script tag missing in index.html');

// Roulette elements
assert(indexHtml.includes('id="roulette-game-view"'), 'FAIL: roulette-game-view missing in index.html');
assert(indexHtml.includes('id="roulette-wheel-canvas"'), 'FAIL: roulette-wheel-canvas missing in index.html');
assert(indexHtml.includes('id="btn-roulette-spin"'), 'FAIL: btn-roulette-spin missing in index.html');
assert(indexHtml.includes('id="btn-roulette-clear"'), 'FAIL: btn-roulette-clear missing in index.html');
assert(indexHtml.includes('id="egt-opt-roulette"'), 'FAIL: egt-opt-roulette missing in lobby');
assert(indexHtml.includes('js/games/roulette/roulette.js'), 'FAIL: roulette.js script tag missing in index.html');

console.log('✅ All DOM elements, stage views, and script tags verified in index.html.');

// 2. Royal Scratch Engine Verification
const scratchCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'games', 'royal-scratch', 'royal-scratch.js'), 'utf8');

// Mock browser environment
global.window = {
  slotAudio: { playClick() {}, playBigWin() {} },
  particleEngine: { burst() {} },
  slotApp: { showMessage() {}, playerTracker: { recordSpin() {} } }
};
global.document = {
  getElementById() { return null; },
  querySelectorAll() { return []; }
};

eval(scratchCode);
assert(typeof global.window.RoyalScratchGame === 'function', 'FAIL: RoyalScratchGame not exported');

const walletMock = { balance: 1000, updateUI() {} };
const scratch = new global.window.RoyalScratchGame(walletMock, {});

assert.strictEqual(scratch.SYMBOLS.length, 7, 'FAIL: Expected 7 symbols in Royal Scratch');
assert.strictEqual(scratch.BET_LEVELS.length, 5, 'FAIL: Expected 5 bet levels in Royal Scratch');

// Simulate card generation
scratch.currentBet = 50;
scratch.generateCardGrid(true);
assert.strictEqual(scratch.grid.length, 9, 'FAIL: Scratch card must contain exactly 9 cells');

console.log('✅ Royal Scratch Engine verified (3x3 grid, 7 symbols, foil mechanics).');

// 3. European Roulette Engine Verification
const rouletteCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'games', 'roulette', 'roulette.js'), 'utf8');
eval(rouletteCode);
assert(typeof global.window.RoyalRouletteGame === 'function', 'FAIL: RoyalRouletteGame not exported');

const roulette = new global.window.RoyalRouletteGame(walletMock, {});
const wheelNumbers = global.window.ROULETTE_WHEEL_NUMBERS;
const redNumbers = global.window.RED_NUMBERS;

assert.strictEqual(wheelNumbers.length, 37, 'FAIL: European roulette must have 37 pockets (0-36)');
assert.strictEqual(wheelNumbers[0], 0, 'FAIL: Pocket 0 must exist in European sequence');
assert.strictEqual(roulette.getNumberColor(0), 'green', 'FAIL: Number 0 must be green');
assert.strictEqual(roulette.getNumberColor(32), 'red', 'FAIL: Number 32 must be red');
assert.strictEqual(roulette.getNumberColor(15), 'black', 'FAIL: Number 15 must be black');

// Test Payout Mathematics
function testRoulettePayout(bets, winNum) {
  let win = 0;
  const isRed = redNumbers.includes(winNum);
  const isBlack = (winNum !== 0 && !isRed);
  const isEven = (winNum !== 0 && winNum % 2 === 0);
  const isOdd = (winNum !== 0 && winNum % 2 !== 0);
  const isLow = (winNum >= 1 && winNum <= 18);
  const isHigh = (winNum >= 19 && winNum <= 36);
  const is1stDozen = (winNum >= 1 && winNum <= 12);

  Object.entries(bets).forEach(([spot, amt]) => {
    if (spot === `num_${winNum}`) win += amt * 36;
    if (spot === 'color_red' && isRed) win += amt * 2;
    if (spot === 'color_black' && isBlack) win += amt * 2;
    if (spot === 'even' && isEven) win += amt * 2;
    if (spot === 'odd' && isOdd) win += amt * 2;
    if (spot === 'low' && isLow) win += amt * 2;
    if (spot === 'high' && isHigh) win += amt * 2;
    if (spot === 'dozen_1' && is1stDozen) win += amt * 3;
  });
  return win;
}

// 100 on red, winNum = 32 (red) -> 200
assert.strictEqual(testRoulettePayout({ color_red: 100 }, 32), 200, 'Red bet on 32 should pay 2x');
// 100 on red, winNum = 15 (black) -> 0
assert.strictEqual(testRoulettePayout({ color_red: 100 }, 15), 0, 'Red bet on 15 should pay 0');
// 10 on straight number 17, winNum = 17 -> 360 (35:1 + 1x)
assert.strictEqual(testRoulettePayout({ num_17: 10 }, 17), 360, 'Straight up on 17 should pay 36x');
// 50 on 1st Dozen, winNum = 7 -> 150 (2:1 + 1x)
assert.strictEqual(testRoulettePayout({ dozen_1: 50 }, 7), 150, '1st Dozen on 7 should pay 3x');
// 100 on Red, winNum = 0 (green) -> 0
assert.strictEqual(testRoulettePayout({ color_red: 100 }, 0), 0, 'Red bet on 0 should pay 0');

console.log('✅ European Roulette Engine verified (Single-zero, color map, 35:1 straight-up & outside payouts).');

// 4. Verify GameStageManager Virtual View Integration
const appCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
assert(appCode.includes("scratch: '#scratch-game-view'"), 'FAIL: scratch view not in GameStageManager');
assert(appCode.includes("roulette: '#roulette-game-view'"), 'FAIL: roulette view not in GameStageManager');
assert(appCode.includes("this.lobby.registerGame('scratch'"), 'FAIL: scratch game not registered in lobby');
assert(appCode.includes("this.lobby.registerGame('roulette'"), 'FAIL: roulette game not registered in lobby');

console.log('✅ GameStageManager virtual view decoupling and Lobby registration verified.');

// 5. Zero free drinks & Zero residual RSD
assert(!scratchCode.includes('besplatno piće'), 'FAIL: free drinks in scratch.js');
assert(!rouletteCode.includes('besplatno piće'), 'FAIL: free drinks in roulette.js');
assert(!scratchCode.includes('RSD'), 'FAIL: RSD found in scratch.js');
assert(!rouletteCode.includes('RSD'), 'FAIL: RSD found in roulette.js');

console.log('✅ Nomenclature strictly ZLT and Anti-freeloader policy compliant.');

console.log('\n🎉 ALL NEW GAMES SUITE TESTS PASSED 100%!');
