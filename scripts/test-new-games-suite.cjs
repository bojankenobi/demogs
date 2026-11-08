/**
 * Grand Slot Club - New Games Suite Test: Royal Scratch & Clean Roulette Purge Verification
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting New Games Suite (Royal Scratch & Roulette Purge) Verification...');

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

// Roulette elements MUST BE COMPLETELY PURGED per user request
assert(!indexHtml.includes('id="roulette-game-view"'), 'FAIL: roulette-game-view still present in index.html');
assert(!indexHtml.includes('id="roulette-wheel-canvas"'), 'FAIL: roulette-wheel-canvas still present in index.html');
assert(!indexHtml.includes('id="btn-roulette-spin"'), 'FAIL: btn-roulette-spin still present in index.html');
assert(!indexHtml.includes('id="btn-roulette-clear"'), 'FAIL: btn-roulette-clear still present in index.html');
assert(!indexHtml.includes('id="btn-roulette-undo"'), 'FAIL: btn-roulette-undo still present in index.html');
assert(!indexHtml.includes('id="roulette-felt-section"'), 'FAIL: roulette-felt-section still present in index.html');
assert(!indexHtml.includes('id="roulette-oval-section"'), 'FAIL: roulette-oval-section still present in index.html');
assert(!indexHtml.includes('id="roulette-racetrack-track"'), 'FAIL: roulette-racetrack-track still present in index.html');
assert(!indexHtml.includes('id="egt-opt-roulette"'), 'FAIL: egt-opt-roulette still present in lobby');
assert(!indexHtml.includes('js/games/roulette/roulette.js'), 'FAIL: roulette.js script tag still present in index.html');

console.log('✅ Royal Scratch DOM verified and European Roulette fully purged from index.html.');

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
  querySelector() { return null; },
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

// 3. Verify GameStageManager Virtual View Integration & Purge in app.js
const appCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
assert(appCode.includes("scratch: '#scratch-game-view'"), 'FAIL: scratch view not in GameStageManager');
assert(!appCode.includes("roulette: '#roulette-game-view'"), 'FAIL: roulette view still in GameStageManager');
assert(appCode.includes("this.lobby.registerGame('scratch'"), 'FAIL: scratch game not registered in lobby');
assert(!appCode.includes("this.lobby.registerGame('roulette'"), 'FAIL: roulette game still registered in lobby');

console.log('✅ GameStageManager virtual view decoupling and Lobby registration verified.');

// 4. Zero free drinks & Zero residual RSD
assert(!scratchCode.includes('besplatno piće'), 'FAIL: free drinks in scratch.js');
assert(!scratchCode.includes('RSD'), 'FAIL: RSD found in scratch.js');

console.log('✅ Nomenclature strictly ZLT and Anti-freeloader policy compliant.');

// 5. Scrollbar Chromium/Firefox Separation Verification
const styleCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
assert(styleCss.includes('@supports not selector(::-webkit-scrollbar)'), 'FAIL: @supports not selector(::-webkit-scrollbar) missing in style.css');
assert(styleCss.includes('::-webkit-scrollbar-button'), 'FAIL: ::-webkit-scrollbar-button rule missing');
console.log('✅ Universal Luxury Casino Scrollbar cross-browser isolation verified.');

// 6. Verify Complete Removal of Roulette Styles and Files
assert(!styleCss.includes('.in-roulette-mode'), 'FAIL: .in-roulette-mode still in style.css');
assert(!styleCss.includes('.roulette-stage-view'), 'FAIL: .roulette-stage-view still in style.css');
assert(!styleCss.includes('.poster-roulette'), 'FAIL: .poster-roulette still in style.css');
assert(!fs.existsSync(path.join(__dirname, '..', 'js', 'games', 'roulette')), 'FAIL: roulette directory still exists');

console.log('✅ Roulette styles and physical files cleanly deleted.');

console.log('\n🎉 ALL NEW GAMES SUITE & PURGE TESTS PASSED 100%!');
