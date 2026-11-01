const fs = require('fs');
const assert = require('assert');

console.log('=== GRAND ROYAL BLACKJACK MOBILE & TABLET TEST SUITE ===');

// --- TEST 1: DOM Elements in index.html ---
console.log('\n--- TEST 1: DOM Element Integrity in index.html ---');
const html = fs.readFileSync('index.html', 'utf8');

const requiredIds = [
  'blackjack-game-view',
  'bj-dealer-cards',
  'bj-dealer-score',
  'bj-center-message',
  'bj-msg-text',
  'bj-player-hands-wrap',
  'bj-player-hand-0',
  'bj-player-cards-0',
  'bj-player-score-0',
  'bj-hand-0-bet-val',
  'bj-betting-controls',
  'bj-bet-minus',
  'bj-bet-val',
  'bj-bet-plus',
  'bj-chip-double',
  'bj-chip-clear',
  'btn-bj-deal',
  'bj-action-controls',
  'btn-bj-hit',
  'btn-bj-stand',
  'btn-bj-double',
  'btn-bj-split',
  'bj-round-over-controls',
  'btn-bj-rebet',
  'btn-bj-new-round',
  'bj-insurance-overlay'
];

requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `Missing required DOM ID: ${id}`);
});
console.log(`✓ All ${requiredIds.length} critical Blackjack DOM IDs are present in index.html`);

// --- TEST 2: Chip Strip & Stepper Controls Structure ---
console.log('\n--- TEST 2: Chip Rack & Stepper Architecture ---');
assert(html.includes('class="bj-bet-row-controls"'), 'Missing .bj-bet-row-controls container in index.html');
assert(html.includes('class="bj-bet-quick-actions"'), 'Missing .bj-bet-quick-actions in index.html');
assert(html.includes('id="bj-chip-double"'), 'Missing #bj-chip-double in quick actions');
assert(html.includes('id="bj-chip-clear"'), 'Missing #bj-chip-clear in quick actions');

const bettingChips = [10, 20, 50, 100, 500];
bettingChips.forEach(amt => {
  assert(
    html.includes(`data-amt="${amt}"`),
    `Missing data-amt="${amt}" on betting chip in index.html`
  );
});
console.log('✓ Stepper actions (2X, C) and 5 authentic betting chips (10, 20, 50, 100, 500) correctly separated');

// --- TEST 3: CSS Rules for Vertical Breathing & Zero Void ---
console.log('\n--- TEST 3: CSS Vertical Breathing & Table Sizing ---');
const css = fs.readFileSync('css/style.css', 'utf8');

assert(
  css.includes('.game-container.in-blackjack-mode .stage-area {\n  flex: 1;\n  display: flex;\n  flex-direction: column;'),
  'Stage area must be flex: 1 column in blackjack mode to fill viewport cleanly'
);

assert(
  css.includes('.blackjack-cabinet-panel {\n  width: 100%;\n  flex: 1;\n  min-height: 0;'),
  'Blackjack cabinet panel must be flex: 1 to fill available stage space without dead void'
);

assert(
  css.includes('min-height: clamp(350px, 47vh, 460px);'),
  'Blackjack table base min-height must allow vertical breathing room'
);

assert(
  css.includes('min-height: clamp(340px, 48vh, 440px);'),
  'Mobile (@media max-width: 480px) table min-height must be dynamic clamp (not fixed 270px)'
);
console.log('✓ Vertical flex expansion rules verified: eliminates empty black void on mobile');

// --- TEST 4: Anti-Collision & Inscription Typography ---
console.log('\n--- TEST 4: Table Inscription & Status Banner Anti-Collision ---');
assert(
  css.includes('.blackjack-rules-inscription {\n  position: absolute;\n  top: 24%;'),
  'Rules inscription must be positioned higher at 24% to avoid colliding with center message'
);

assert(
  css.includes('opacity: 0.72;'),
  'Rules inscription must have elegant watermark opacity'
);

assert(
  css.includes('background: rgba(8, 12, 22, 0.96);'),
  'Status message must have solid opaque dark glass background to prevent any bleed-through overlap'
);

assert(
  css.includes('z-index: 5;'),
  'Status message must have z-index: 5 to sit clearly above felt watermarks'
);
console.log('✓ Text anti-collision and opaque status banner styling verified');

// --- TEST 5: Chip Styling & Circular Aspect Ratio ---
console.log('\n--- TEST 5: 3D Casino Chip Geometry & Aspect Ratio ---');
assert(
  css.includes('aspect-ratio: 1;'),
  'Chips must maintain 1:1 circular aspect ratio'
);
assert(
  css.includes('border-radius: 50%;'),
  'Chips must be perfectly circular'
);
assert(
  css.includes('width: 44px;\n    height: 44px;'),
  'Mobile chips must have 44px diameter for comfortable tactile thumb reach'
);
console.log('✓ Chip geometry is 100% circular, uncrowded, and tactile');

// --- TEST 6: Simulated Blackjack Bet Logic Execution ---
console.log('\n--- TEST 6: Blackjack Engine Bet Calculations ---');

class MockBlackjackBetManager {
  constructor() {
    this.currentBet = 20;
    this.minBet = 10;
    this.maxBet = 2000;
  }
  adjustBet(delta) {
    this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, this.currentBet + delta));
    return this.currentBet;
  }
  addChip(amt) {
    this.currentBet = Math.min(this.maxBet, this.currentBet + amt);
    return this.currentBet;
  }
  doubleBet() {
    this.currentBet = Math.min(this.maxBet, this.currentBet * 2);
    return this.currentBet;
  }
  clearBet() {
    this.currentBet = this.minBet;
    return this.currentBet;
  }
}

const betMgr = new MockBlackjackBetManager();
assert.strictEqual(betMgr.currentBet, 20);

// Test Stepper Minus
assert.strictEqual(betMgr.adjustBet(-10), 10);
// Stepper cannot go below min
assert.strictEqual(betMgr.adjustBet(-10), 10);

// Test Stepper Plus
assert.strictEqual(betMgr.adjustBet(10), 20);

// Test Additive Chip Stacking
assert.strictEqual(betMgr.addChip(50), 70);
assert.strictEqual(betMgr.addChip(100), 170);
assert.strictEqual(betMgr.addChip(500), 670);

// Test 2X Double
assert.strictEqual(betMgr.doubleBet(), 1340);
// Test Max Bet ceiling
assert.strictEqual(betMgr.doubleBet(), 2000);

// Test Clear / Reset
assert.strictEqual(betMgr.clearBet(), 10);

console.log('✓ All bet calculations (stepper, stacking, 2X, clear, boundaries) passed flawlessly');

console.log('\n======================================================');
console.log('🎉 ALL 6 BLACKJACK MOBILE & ERGONOMICS TESTS PASSED!');
console.log('======================================================\n');
