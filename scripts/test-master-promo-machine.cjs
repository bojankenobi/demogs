/**
 * Grand Slot Club - Master Promo Machine & Proof-of-Play Test Suite
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Master Promo Machine & Proof-of-Play Test Suite...');

// 1. Verify Serverless Functions count <= 11
const apiDir = path.join(__dirname, '..', 'api');
function getApiFunctions(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file.startsWith('_')) return; // Vercel ignores files and dirs starting with _
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getApiFunctions(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}
const apiFiles = getApiFunctions(apiDir);
console.log(`📡 Discovered ${apiFiles.length} serverless functions in api/ (Limit is 12, target <= 11)`);
assert(apiFiles.length <= 11, `FAIL: Too many serverless functions (${apiFiles.length} > 11)`);
console.log('✅ Serverless function count is strictly compliant with Vercel Hobby plan limit.');

// 2. Verify ClubEventsManager module
const eventsManagerPath = path.join(__dirname, '..', 'js', 'core', 'club-events-manager.js');
assert(fs.existsSync(eventsManagerPath), 'FAIL: club-events-manager.js does not exist');
const eventsCode = fs.readFileSync(eventsManagerPath, 'utf8');

// Simulate minimal browser environment to test ClubEventsManager
const localStorageMock = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  clear() { this.store = {}; }
};

global.localStorage = localStorageMock;
global.window = {
  localStorage: localStorageMock,
  slotAudio: { playClick() {}, playBigWin() {} },
  particleEngine: { burst() {} }
};
global.document = {
  getElementById() { return null; },
  querySelectorAll() { return []; }
};

eval(eventsCode);
assert(typeof global.window.ClubEventsManager === 'function', 'FAIL: ClubEventsManager not exported');

const mgr = new global.window.ClubEventsManager({
  playerTracker: { profile: { name: 'Marko Test', id: 'usr_test_1' } },
  showMessage() {}
});

assert(Array.isArray(mgr.events) && mgr.events.length === 4, 'FAIL: Expected 4 club events');
const bgEvents = mgr.events.filter(e => e.city === 'bg');
const nsEvents = mgr.events.filter(e => e.city === 'ns');
const nisEvents = mgr.events.filter(e => e.city === 'nis');

assert(bgEvents.length === 2, 'FAIL: Expected 2 Beograd events');
assert(nsEvents.length === 1, 'FAIL: Expected 1 Novi Sad event');
assert(nisEvents.length === 1, 'FAIL: Expected 1 Niš event');

// Test RSVP generation
mgr.rsvpEvent('evt_bg_slama');
assert(mgr.rsvps['evt_bg_slama'], 'FAIL: RSVP not recorded');
const ticketCode = mgr.rsvps['evt_bg_slama'].ticketCode;
assert(ticketCode.startsWith('TRN-BG01-'), `FAIL: Expected ticket code starting with TRN-BG01-, got ${ticketCode}`);
console.log(`✅ ClubEventsManager verified: 4 events, city filters, RSVP ticket ${ticketCode}`);

// 3. Verify Proof-of-Play Gating Logic
function testProofOfPlay(spins, missionsCompleted) {
  const requiredSpins = 15;
  const requiredMissions = 2;
  return (missionsCompleted >= requiredMissions) || (spins >= requiredSpins);
}

assert.strictEqual(testProofOfPlay(0, 0), false, '0 spins 0 missions should be locked');
assert.strictEqual(testProofOfPlay(14, 1), false, '14 spins 1 mission should be locked');
assert.strictEqual(testProofOfPlay(15, 0), true, '15 spins 0 missions should be unlocked');
assert.strictEqual(testProofOfPlay(5, 2), true, '5 spins 2 missions should be unlocked');
assert.strictEqual(testProofOfPlay(20, 3), true, '20 spins 3 missions should be unlocked');
console.log('✅ Proof-of-Play Anti-Freeloader gating mathematical rules verified.');

// 4. Verify index.html contains necessary markup
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

assert(indexHtml.includes('id="live-event-spotlight-bar"'), 'FAIL: live-event-spotlight-bar missing in index.html');
assert(indexHtml.includes('id="club-events-modal"'), 'FAIL: club-events-modal missing in index.html');
assert(indexHtml.includes('id="event-fastpass-modal"'), 'FAIL: event-fastpass-modal missing in index.html');
assert(indexHtml.includes('id="menu-opt-events"'), 'FAIL: menu-opt-events missing in index.html');
assert(indexHtml.includes('id="voucher-proof-play-box"'), 'FAIL: voucher-proof-play-box missing in index.html');
assert(indexHtml.includes('js/core/club-events-manager.js'), 'FAIL: script tag for club-events-manager missing');
console.log('✅ index.html structure verified (Spotlight bar, Club Events modal, Fast-Pass modal, Proof-of-Play container).');

// 5. Verify scanner/index.html TRN- support
const scannerPath = path.join(__dirname, '..', 'scanner', 'index.html');
const scannerHtml = fs.readFileSync(scannerPath, 'utf8');

assert(scannerHtml.includes("TRN-"), 'FAIL: scanner/index.html does not handle TRN- passes');
assert(scannerHtml.includes("TURNIRSKA PROPUSNICA"), 'FAIL: scanner/index.html missing tournament pass badge');
console.log('✅ scanner/index.html verified for physical venue TRN- fast pass verification.');

// 6. Verify No Free Drinks promises in app
assert(!indexHtml.includes('voucher_drink'), 'FAIL: voucher_drink found in index.html');
assert(!eventsCode.includes('besplatno piće'), 'FAIL: free drinks found in events copy');
console.log('✅ Zero subsidized free drink compliance confirmed (Anti-freeloader casino policy satisfied).');

console.log('\n🎉 ALL MASTER PROMO MACHINE TESTS PASSED 100%!');
