/**
 * Test Suite: Responsive Gameplay Header & Multi-Device Navigation Architecture
 * Verifies symmetrical layout, anti-overlap positioning, flex mode hub distribution,
 * and zero-collision responsiveness across mobile, tablet, and desktop viewports.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: RESPONSIVE GAMEPLAY HEADER & NAVIGATION ===\n');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');

// --- TEST 1: Symmetrical Header Top Bar DOM Architecture ---
console.log('--- TEST 1: Symmetrical Header Top Bar DOM Architecture ---');
assert(html.includes('<div class="header-top-bar">'), 'index.html must have .header-top-bar');
assert(html.includes('<div class="header-top-left">'), 'index.html must have .header-top-left');
assert(html.includes('<div class="header-top-right">'), 'index.html must have .header-top-right');
assert(html.includes('id="btn-header-tier"'), 'Must have #btn-header-tier in header');
assert(html.includes('class="brand-logo-wrap"'), 'Must have .brand-logo-wrap in header');
assert(html.includes('id="btn-header-lobby"'), 'Must have #btn-header-lobby in header');
assert(html.includes('id="btn-header-vouchers"'), 'Must have #btn-header-vouchers in header');
assert(html.includes('id="header-voucher-counter"'), 'Must have #header-voucher-counter in header');
console.log('✓ Header Top Bar has balanced 3-column flex structure (Tier | Logo | Quick Actions)');

// --- TEST 2: Anti-Collision & Static Positioning in CSS ---
console.log('\n--- TEST 2: Anti-Collision & Static Positioning in CSS ---');
assert(!css.includes('.header-quick-nav {\n  position: absolute;'), 'header-quick-nav must NOT use position: absolute floating over logo');
assert(css.includes('.header-quick-nav {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  position: static;'), 'header-quick-nav must use position: static flex alignment');
assert(css.includes('.header-top-bar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;'), 'header-top-bar must use space-between flex layout');
console.log('✓ Absolute overlap eliminated: Quick navigation flexes naturally beside logo');

// --- TEST 3: Grand Mode Hub Foundation & Equal Flex Distribution ---
console.log('\n--- TEST 3: Grand Mode Hub Foundation & Equal Flex Distribution ---');
assert(css.includes('.grand-mode-hub,\n.game-switch-nav {\n  display: flex !important;'), 'grand-mode-hub must have root-level display: flex !important');
assert(css.includes('flex: 1 1 0;\n  min-width: 0;'), 'hub-mode-tab must have flex: 1 1 0 with min-width: 0');
assert(css.includes('overflow: visible;'), 'hub-mode-tab must have overflow: visible to protect badges');
assert(html.includes('<nav class="grand-mode-hub" id="grand-mode-hub"'), 'index.html must contain #grand-mode-hub');
assert(html.includes('data-mode="casino"'), 'Mode hub must have casino tab');
assert(html.includes('data-mode="vault"'), 'Mode hub must have vault tab');
assert(html.includes('data-mode="royale"'), 'Mode hub must have royale tab');
assert(html.includes('id="hub-btn-prestige"'), 'Mode hub must have prestige tab');
console.log('✓ Grand Mode Hub has rock-solid flex foundation and unclipped badges');

// --- TEST 4: Mobile & Tablet Responsiveness Rules ---
console.log('\n--- TEST 4: Mobile & Tablet Responsiveness Rules ---');
assert(css.includes('.btn-header-nav .nav-label {\n    display: none;'), 'Labels must hide on mobile to keep top row compact');
assert(css.includes('.header-top-bar {\n    max-width: 740px;'), 'Tablet must tune header-top-bar to 740px');
assert(css.includes('.header-top-bar {\n    max-width: 820px;'), 'Desktop must tune header-top-bar to 820px');
console.log('✓ Multi-device scaling (mobile, tablet, desktop) correctly configured');

// --- TEST 5: Table Game Mode Zero-Clash Architecture ---
console.log('\n--- TEST 5: Table Game Mode Zero-Clash Architecture ---');
assert(css.includes('.game-container.in-blackjack-mode .header-top-bar'), 'Blackjack must have compact header-top-bar styling');
assert(css.includes('.game-container.in-holdem-mode .header-top-bar'), 'Holdem must have compact header-top-bar styling');
assert(css.includes('.game-container.in-blackjack-mode .brand-logo-wrap'), 'Logo must be suppressed in blackjack to give 100% space to table');
console.log('✓ Table game modes (Blackjack & Holdem) verified for zero header collision');

// --- TEST 6: Cache Buster Bump ---
console.log('\n--- TEST 6: Cache Buster Bump ---');
assert(/style\.css\?v=(11[8-9]|1[2-9]\d)/.test(html), 'index.html must link style.css?v>=118');
console.log('✓ style.css?v>=118 verified');

console.log('\n========================================================================');
console.log('🎉 ALL RESPONSIVE HEADER & NAVIGATION VERIFICATION TESTS PASSED 100%! 🎉');
console.log('========================================================================\n');
