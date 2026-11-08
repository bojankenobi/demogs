/**
 * Grand Slot Club - Grand Super Hot (EGT Multi-Line 5, 20, 40, 100 Lines) Test Suite
 * Verifies Engine Math, Paylines, Stacked Wilds, Scatters, Grid Morphing, and DOM Integration.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🎰 Starting Grand Super Hot (EGT Multi-Line 5-100) Test Suite...\n');

// 1. ENGINE & PAYLINE VERIFICATION
console.log('--- TEST 1: Engine Initialization & Paylines Geometry ---');
const engineCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'games', 'super-hot', 'super-hot-engine.js'), 'utf8');
eval(engineCode);
const { SuperHotEngine, SYMBOLS, PAYLINES_5, PAYLINES_20, PAYLINES_40, PAYLINES_100 } = global;

const engine = new SuperHotEngine();
assert(engine, 'SuperHotEngine must instantiate cleanly');

// Check symbols
assert.strictEqual(Object.keys(SYMBOLS).length, 8, 'Must have exactly 8 symbols (6 fruits + Wild 7 + Scatter Star)');
assert.strictEqual(SYMBOLS.SEVEN.isWild, true, 'Lucky 7 must be marked as Wild');
assert.strictEqual(SYMBOLS.STAR.isScatter, true, 'Golden Star must be marked as Scatter');

// Check paylines count
assert.strictEqual(PAYLINES_5.length, 5, '5 lines geometry must have 5 lines');
assert.strictEqual(PAYLINES_20.length, 20, '20 lines geometry must have 20 lines');
assert.strictEqual(PAYLINES_40.length, 40, '40 lines geometry must have 40 lines');
assert.strictEqual(PAYLINES_100.length, 100, '100 lines geometry must have 100 lines');

// Check matrix morphology
assert.deepStrictEqual(engine.getGridDimensions(5), { reels: 5, rows: 3 }, '5 lines must be 5x3');
assert.deepStrictEqual(engine.getGridDimensions(20), { reels: 5, rows: 3 }, '20 lines must be 5x3');
assert.deepStrictEqual(engine.getGridDimensions(40), { reels: 5, rows: 4 }, '40 lines must be 5x4');
assert.deepStrictEqual(engine.getGridDimensions(100), { reels: 5, rows: 4 }, '100 lines must be 5x4');

console.log('✓ All payline geometries (5, 20, 40, 100) and matrix dimensions (5x3 & 5x4) verified');

// 2. LINE EVALUATION & WILD SUBSTITUTION
console.log('\n--- TEST 2: Line Evaluation & Stacked Wild Substitution ---');
// Construct a test matrix: 5 Cherries on top row (row 0), 20 lines (5x3)
const testMatrix5Cherries = [
  ['cherry', 'lemon', 'orange'],
  ['cherry', 'plum', 'grapes'],
  ['cherry', 'lemon', 'lemon'],
  ['cherry', 'orange', 'plum'],
  ['cherry', 'grapes', 'watermelon']
];
const res5Cherries = engine.evaluateSpin(testMatrix5Cherries, 20, 2);
assert(res5Cherries.totalWin > 0, '5 Cherries must produce a win');
// Top horizontal row is Line 2 (index 1) in PAYLINES_20
const topRowWin = res5Cherries.winningLines.find(l => l.lineIndex === 2);
assert(topRowWin, 'Top horizontal line win must be detected');
assert.strictEqual(topRowWin.matchCount, 5, 'Must be 5 matching symbols');
assert.strictEqual(topRowWin.payout, 2 * 100, '5 Cherries with 2 ZLT lineBet must pay 200 ZLT');

// Test Wild 7 substitution: 2 Cherries + 1 Seven on middle row (row 1, Line 1)
const testMatrixWildSub = [
  ['lemon', 'cherry', 'orange'],
  ['plum', 'cherry', 'grapes'],
  ['lemon', 'seven', 'lemon'], // Wild 7 on reel 2
  ['orange', 'plum', 'plum'],
  ['grapes', 'grapes', 'watermelon']
];
const resWildSub = engine.evaluateSpin(testMatrixWildSub, 5, 5);
const middleRowWin = resWildSub.winningLines.find(l => l.lineIndex === 1);
assert(middleRowWin, 'Wild 7 must substitute for Cherry on line 1');
assert.strictEqual(middleRowWin.matchCount, 3, 'Must match 3 symbols (Cherry, Cherry, Wild 7)');
assert.strictEqual(middleRowWin.payout, 5 * 10, '3 Cherries with 5 ZLT lineBet must pay 50 ZLT');

console.log('✓ Left-to-right line evaluation and Stacked Wild 7 substitution verified');

// 3. SCATTER ANYWHERE EVALUATION
console.log('\n--- TEST 3: Scatter Anywhere (Golden Star) Evaluation ---');
// Place 3 Scatters on dispersed reels and rows
const testMatrixScatters = [
  ['star', 'cherry', 'orange'],
  ['plum', 'cherry', 'grapes'],
  ['lemon', 'orange', 'star'],
  ['orange', 'star', 'plum'],
  ['grapes', 'grapes', 'watermelon']
];
const resScatters = engine.evaluateSpin(testMatrixScatters, 20, 1);
assert.strictEqual(resScatters.scatterCount, 3, 'Must detect 3 Scatters');
assert.strictEqual(resScatters.scatterWin, 20 * 5, '3 Scatters with totalBet 20 ZLT must pay 100 ZLT');

// Verify Suspense Trigger (2 Scatters on reels 0 and 2)
assert.strictEqual(resScatters.suspenseTrigger, true, '2 Scatters in first 3 reels must trigger suspense tension spin');

console.log('✓ Scatter anywhere calculation and suspense tension trigger verified');

// 4. GAMBLE ELIGIBILITY & 100-LINE STRESS TEST
console.log('\n--- TEST 4: 100-Line 5x4 Matrix & Gamble Bounds ---');
const matrix100 = engine.generateSpinMatrix(100);
assert.strictEqual(matrix100.length, 5, 'Matrix must have 5 reels');
assert.strictEqual(matrix100[0].length, 4, '100 lines matrix must have 4 rows per reel');

const res100 = engine.evaluateSpin(matrix100, 100, 1);
assert(typeof res100.totalWin === 'number', 'Total win must be a number');
if (res100.totalWin > 0 && res100.totalWin <= 100 * 35) {
  assert.strictEqual(res100.isGambleEligible, true, 'Win under 35x bet must be gamble eligible');
}

console.log('✓ 100-line 5x4 matrix generation and Gamble bounds verified');

// 5. DOM & ASSETS INTEGRATION IN INDEX.HTML
console.log('\n--- TEST 5: index.html DOM Elements & Architecture ---');
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// Check Stylesheet
assert(indexHtml.includes('css/super-hot.css'), 'FAIL: css/super-hot.css missing in index.html');

// Check Stage View
assert(indexHtml.includes('id="superhot-game-view"'), 'FAIL: #superhot-game-view missing in index.html');
assert(indexHtml.includes('id="superhot-reels-grid"'), 'FAIL: #superhot-reels-grid missing in index.html');
assert(indexHtml.includes('id="superhot-paylines-canvas"'), 'FAIL: #superhot-paylines-canvas missing in index.html');
assert(indexHtml.includes('id="superhot-btn-spin"'), 'FAIL: #superhot-btn-spin missing in index.html');
assert(indexHtml.includes('id="superhot-btn-gamble"'), 'FAIL: #superhot-btn-gamble missing in index.html');
assert(indexHtml.includes('id="superhot-gamble-modal"'), 'FAIL: #superhot-gamble-modal missing in index.html');
assert(indexHtml.includes('id="superhot-jackpot-modal"'), 'FAIL: #superhot-jackpot-modal missing in index.html');

// Check 5 Micro-Stops
for (let r = 0; r < 5; r++) {
  assert(indexHtml.includes(`data-reel="${r}"`), `FAIL: Micro-stop button for reel ${r} missing`);
}

// Check Lobby Grid Card (11th Game)
assert(indexHtml.includes('id="egt-opt-superhot"'), 'FAIL: #egt-opt-superhot missing in lobby grid');
assert(indexHtml.includes('data-game="superhot"'), 'FAIL: data-game="superhot" missing');
assert(indexHtml.includes('GRAND SUPER HOT'), 'FAIL: GRAND SUPER HOT title missing in card');

// Check Script Tags
assert(indexHtml.includes('js/games/super-hot/super-hot-engine.js'), 'FAIL: super-hot-engine.js missing');
assert(indexHtml.includes('js/games/super-hot/super-hot-audio.js'), 'FAIL: super-hot-audio.js missing');
assert(indexHtml.includes('js/games/super-hot/super-hot.js'), 'FAIL: super-hot.js missing');

console.log('✓ All DOM structures, modals, micro-stops, lobby card, and script tags verified');

// 6. GAME STAGE MANAGER & LOBBY INTEGRATION
console.log('\n--- TEST 6: GameStageManager & CasinoLobby Integration ---');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');
assert(appJs.includes("superhot: '#superhot-game-view'"), 'FAIL: superhot view missing in GameStageManager');
assert(appJs.includes("this.lobby.registerGame('superhot'"), 'FAIL: superhot registration missing in lobby');
assert(appJs.includes("this.superHotGame = new window.GrandSuperHotGame"), 'FAIL: GrandSuperHotGame instantiation missing in app.js');

const lobbyJsPath = path.join(__dirname, '..', 'js', 'core', 'lobby.js');
const lobbyJs = fs.readFileSync(lobbyJsPath, 'utf8');
assert(lobbyJs.includes("superhot: document.getElementById('egt-opt-superhot')"), 'FAIL: superhot missing in modalBoxes');
assert(lobbyJs.includes("GRAND SUPER HOT"), 'FAIL: GRAND SUPER HOT label missing in lobby.js');

console.log('✓ GameStageManager and CasinoLobby hooks verified');

console.log('\n========================================================================');
console.log('🎉 ALL GRAND SUPER HOT TESTS PASSED 100%! 🎉');
console.log('========================================================================\n');
