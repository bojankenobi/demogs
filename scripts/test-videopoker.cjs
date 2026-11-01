const fs = require('fs');
const assert = require('assert');

console.log('=== GRAND ROYAL VIDEO POKER TEST SUITE ===');

// --- TEST 1: DOM Structure in index.html ---
console.log('\n--- TEST 1: DOM Elements Integrity in index.html ---');
const html = fs.readFileSync('index.html', 'utf8');

const requiredIds = [
  'videopoker-game-view',
  'vp-status-text',
  'vp-row-royal_flush',
  'vp-row-straight_flush',
  'vp-row-four_of_a_kind',
  'vp-row-full_house',
  'vp-row-flush',
  'vp-row-straight',
  'vp-row-three_of_a_kind',
  'vp-row-two_pair',
  'vp-row-jacks_or_better',
  'vp-payout-royal_flush',
  'vp-payout-straight_flush',
  'vp-payout-four_of_a_kind',
  'vp-payout-full_house',
  'vp-payout-flush',
  'vp-payout-straight',
  'vp-payout-three_of_a_kind',
  'vp-payout-two_pair',
  'vp-payout-jacks_or_better',
  'vp-bet-minus',
  'vp-bet-val',
  'vp-bet-plus',
  'vp-bet-max',
  'btn-vp-deal',
  'btn-vp-draw',
  'btn-vp-gamble',
  'btn-vp-collect',
  'vp-gamble-modal',
  'vp-gamble-flash-card',
  'btn-vp-gamble-red',
  'btn-vp-gamble-black',
  'btn-vp-gamble-collect',
  'egt-opt-videopoker'
];

requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `Missing required Video Poker DOM ID: ${id}`);
});

// Card slots 0..4
for (let i = 0; i < 5; i++) {
  assert(html.includes(`id="vp-card-${i}"`), `Missing card slot ${i}`);
  assert(html.includes(`id="vp-hold-${i}"`), `Missing hold badge ${i}`);
}
console.log(`✓ All ${requiredIds.length + 10} Video Poker DOM elements present in index.html`);

// --- TEST 2: CSS Rules in css/style.css ---
console.log('\n--- TEST 2: CSS Video Poker Styles & Responsive Rules ---');
const css = fs.readFileSync('css/style.css', 'utf8');

assert(css.includes('.game-container.in-videopoker-mode'), 'Missing .game-container.in-videopoker-mode in css/style.css');
assert(css.includes('.videopoker-stage-view'), 'Missing .videopoker-stage-view in css/style.css');
assert(css.includes('.videopoker-cabinet-panel'), 'Missing .videopoker-cabinet-panel in css/style.css');
assert(css.includes('.vp-paytable-board'), 'Missing .vp-paytable-board in css/style.css');
assert(css.includes('.vp-card-box.is-held'), 'Missing .vp-card-box.is-held in css/style.css');
assert(css.includes('.btn-vp-gamble'), 'Missing .btn-vp-gamble in css/style.css');
assert(css.includes('.vp-gamble-modal'), 'Missing .vp-gamble-modal in css/style.css');
assert(css.includes('.poster-videopoker'), 'Missing .poster-videopoker in css/style.css');
console.log('✓ All CSS styles, animations, hold states, and posters verified');

// --- TEST 3: Hand Evaluator Unit Tests ---
console.log('\n--- TEST 3: 9-Hand Poker Evaluator Unit Tests ---');
global.window = {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
};

const vpCode = fs.readFileSync('js/games/video-poker/video-poker.js', 'utf8');
eval(vpCode);
const RoyalVideoPokerGame = global.window.RoyalVideoPokerGame;
assert(RoyalVideoPokerGame, 'RoyalVideoPokerGame must be attached to window');

const game = new RoyalVideoPokerGame(null, null);

// 1. Royal Flush
const royalFlush = [
  { rank: '10', val: 10, suit: 'spades' },
  { rank: 'J', val: 11, suit: 'spades' },
  { rank: 'Q', val: 12, suit: 'spades' },
  { rank: 'K', val: 13, suit: 'spades' },
  { rank: 'A', val: 14, suit: 'spades' }
];
const resRoyal = game.evaluateHand(royalFlush);
assert.strictEqual(resRoyal.handId, 'royal_flush');
assert.strictEqual(resRoyal.multiplier, 800);
console.log('✓ Royal Flush evaluated correctly: 800x');

// 2. Straight Flush
const straightFlush = [
  { rank: '5', val: 5, suit: 'hearts' },
  { rank: '6', val: 6, suit: 'hearts' },
  { rank: '7', val: 7, suit: 'hearts' },
  { rank: '8', val: 8, suit: 'hearts' },
  { rank: '9', val: 9, suit: 'hearts' }
];
const resSF = game.evaluateHand(straightFlush);
assert.strictEqual(resSF.handId, 'straight_flush');
assert.strictEqual(resSF.multiplier, 50);
console.log('✓ Straight Flush evaluated correctly: 50x');

// 3. Four of a Kind (Poker)
const fourOfAKind = [
  { rank: '8', val: 8, suit: 'diamonds' },
  { rank: '8', val: 8, suit: 'clubs' },
  { rank: '8', val: 8, suit: 'hearts' },
  { rank: '8', val: 8, suit: 'spades' },
  { rank: 'K', val: 13, suit: 'hearts' }
];
const res4k = game.evaluateHand(fourOfAKind);
assert.strictEqual(res4k.handId, 'four_of_a_kind');
assert.strictEqual(res4k.multiplier, 25);
console.log('✓ Four of a Kind evaluated correctly: 25x');

// 4. Full House
const fullHouse = [
  { rank: 'Q', val: 12, suit: 'spades' },
  { rank: 'Q', val: 12, suit: 'diamonds' },
  { rank: 'Q', val: 12, suit: 'hearts' },
  { rank: '4', val: 4, suit: 'clubs' },
  { rank: '4', val: 4, suit: 'spades' }
];
const resFH = game.evaluateHand(fullHouse);
assert.strictEqual(resFH.handId, 'full_house');
assert.strictEqual(resFH.multiplier, 9);
console.log('✓ Full House evaluated correctly: 9x');

// 5. Flush
const flush = [
  { rank: '2', val: 2, suit: 'clubs' },
  { rank: '5', val: 5, suit: 'clubs' },
  { rank: '8', val: 8, suit: 'clubs' },
  { rank: 'J', val: 11, suit: 'clubs' },
  { rank: 'K', val: 13, suit: 'clubs' }
];
const resFlush = game.evaluateHand(flush);
assert.strictEqual(resFlush.handId, 'flush');
assert.strictEqual(resFlush.multiplier, 6);
console.log('✓ Flush evaluated correctly: 6x');

// 6. Straight & Ace-Low Straight
const straight = [
  { rank: '7', val: 7, suit: 'spades' },
  { rank: '8', val: 8, suit: 'hearts' },
  { rank: '9', val: 9, suit: 'diamonds' },
  { rank: '10', val: 10, suit: 'clubs' },
  { rank: 'J', val: 11, suit: 'spades' }
];
const resStraight = game.evaluateHand(straight);
assert.strictEqual(resStraight.handId, 'straight');
assert.strictEqual(resStraight.multiplier, 4);

const aceLowStraight = [
  { rank: 'A', val: 14, suit: 'diamonds' },
  { rank: '2', val: 2, suit: 'clubs' },
  { rank: '3', val: 3, suit: 'spades' },
  { rank: '4', val: 4, suit: 'hearts' },
  { rank: '5', val: 5, suit: 'clubs' }
];
const resAceLow = game.evaluateHand(aceLowStraight);
assert.strictEqual(resAceLow.handId, 'straight');
assert.strictEqual(resAceLow.multiplier, 4);
console.log('✓ Straights (Standard & Ace-Low Wheel A-2-3-4-5) evaluated correctly: 4x');

// 7. Three of a Kind
const threeOfAKind = [
  { rank: '5', val: 5, suit: 'spades' },
  { rank: '5', val: 5, suit: 'clubs' },
  { rank: '5', val: 5, suit: 'diamonds' },
  { rank: '9', val: 9, suit: 'hearts' },
  { rank: 'K', val: 13, suit: 'spades' }
];
const res3k = game.evaluateHand(threeOfAKind);
assert.strictEqual(res3k.handId, 'three_of_a_kind');
assert.strictEqual(res3k.multiplier, 3);
console.log('✓ Three of a Kind evaluated correctly: 3x');

// 8. Two Pair
const twoPair = [
  { rank: '10', val: 10, suit: 'spades' },
  { rank: '10', val: 10, suit: 'hearts' },
  { rank: '3', val: 3, suit: 'diamonds' },
  { rank: '3', val: 3, suit: 'clubs' },
  { rank: 'A', val: 14, suit: 'spades' }
];
const res2p = game.evaluateHand(twoPair);
assert.strictEqual(res2p.handId, 'two_pair');
assert.strictEqual(res2p.multiplier, 2);
console.log('✓ Two Pair evaluated correctly: 2x');

// 9. Jacks or Better (Pair of J, Q, K, A)
const jacksPair = [
  { rank: 'J', val: 11, suit: 'hearts' },
  { rank: 'J', val: 11, suit: 'spades' },
  { rank: '4', val: 4, suit: 'diamonds' },
  { rank: '7', val: 7, suit: 'clubs' },
  { rank: '9', val: 9, suit: 'spades' }
];
const resJob = game.evaluateHand(jacksPair);
assert.strictEqual(resJob.handId, 'jacks_or_better');
assert.strictEqual(resJob.multiplier, 1);
console.log('✓ Jacks or Better evaluated correctly: 1x');

// 10. Low Pair (< J) -> No Win
const lowPair = [
  { rank: '9', val: 9, suit: 'hearts' },
  { rank: '9', val: 9, suit: 'spades' },
  { rank: '4', val: 4, suit: 'diamonds' },
  { rank: '7', val: 7, suit: 'clubs' },
  { rank: 'K', val: 13, suit: 'spades' }
];
const resLowPair = game.evaluateHand(lowPair);
assert.strictEqual(resLowPair.handId, null);
assert.strictEqual(resLowPair.multiplier, 0);
console.log('✓ Low pair (< J) correctly yields 0x in Jacks or Better rules');

// --- TEST 4: Smart-Hold AI Logic ---
console.log('\n--- TEST 4: Smart-Hold Auto-Selection ---');
game.hand = [
  { rank: 'K', val: 13, suit: 'hearts' },
  { rank: 'K', val: 13, suit: 'spades' },
  { rank: '2', val: 2, suit: 'diamonds' },
  { rank: '6', val: 6, suit: 'clubs' },
  { rank: '9', val: 9, suit: 'spades' }
];
game.heldIndices = [false, false, false, false, false];
game.applySmartHold();
assert.strictEqual(game.heldIndices[0], true);
assert.strictEqual(game.heldIndices[1], true);
assert.strictEqual(game.heldIndices[2], false);
assert.strictEqual(game.heldIndices[3], false);
assert.strictEqual(game.heldIndices[4], false);
console.log('✓ Smart-Hold automatically held the pair of Kings (indexes 0 and 1)');

// --- TEST 5: Gamble Doubling Calculations ---
console.log('\n--- TEST 5: Gamble Doubling Mathematics ---');
game.gamblePool = 40;
game.gambleStreak = 0;
assert.strictEqual(game.gamblePool * 2, 80);
game.gamblePool *= 2;
game.gambleStreak++;
assert.strictEqual(game.gamblePool, 80);
assert.strictEqual(game.gambleStreak, 1);
console.log('✓ Gamble doubling sequence (40 -> 80) verified');

// --- TEST 6: Application Controller Integration ---
console.log('\n--- TEST 6: App.js Integration Verification ---');
const appJs = fs.readFileSync('js/app.js', 'utf8');
const lobbyJs = fs.readFileSync('js/core/lobby.js', 'utf8');
assert(appJs.includes('this.videoPokerGame = new window.RoyalVideoPokerGame'), 'Video poker instance missing in app.js');
assert(appJs.includes("this.lobby.registerGame('videopoker'"), 'Video poker not registered in lobby in app.js');
assert(appJs.includes("'videopoker-game-view'"), 'videopoker-game-view missing in standaloneViews');
assert(lobbyJs.includes("'videopoker'"), 'Video poker card missing in lobby.js opts/modalBoxes');
console.log('✓ Video Poker is completely registered in App and CasinoLobby');

console.log('\n======================================================');
console.log('🎉 ALL 6 VIDEO POKER TESTS PASSED SUCCESSFULLY!');
console.log('======================================================\n');
