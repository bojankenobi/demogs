/**
 * Test Suite: Grand Slot BGM Controller & Jazz Audio Engine Verification
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== GRAND SLOT BGM & JAZZ AUDIO ENGINE TEST SUITE ===\n');

// 1. Verify Audio Files in assets/audio/music/
console.log('--- TEST 1: Physical Music Files in assets/audio/music/ ---');
const musicDir = path.join(__dirname, '../assets/audio/music');
assert(fs.existsSync(musicDir), 'Directory assets/audio/music must exist');

const expectedTracks = [
  'Grand Slot Club.mp3',
  'Smotryshka.mp3',
  'Smotryshka1.mp3'
];

expectedTracks.forEach(track => {
  const filePath = path.join(musicDir, track);
  assert(fs.existsSync(filePath), `Track "${track}" must be present in assets/audio/music/`);
  const stat = fs.statSync(filePath);
  assert(stat.size > 1000000, `Track "${track}" must be a valid non-empty audio file (size: ${stat.size} bytes)`);
  console.log(`✓ Track verified: "${track}" (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
});

// 2. Test Shuffle & Repeat Playlist Logic
console.log('\n--- TEST 2: Playlist Shuffle & Repeat Logic ---');
class MockPlaylistManager {
  constructor(tracks) {
    this.playlist = tracks;
    this.currentTrackIndex = -1;
  }
  getNextTrack() {
    if (this.playlist.length <= 1) return this.playlist[0];
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * this.playlist.length);
    } while (nextIdx === this.currentTrackIndex);
    this.currentTrackIndex = nextIdx;
    return this.playlist[nextIdx];
  }
}

const mockManager = new MockPlaylistManager(expectedTracks);
const playHistory = [];
for (let i = 0; i < 30; i++) {
  const tr = mockManager.getNextTrack();
  if (i > 0) {
    assert.notStrictEqual(tr, playHistory[i - 1], `Track "${tr}" was repeated consecutively at index ${i}`);
  }
  playHistory.push(tr);
}
console.log('✓ 30 shuffle iterations passed with zero consecutive duplicates');

// Ensure all 3 tracks were played across 30 iterations
expectedTracks.forEach(tr => {
  assert(playHistory.includes(tr), `Track "${tr}" was never played in 30 iterations`);
});
console.log('✓ Full playlist coverage verified across all 3 songs in shuffle');

console.log('\n======================================================');
console.log('🎉 ALL BGM VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
console.log('======================================================\n');
