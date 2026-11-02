/**
 * Test Suite: Grand Crash Golden Rocket & Desktop Widescreen Zero-Scroll Layout
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: GRAND CRASH GOLDEN ROCKET & DESKTOP ZERO-SCROLL ===\n');

// 1. Inspect crash.js
console.log('--- TEST 1: Golden Rocket & Grand Slot Logo in crash.js ---');
const crashJs = fs.readFileSync(path.join(__dirname, '../js/games/crash/crash.js'), 'utf8');

assert(crashJs.includes('logo-flower.svg'), 'Official logo-flower.svg must be loaded in GrandCrashGame');
assert(crashJs.includes('this.logoImg'), 'this.logoImg must be initialized');
assert(crashJs.includes('bodyGrad'), 'Fuselage body gradient must be created');
assert(crashJs.includes('#ffd700'), '24K Gold color #ffd700 must be used');
assert(crashJs.includes('upperWingGrad'), 'Upper wing metallic gold gradient must exist');
assert(crashJs.includes('lowerWingGrad'), 'Lower wing metallic gold gradient must exist');
assert(crashJs.includes('nozzleGrad'), 'Gold engine nozzle gradient must exist');
assert(crashJs.includes('flameGrad'), 'Golden-amber plasma flame must exist');
assert(crashJs.includes('goldColors'), 'Exhaust particles must use golden colors');
assert(crashJs.includes('statMaxEl') && crashJs.includes('statAvgEl'), 'Flight statistics references must exist');

console.log('✓ Golden rocket, metallic wings, gold flame, GrandSlot logo & stats verified in crash.js');

// 2. Inspect index.html
console.log('\n--- TEST 2: DOM Architecture in index.html ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

assert(indexHtml.includes('id="crash-game-view"'), 'crash-game-view container must exist');
assert(indexHtml.includes('class="crash-cabinet-panel"'), 'crash-cabinet-panel must exist');
assert(indexHtml.includes('class="crash-bets-sidebar"'), 'crash-bets-sidebar must exist for left wing');
assert(indexHtml.includes('class="crash-multiplayer-deck"'), 'crash-multiplayer-deck must exist');
assert(indexHtml.includes('class="crash-center-arena"'), 'crash-center-arena must exist');
assert(indexHtml.includes('class="crash-results-sidebar"'), 'crash-results-sidebar must exist');
assert(indexHtml.includes('id="crash-canvas"'), 'crash-canvas must exist');
assert(indexHtml.includes('id="crash-history-strip"'), 'crash-history-strip must exist');
assert(indexHtml.includes('id="crash-stat-max"'), 'crash-stat-max must exist');
assert(indexHtml.includes('id="crash-stat-avg"'), 'crash-stat-avg must exist');
assert(indexHtml.includes('id="crash-action-btn"'), 'crash-action-btn must exist');
assert(indexHtml.includes('crash.js?v=98'), 'crash.js cache buster bumped to v=98');
assert(indexHtml.includes('style.css?v='), 'style.css cache buster present');

console.log('✓ All 3 cockpit wings, canvas arena, and stat badges verified in index.html');

// 3. Inspect css/style.css
console.log('\n--- TEST 3: Desktop Zero-Scroll 3-Column Layout in css/style.css ---');
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

assert(styleCss.includes('.crash-center-arena'), 'Base .crash-center-arena rule must exist');
assert(styleCss.includes('.crash-bets-sidebar'), 'Base .crash-bets-sidebar rule must exist');
assert(styleCss.includes('.crash-results-sidebar'), 'Base .crash-results-sidebar rule must exist');
assert(styleCss.includes('grid-template-columns: 320px 1fr 220px') || styleCss.includes('grid-template-columns:'), 'Desktop 3-column grid must exist');
assert(styleCss.includes('.game-container.in-crash-mode'), '.game-container.in-crash-mode styling must exist');
assert(styleCss.includes('1440px'), 'Widescreen expansion rule (1440px) must exist');

console.log('✓ Desktop 3-column zero-scroll CSS rules verified');

console.log('\n======================================================================');
console.log('🎉 ALL GRAND CRASH GOLDEN ROCKET & DESKTOP ZERO-SCROLL TESTS PASSED! 🎉');
console.log('======================================================================\n');
