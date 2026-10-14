/**
 * IGT - 3D Cylindrical Reel Engine & Multi-Game Logic
 * Supports:
 *  - 1-Line Classic Slot
 *  - Royal 3x3 Multi-Line Slot (5 Paylines with Golden Neon Vectors)
 */
const SYMBOLS = [
  { id: 'flower', name: 'Zlatni Cvet', svg: 'assets/symbols/logo-flower.svg', weight: 4, payout3: 100, payout2: 10 },
  { id: 'crown', name: 'Zlatna Kruna', svg: 'assets/symbols/crown.svg', weight: 5, payout3: 75, payout2: 8 },
  { id: 'bar', name: 'BAR', svg: 'assets/symbols/bar.svg', weight: 6, payout3: 40, payout2: 5 },
  { id: 'horseshoe', name: 'Srećna Potkovica', svg: 'assets/symbols/horseshoe.svg', weight: 8, payout3: 30, payout2: 4 },
  { id: 'seven', name: 'Zlatna 7', svg: 'assets/symbols/seven.svg', weight: 9, payout3: 25, payout2: 3 },
  { id: 'bell', name: 'Zvono', svg: 'assets/symbols/bell.svg', weight: 12, payout3: 15, payout2: 2 },
  { id: 'coin', name: 'Zlatnik', svg: 'assets/symbols/coin.svg', weight: 15, payout3: 10, payout2: 1.5 },
  { id: 'diamond', name: 'Dijamant', svg: 'assets/symbols/diamond.svg', weight: 10, payout3: 20, payout2: 2 }
];

// 5 Fixed Paylines for 3x3 Slot Game:
// Matrix row indices: 0 = Top, 1 = Center, 2 = Bottom across Reels 0, 1, 2
const PAYLINES_3X3 = [
  { id: 1, name: 'Linija 1 (Vrh)', rows: [0, 0, 0] },
  { id: 2, name: 'Linija 2 (Sredina)', rows: [1, 1, 1] },
  { id: 3, name: 'Linija 3 (Dno)', rows: [2, 2, 2] },
  { id: 4, name: 'Linija 4 (Dijagonala \)', rows: [0, 1, 2] },
  { id: 5, name: 'Linija 5 (Dijagonala /)', rows: [2, 1, 0] }
];

class SlotGame3D {
  constructor() {
    this.gameMode = 'classic'; // 'classic' (1-line) | 'royal3x3' (5-line)
    this.balance = 1000;
    this.bet = 20;
    this.minBet = 5;
    this.maxBet = 100;
    this.lastWin = 0;
    this.isSpinning = false;
    this.isAutoSpin = false;
    this.freeSpins = 0;
    this.happyHourMultiplier = 1;

    // Reel Geometry
    this.tileHeight = 72; // Height of each symbol tile in px

    // DOM Elements
    this.assemblyWrap = document.querySelector('.slot-assembly-wrap');
    this.drumElements = [
      document.getElementById('reel-drum-1'),
      document.getElementById('reel-drum-2'),
      document.getElementById('reel-drum-3')
    ];
    this.viewport3 = document.getElementById('viewport-3');
    this.paylinesOverlay = document.getElementById('paylines-overlay');
    this.leverEl = document.getElementById('slot-lever');
    this.spinBtn = document.getElementById('spin-btn');
    this.autoBtn = document.getElementById('auto-btn');
    this.gambleBtn = document.getElementById('gamble-btn');
    this.balanceEl = document.getElementById('val-balance');
    this.betEl = document.getElementById('val-bet');
    this.winEl = document.getElementById('val-win');
    this.messageBanner = document.getElementById('status-banner');

    // Progressive Jackpots State: Silver, Gold, Diamond
    this.jackpotSilver = 1250;
    this.jackpotGold = 5800;
    this.jackpotDiamond = 25400;
    this.jpSilverEl = document.getElementById('val-jp-silver');
    this.jpGoldEl = document.getElementById('val-jp-gold');
    this.jpDiamondEl = document.getElementById('val-jp-diamond');

    // Gamble State
    this.gambleAmount = 0;
    this.gambleHistory = ['red', 'black', 'red'];
    this.isGambling = false;

    // Hold & Win State
    this.holdWinActive = false;
    this.holdWinRespinsLeft = 3;
    this.holdWinTiles = new Array(9).fill(null);
    this.holdWinTotal = 0;

    // Current visible 3 rows for each reel [top, center, bottom]
    this.currentSymbols = [
      { top: SYMBOLS[2], center: SYMBOLS[0], bottom: SYMBOLS[1] },
      { top: SYMBOLS[2], center: SYMBOLS[0], bottom: SYMBOLS[1] },
      { top: SYMBOLS[2], center: SYMBOLS[0], bottom: SYMBOLS[1] }
    ];

    this.initReels();
    this.initGambleModal();
    this.initHoldWinModal();
    this.initProgressiveJackpots();
    this.updateUI();
  }

  // Switch between 1-Line Classic, Royal 3x3, and Royal 3x3 Full Focus
  setGameMode(mode) {
    if (this.isSpinning) return;
    this.gameMode = mode;
    this.clearPaylines();

    const is3x3 = (mode === 'royal3x3' || mode === 'fullfocus');
    const isFullFocus = (mode === 'fullfocus');

    if (this.assemblyWrap) {
      this.assemblyWrap.classList.toggle('game-mode-3x3', mode === 'royal3x3');
      this.assemblyWrap.classList.toggle('game-mode-fullfocus', isFullFocus);
    }
    const stageArea = document.querySelector('.stage-area');
    if (stageArea) {
      stageArea.classList.toggle('has-3x3', is3x3);
      stageArea.classList.toggle('has-fullfocus', isFullFocus);
    }

    // Update active state on tab buttons (if present)
    document.querySelectorAll('.game-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.game === mode);
    });

    // Update EGT-style modal selection and bottom bar button label
    const egtLabel = document.getElementById('egt-current-game-label');
    if (egtLabel) {
      if (mode === 'fullfocus') {
        egtLabel.textContent = '3x3 FULL FOCUS';
      } else if (mode === 'royal3x3') {
        egtLabel.textContent = 'ROYAL 3x3';
      } else {
        egtLabel.textContent = '1-LINE CLASSIC';
      }
    }

    const optClassic = document.getElementById('egt-opt-classic');
    const optRoyal = document.getElementById('egt-opt-royal');
    const optFullFocus = document.getElementById('egt-opt-fullfocus');
    if (optClassic) {
      optClassic.classList.toggle('active', mode === 'classic');
      const tag = optClassic.querySelector('.egt-box-select-tag');
      if (tag) tag.textContent = (mode === 'classic') ? 'AKTIVNA' : 'IZABERI';
    }
    if (optRoyal) {
      optRoyal.classList.toggle('active', mode === 'royal3x3');
      const tag = optRoyal.querySelector('.egt-box-select-tag');
      if (tag) tag.textContent = (mode === 'royal3x3') ? 'AKTIVNA' : 'IZABERI';
    }
    if (optFullFocus) {
      optFullFocus.classList.toggle('active', mode === 'fullfocus');
      const tag = optFullFocus.querySelector('.egt-box-select-tag');
      if (tag) tag.textContent = (mode === 'fullfocus') ? 'AKTIVNA' : 'IZABERI';
    }

    let modeName = '';
    if (mode === 'fullfocus') {
      modeName = window.i18n ? window.i18n.t('gameFullFocus') : 'ROYAL 3x3 FULL FOCUS';
    } else if (mode === 'royal3x3') {
      modeName = window.i18n ? window.i18n.t('gameRoyal3x3') : 'ROYAL 3x3 (5 LINIJA)';
    } else {
      modeName = window.i18n ? window.i18n.t('gameClassic') : '1-LINIJA CLASSIC';
    }

    this.showMessage(window.i18n ? window.i18n.t('gameModeChanged', { game: modeName }) : `IGRA: ${modeName}`, 'gold');
    this.initReels();
  }

  getRandomSymbol() {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of SYMBOLS) {
      if (rand < sym.weight) return sym;
      rand -= sym.weight;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  // Initialize reel strips with 3 visible rows (Top, Center, Bottom)
  initReels() {
    const is3x3 = (this.gameMode === 'royal3x3' || this.gameMode === 'fullfocus');
    // In 3x3 mode with 230px drum height and 3x72px=216px tiles, 
    // centering is at (230 - 216)/2 - 0 = +7px for index 0, so index 1 is at 7 - 72 = -65px.
    const restingY = is3x3 ? 7 : -36;

    for (let r = 0; r < 3; r++) {
      const drum = this.drumElements[r];
      if (!drum) continue;
      const s = this.currentSymbols[r];

      drum.innerHTML = `
        <div class="reel-tile" data-idx="0" data-row="top">
          <img src="${s.top.svg}" alt="${s.top.name}" class="symbol-img" />
        </div>
        <div class="reel-tile" data-idx="1" data-row="center">
          <img src="${s.center.svg}" alt="${s.center.name}" class="symbol-img" />
        </div>
        <div class="reel-tile" data-idx="2" data-row="bottom">
          <img src="${s.bottom.svg}" alt="${s.bottom.name}" class="symbol-img" />
        </div>
      `;

      drum.style.transition = 'none';
      drum.style.transform = `translateY(${restingY}px)`;
    }
  }

  // Clear payline highlights and SVG lines
  clearPaylines() {
    if (this.paylinesOverlay) {
      this.paylinesOverlay.innerHTML = '';
    }
    document.querySelectorAll('.reel-tile').forEach(t => {
      t.classList.remove('win-center', 'win-line');
    });
    if (this.viewport3) {
      this.viewport3.classList.remove('near-miss-active');
    }
  }

  showGambleTrigger(amount) {
    if (amount <= 0 || this.freeSpins > 0 || this.isAutoSpin) return;
    this.gambleAmount = amount;
    if (this.gambleBtn) {
      this.gambleBtn.style.display = 'inline-flex';
      this.gambleBtn.textContent = window.i18n ? window.i18n.t('gamble') : '🃏 DUPLANJE';
    }
  }

  hideGambleTrigger() {
    if (this.gambleBtn) {
      this.gambleBtn.style.display = 'none';
    }
  }

  // Draw Neon SVG lines connecting matching symbols across the 3 reels
  drawPaylines(winningLines) {
    if (!this.paylinesOverlay || !winningLines || winningLines.length === 0) return;

    // Reel column center X coords inside 304px drum:
    // 3 columns separated by 2px grooves: col0: 0..100 (cx=50), col1: 102..202 (cx=152), col2: 204..304 (cx=254)
    const colX = [50, 152, 254];
    // Row Y center coords inside 230px drum with 7px top offset + 72px tile:
    // row 0: 7 + 36 = 43px
    // row 1: 7 + 72 + 36 = 115px
    // row 2: 7 + 144 + 36 = 187px
    const rowY = [43, 115, 187];

    let svgHtml = '';
    winningLines.forEach((line) => {
      const p0 = `${colX[0]},${rowY[line.rows[0]]}`;
      const p1 = `${colX[1]},${rowY[line.rows[1]]}`;
      const p2 = `${colX[2]},${rowY[line.rows[2]]}`;
      svgHtml += `<polyline points="${p0} ${p1} ${p2}" class="payline-svg-path" />`;

      // Highlight corresponding reel-tile elements
      for (let r = 0; r < 3; r++) {
        const rowIdx = line.rows[r];
        const drum = this.drumElements[r];
        if (drum) {
          const tile = drum.querySelector(`.reel-tile[data-idx="${rowIdx}"]`);
          if (tile) tile.classList.add('win-line');
        }
      }
    });

    this.paylinesOverlay.innerHTML = svgHtml;
  }

  // REAL CASINO PHYSICAL REEL SPIN EXECUTION
  spin() {
    if (this.isSpinning || this.holdWinActive) return;
    if (this.freeSpins <= 0 && this.balance < this.bet) {
      this.showMessage(window.i18n ? window.i18n.t('notEnoughCredits') : 'NEMATE DOVOLJNO KREDITA!', 'warning');
      window.slotAudio.playClick();
      return;
    }

    if (this.freeSpins > 0) {
      this.freeSpins--;
      const msg = window.i18n ? `${window.i18n.t('freeSpinRemaining')}${this.freeSpins}` : `BESPLATAN SPIN! (Preostalo: ${this.freeSpins})`;
      this.showMessage(msg, 'gold');
    } else {
      this.balance -= this.bet;
      this.showMessage(window.i18n ? window.i18n.t('spinning') : 'VRTENJE U TOKU...', 'normal');
    }

    this.isSpinning = true;
    this.lastWin = 0;
    this.hideGambleTrigger();
    this.incrementJackpotsOnSpin();
    this.updateUI();
    this.clearPaylines();

    // Button flash & lever animation
    if (this.spinBtn) {
      this.spinBtn.classList.remove('flash-active');
      void this.spinBtn.offsetWidth;
      this.spinBtn.classList.add('flash-active');
      setTimeout(() => {
        if (this.spinBtn) this.spinBtn.classList.remove('flash-active');
      }, 420);
    }

    if (this.leverEl) {
      this.leverEl.classList.add('pulled');
      setTimeout(() => this.leverEl.classList.remove('pulled'), 400);
    }

    window.slotAudio.playLever();
    window.slotAudio.startSpinningSound();

    // Select target 3x3 matrix:
    const targetMatrix = [
      { top: this.getRandomSymbol(), center: this.getRandomSymbol(), bottom: this.getRandomSymbol() },
      { top: this.getRandomSymbol(), center: this.getRandomSymbol(), bottom: this.getRandomSymbol() },
      { top: this.getRandomSymbol(), center: this.getRandomSymbol(), bottom: this.getRandomSymbol() }
    ];

    // Near-Miss Tension Check on Reels 1 & 2
    const r0Center = targetMatrix[0].center;
    const r1Center = targetMatrix[1].center;
    const isBigJackpotCombo = (r0Center.id === r1Center.id && ['flower', 'crown', 'seven', 'bar'].includes(r0Center.id));
    const coinCountFirstTwo = [targetMatrix[0].top, targetMatrix[0].center, targetMatrix[0].bottom,
                               targetMatrix[1].top, targetMatrix[1].center, targetMatrix[1].bottom].filter(s => s.id === 'coin').length;
    const isNearMiss = isBigJackpotCombo || (coinCountFirstTwo >= 2);

    const is3x3 = (this.gameMode === 'royal3x3' || this.gameMode === 'fullfocus');
    const restingY = is3x3 ? 7 : -36;
    const reel3Duration = isNearMiss ? 3.4 : 2.15;
    const durations = [1.1, 1.5, reel3Duration];
    const tileCounts = [20, 26, isNearMiss ? 46 : 32];

    for (let r = 0; r < 3; r++) {
      const drum = this.drumElements[r];
      const res = targetMatrix[r];
      const count = tileCounts[r];

      const stripTiles = new Array(count);
      stripTiles[0] = res.top;
      stripTiles[1] = res.center;
      stripTiles[2] = res.bottom;

      for (let i = 3; i < count - 3; i++) {
        stripTiles[i] = this.getRandomSymbol();
      }

      stripTiles[count - 3] = this.currentSymbols[r].top;
      stripTiles[count - 2] = this.currentSymbols[r].center;
      stripTiles[count - 1] = this.currentSymbols[r].bottom;

      drum.innerHTML = stripTiles.map((sym, idx) => `
        <div class="reel-tile" data-idx="${idx}">
          <img src="${sym.svg}" alt="${sym.name}" class="symbol-img" />
        </div>
      `).join('');

      // Set initial position: aligned with starting visible symbols (indices count-3, count-2, count-1)
      const startY = restingY - (count - 3) * this.tileHeight;
      drum.style.transition = 'none';
      drum.style.transform = `translateY(${startY}px)`;
      void drum.offsetWidth; // Force layout reflow

      // Phase 1: Mechanical Anticipation - quick 18px pull-up
      const kickY = startY - 18;
      drum.style.transition = 'transform 0.11s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      drum.style.transform = `translateY(${kickY}px)`;

      const dur = durations[r];
      const targetY = restingY;
      const overshootY = targetY + 14; // Overshoot downward for physical bounce

      setTimeout(() => {
        drum.classList.add('spinning');

        // Heartbeat tension sound on near-miss reel 3
        if (r === 2 && isNearMiss) {
          if (this.viewport3) this.viewport3.classList.add('near-miss-active');
          try {
            if (window.slotAudio.playNearMissTension) {
              window.slotAudio.playNearMissTension();
            } else if (window.slotAudio.playNearMissRiser) {
              window.slotAudio.playNearMissRiser(reel3Duration);
            }
          } catch (e) {
            console.warn('Audio playNearMiss error:', e);
          }

          setTimeout(() => {
            try {
              if (window.slotAudio.playHeartbeat) window.slotAudio.playHeartbeat();
              setTimeout(() => {
                try { if (window.slotAudio.playHeartbeat) window.slotAudio.playHeartbeat(); } catch (e) {}
              }, 1100);
            } catch (e) {}
          }, 1650);
        }

        // Smooth physics curve: explosive downward roll -> high speed stream -> graceful deceleration
        drum.style.transition = `transform ${dur}s cubic-bezier(0.12, 0.78, 0.28, 1.0)`;
        drum.style.transform = `translateY(${overshootY}px)`;

        // Phase 3: Landing recoil bounce & clunk audio
        setTimeout(() => {
          drum.classList.remove('spinning');
          try {
            window.slotAudio.playReelStop(r);
          } catch (e) {}

          // Spring bounce back into exact locked target
          drum.style.transition = 'transform 0.14s cubic-bezier(0.175, 0.885, 0.32, 1.45)';
          drum.style.transform = `translateY(${targetY}px)`;
          this.currentSymbols[r] = res;

          // Normalize reel DOM after spring animation finishes (150ms)
          setTimeout(() => {
            drum.innerHTML = `
              <div class="reel-tile" data-idx="0" data-row="top">
                <img src="${res.top.svg}" alt="${res.top.name}" class="symbol-img" />
              </div>
              <div class="reel-tile" data-idx="1" data-row="center">
                <img src="${res.center.svg}" alt="${res.center.name}" class="symbol-img" />
              </div>
              <div class="reel-tile" data-idx="2" data-row="bottom">
                <img src="${res.bottom.svg}" alt="${res.bottom.name}" class="symbol-img" />
              </div>
            `;
            drum.style.transition = 'none';
            drum.style.transform = `translateY(${restingY}px)`;
          }, 150);

          // When last reel stops, evaluate results
          if (r === 2) {
            if (this.viewport3) this.viewport3.classList.remove('near-miss-active');
            try {
              window.slotAudio.stopSpinningSound();
            } catch (e) {}

            setTimeout(() => {
              try {
                // Check for Hold & Win triggering (3 or more coins across the 9 tiles)
                let totalCoins = 0;
                for (let c = 0; c < 3; c++) {
                  if (targetMatrix[c].top.id === 'coin') totalCoins++;
                  if (targetMatrix[c].center.id === 'coin') totalCoins++;
                  if (targetMatrix[c].bottom.id === 'coin') totalCoins++;
                }

                if (totalCoins >= 3) {
                  this.triggerHoldAndWin(targetMatrix);
                } else if (this.gameMode === 'royal3x3' || this.gameMode === 'fullfocus') {
                  this.evaluateResults3x3(targetMatrix);
                } else {
                  this.evaluateResultsClassic([targetMatrix[0].center, targetMatrix[1].center, targetMatrix[2].center]);
                }
              } catch (err) {
                console.error('Error evaluating spin results:', err);
                this.isSpinning = false;
                this.updateUI();
              }
            }, 220);
          }
        }, dur * 1000);
      }, 110);
    }

    // Safety fallback to guarantee spinning sound stops and state doesn't freeze
    const maxSpinTime = (Math.max(...durations) + 1.2) * 1000;
    setTimeout(() => {
      try {
        window.slotAudio.stopSpinningSound();
      } catch (e) {}
      if (this.viewport3) this.viewport3.classList.remove('near-miss-active');
      if (this.isSpinning) {
        console.warn('Spin safety timeout triggered. Resetting isSpinning to false.');
        this.isSpinning = false;
        this.updateUI();
      }
    }, maxSpinTime);
  }

  // Evaluate 1-Line Classic Slot
  evaluateResultsClassic(results) {
    this.isSpinning = false;
    const [s1, s2, s3] = results;
    let winMultiplier = 0;
    let winType = '';
    let winningReels = [];

    // 3 of a kind
    if (s1.id === s2.id && s2.id === s3.id) {
      winMultiplier = s1.payout3;
      winType = window.i18n ? window.i18n.t(`combo_${s1.id}_3x`) : `3x ${s1.name.toUpperCase()}!`;
      winningReels = [0, 1, 2];
    }
    // 2 of a kind
    else if (s1.id === s2.id) {
      winMultiplier = s1.payout2;
      winType = window.i18n ? window.i18n.t(`combo_${s1.id}_2x`) : `2x ${s1.name.toUpperCase()}!`;
      winningReels = [0, 1];
    } else if (s2.id === s3.id) {
      winMultiplier = s2.payout2;
      winType = window.i18n ? window.i18n.t(`combo_${s2.id}_2x`) : `2x ${s2.name.toUpperCase()}!`;
      winningReels = [1, 2];
    } else if (s1.id === s3.id) {
      winMultiplier = s1.payout2;
      winType = window.i18n ? window.i18n.t(`combo_${s1.id}_2x`) : `2x ${s1.name.toUpperCase()}!`;
      winningReels = [0, 2];
    }
    // Any Flower + BAR combo
    else if (
      (s1.id === 'bar' || s1.id === 'flower') &&
      (s2.id === 'bar' || s2.id === 'flower') &&
      (s3.id === 'bar' || s3.id === 'flower')
    ) {
      winMultiplier = 5;
      winType = window.i18n ? window.i18n.t('combo_flower_bar') : 'CVET & BAR KOMBO!';
      winningReels = [0, 1, 2];
    }

    const diamondCount = [s1, s2, s3].filter(s => s.id === 'diamond').length;
    const isDiamondBonus = (diamondCount === 3);
    if (isDiamondBonus) {
      this.freeSpins += 5;
    }

    if (winMultiplier > 0) {
      const totalWin = Math.round(this.bet * winMultiplier * this.happyHourMultiplier);
      this.balance += totalWin;
      this.lastWin = totalWin;

      if (isDiamondBonus) {
        const msg = window.i18n 
          ? window.i18n.t('freeSpinsPlusWin', { amount: totalWin }) 
          : `💎 5 BESPLATNIH SPINOVA + ${totalWin}! 💎`;
        this.showMessage(msg, 'jackpot');
        window.slotAudio.playJackpot();
        if (window.particleEngine) window.particleEngine.spawnCelebration(true);
      } else {
        const isJackpot = winMultiplier >= 40 || s1.id === 'flower' || s1.id === 'crown';
        if (isJackpot) {
          this.showMessage(`${window.i18n ? window.i18n.t('bigWin') : '🎰 VELIKI DOBITAK! +'}${totalWin} 🎰`, 'jackpot');
          window.slotAudio.playJackpot();
          if (window.particleEngine) window.particleEngine.spawnCelebration(true);
        } else {
          const prefix = window.i18n ? window.i18n.t('winPrefix') : 'DOBITAK: +';
          this.showMessage(`${prefix}${totalWin} (${winType})`, 'win');
          window.slotAudio.playWin();
          if (window.particleEngine) window.particleEngine.spawnCelebration(false);
        }
      }

      // Highlight winning center tiles
      winningReels.forEach(r => {
        const drum = this.drumElements[r];
        if (drum) {
          const winTile = drum.querySelector('.reel-tile[data-idx="1"]');
          if (winTile) winTile.classList.add('win-center');
        }
      });

      this.showGambleTrigger(totalWin);
    } else {
      if (this.freeSpins <= 0) {
        this.showMessage(window.i18n ? window.i18n.t('tryAgain') : 'POKUŠAJTE PONOVO!', 'normal');
      }
    }

    this.postEvaluation();
  }

  // Evaluate 5 Paylines for Royal 3x3 Slot Game
  evaluateResults3x3(matrix) {
    this.isSpinning = false;
    let totalWinMultiplier = 0;
    const winningLines = [];
    let diamondCount = 0;

    // Check all 9 symbols for diamond bonus count
    for (let r = 0; r < 3; r++) {
      ['top', 'center', 'bottom'].forEach(row => {
        if (matrix[r][row].id === 'diamond') diamondCount++;
      });
    }

    // Evaluate each of the 5 paylines
    PAYLINES_3X3.forEach(line => {
      const s0 = line.rows[0] === 0 ? matrix[0].top : (line.rows[0] === 1 ? matrix[0].center : matrix[0].bottom);
      const s1 = line.rows[1] === 0 ? matrix[1].top : (line.rows[1] === 1 ? matrix[1].center : matrix[1].bottom);
      const s2 = line.rows[2] === 0 ? matrix[2].top : (line.rows[2] === 1 ? matrix[2].center : matrix[2].bottom);

      let lineMult = 0;
      // 3 of a kind on this line
      if (s0.id === s1.id && s1.id === s2.id) {
        lineMult = s0.payout3;
      }
      // 2 of a kind (first 2 match)
      else if (s0.id === s1.id) {
        lineMult = s0.payout2;
      }

      if (lineMult > 0) {
        totalWinMultiplier += lineMult;
        winningLines.push(line);
      }
    });

    const isDiamondBonus = (diamondCount >= 3);
    if (isDiamondBonus) {
      this.freeSpins += 5;
    }

    if (totalWinMultiplier > 0) {
      // Divide base bet among the 5 paylines, minimum payout proportional
      const lineBet = Math.max(1, Math.round(this.bet / 5));
      const totalWin = Math.round(lineBet * totalWinMultiplier * this.happyHourMultiplier);
      this.balance += totalWin;
      this.lastWin = totalWin;

      this.drawPaylines(winningLines);

      if (isDiamondBonus) {
        const msg = window.i18n 
          ? window.i18n.t('freeSpinsPlusWin', { amount: totalWin }) 
          : `💎 5 BESPLATNIH SPINOVA + ${totalWin}! 💎`;
        this.showMessage(msg, 'jackpot');
        window.slotAudio.playJackpot();
        if (window.particleEngine) window.particleEngine.spawnCelebration(true);
      } else {
        const isBigWin = totalWinMultiplier >= 30;
        if (isBigWin) {
          this.showMessage(`${window.i18n ? window.i18n.t('bigWin') : '🎰 VELIKI DOBITAK! +'}${totalWin} 🎰`, 'jackpot');
          window.slotAudio.playJackpot();
          if (window.particleEngine) window.particleEngine.spawnCelebration(true);
        } else {
          const linesTxt = window.i18n 
            ? window.i18n.t('linesWin', { lines: winningLines.length }) 
            : `${winningLines.length} DOBITNIH LINIJA!`;
          const prefix = window.i18n ? window.i18n.t('winPrefix') : 'DOBITAK: +';
          this.showMessage(`${prefix}${totalWin} (${linesTxt})`, 'win');
          window.slotAudio.playWin();
          if (window.particleEngine) window.particleEngine.spawnCelebration(false);
        }
      }

      this.showGambleTrigger(totalWin);
    } else {
      if (this.freeSpins <= 0) {
        this.showMessage(window.i18n ? window.i18n.t('tryAgain') : 'POKUŠAJTE PONOVO!', 'normal');
      }
    }

    this.postEvaluation();
  }

  postEvaluation() {
    this.updateUI();

    // Check progressive mystery jackpot chance on completed spin
    this.checkMysteryJackpot();

    // Auto spin handling
    if (this.isAutoSpin) {
      if (this.balance >= this.bet || this.freeSpins > 0) {
        setTimeout(() => {
          if (this.isAutoSpin) this.spin();
        }, 1300);
      } else {
        this.toggleAutoSpin(false);
      }
    }
  }

  showMessage(msg, type = 'normal') {
    if (!this.messageBanner) return;
    this.messageBanner.textContent = msg;
    this.messageBanner.className = `status-banner status-${type}`;
  }

  changeBet(delta) {
    if (this.isSpinning) return;
    window.slotAudio.playClick();
    this.bet = Math.max(this.minBet, Math.min(this.maxBet, this.bet + delta));
    this.updateUI();
  }

  setMaxBet() {
    if (this.isSpinning) return;
    window.slotAudio.playClick();
    this.bet = this.maxBet;
    this.updateUI();
  }

  toggleAutoSpin(forcedState = null) {
    window.slotAudio.playClick();
    this.isAutoSpin = (forcedState !== null) ? forcedState : !this.isAutoSpin;
    if (this.autoBtn) {
      this.autoBtn.classList.toggle('active', this.isAutoSpin);
      const label = this.isAutoSpin 
        ? (window.i18n ? window.i18n.t('autoSpinOn') : 'STOP') 
        : (window.i18n ? window.i18n.t('autoSpin') : 'AUTO');
      this.autoBtn.textContent = label;
    }
    if (this.isAutoSpin && !this.isSpinning) {
      this.spin();
    }
  }

  addCredits(amount = 500) {
    window.slotAudio.playCoinDrop();
    this.balance += amount;
    this.showMessage(window.i18n ? window.i18n.t('creditsAdded', { amount }) : `DODATO +${amount} KREDITA!`, 'gold');
    this.updateUI();
  }

  onLanguageChanged() {
    if (!this.isSpinning && this.lastWin === 0) {
      this.showMessage(window.i18n ? window.i18n.t('ready') : 'SPREMNI ZA IGRU!', 'normal');
    }
    if (this.autoBtn) {
      const label = this.isAutoSpin 
        ? (window.i18n ? window.i18n.t('autoSpinOn') : 'STOP') 
        : (window.i18n ? window.i18n.t('autoSpin') : 'AUTO');
      this.autoBtn.textContent = label;
    }
    this.updateUI();
  }

  // ==========================================================
  // RED / BLACK GAMBLE (DUPLANJE) ENGINE
  // ==========================================================
  initGambleModal() {
    this.gambleModal = document.getElementById('gamble-modal');
    this.closeGambleBtn = document.getElementById('close-gamble');
    this.gambleRedBtn = document.getElementById('gamble-red-btn');
    this.gambleBlackBtn = document.getElementById('gamble-black-btn');
    this.gambleTakeBtn = document.getElementById('gamble-take-btn');
    this.gambleHistoryEl = document.getElementById('gamble-history');
    this.gambleCurrentEl = document.getElementById('gamble-current-val');
    this.gambleNextEl = document.getElementById('gamble-next-val');
    this.flipCardInner = document.getElementById('flip-card-inner');
    this.cardFrontSide = document.getElementById('card-front-side');
    this.cardRankTl = document.getElementById('card-rank-tl');
    this.cardSuitTl = document.getElementById('card-suit-tl');
    this.cardCenterSuit = document.getElementById('card-center-suit');
    this.cardRankBr = document.getElementById('card-rank-br');
    this.cardSuitBr = document.getElementById('card-suit-br');

    if (this.gambleBtn) {
      this.gambleBtn.addEventListener('click', () => this.openGambleModal());
    }
    if (this.closeGambleBtn) {
      this.closeGambleBtn.addEventListener('click', () => this.closeGambleModal());
    }
    if (this.gambleTakeBtn) {
      this.gambleTakeBtn.addEventListener('click', () => this.closeGambleModal());
    }
    if (this.gambleRedBtn) {
      this.gambleRedBtn.addEventListener('click', () => this.makeGambleChoice('red'));
    }
    if (this.gambleBlackBtn) {
      this.gambleBlackBtn.addEventListener('click', () => this.makeGambleChoice('black'));
    }
  }

  showGambleTrigger(amount) {
    this.gambleAmount = amount;
    if (this.gambleBtn) {
      this.gambleBtn.classList.remove('is-dimmed');
      this.gambleBtn.classList.add('gamble-highlight-pulse');
    }
  }

  hideGambleTrigger() {
    if (this.gambleBtn) {
      this.gambleBtn.classList.remove('gamble-highlight-pulse');
      this.gambleBtn.classList.add('is-dimmed');
    }
  }

  openGambleModal() {
    if (this.isSpinning) return;
    
    // If no recent win, allow gambling using current bet (if player has enough balance) or last win
    if (this.gambleAmount <= 0) {
      if (this.lastWin > 0) {
        this.gambleAmount = this.lastWin;
      } else {
        const betStake = Math.min(this.bet, this.balance > 0 ? this.balance : this.bet);
        if (this.balance < betStake) {
          this.showMessage(window.i18n ? window.i18n.t('notEnoughCredits') : 'NEMATE DOVOLJNO KREDITA!', 'warning');
          return;
        }
        // Deduct bet stake to gamble
        this.balance -= betStake;
        this.gambleAmount = betStake;
        this.updateUI();
      }
    }

    this.isGambling = true;
    window.slotAudio.playClick();
    this.updateGambleUI();
    this.renderGambleHistory();
    if (this.flipCardInner) {
      this.flipCardInner.classList.remove('is-flipped');
      this.flipCardInner.classList.add('shuffling');
    }
    if (this.gambleModal) this.gambleModal.classList.add('active');
  }

  closeGambleModal() {
    this.isGambling = false;
    this.hideGambleTrigger();
    if (this.gambleModal) this.gambleModal.classList.remove('active');
    this.updateUI();
  }

  updateGambleUI() {
    if (this.gambleCurrentEl) this.gambleCurrentEl.textContent = this.gambleAmount.toLocaleString();
    if (this.gambleNextEl) this.gambleNextEl.textContent = (this.gambleAmount * 2).toLocaleString();
  }

  renderGambleHistory() {
    if (!this.gambleHistoryEl) return;
    this.gambleHistoryEl.innerHTML = this.gambleHistory.slice(-5).map(color => {
      const suit = color === 'red' ? '♥' : '♠';
      return `<div class="history-card-mini ${color}">${suit}</div>`;
    }).join('');
  }

  makeGambleChoice(chosenColor) {
    if (!this.isGambling || this.gambleAmount <= 0) return;

    window.slotAudio.playCardFlip();
    if (this.gambleRedBtn) this.gambleRedBtn.disabled = true;
    if (this.gambleBlackBtn) this.gambleBlackBtn.disabled = true;
    if (this.gambleTakeBtn) this.gambleTakeBtn.disabled = true;

    // Pick random card
    const isRed = Math.random() < 0.5;
    const cardColor = isRed ? 'red' : 'black';
    const suits = isRed ? ['♥', '♦'] : ['♠', '♣'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const ranks = ['A', 'K', 'Q', 'J', '10'];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];

    // Update card face DOM
    if (this.cardFrontSide) {
      this.cardFrontSide.classList.toggle('is-black', !isRed);
    }
    if (this.cardRankTl) this.cardRankTl.textContent = rank;
    if (this.cardSuitTl) this.cardSuitTl.textContent = suit;
    if (this.cardCenterSuit) this.cardCenterSuit.textContent = suit;
    if (this.cardRankBr) this.cardRankBr.textContent = rank;
    if (this.cardSuitBr) this.cardSuitBr.textContent = suit;

    if (this.flipCardInner) {
      this.flipCardInner.classList.remove('shuffling');
      this.flipCardInner.classList.add('is-flipped');
    }

    setTimeout(() => {
      this.gambleHistory.push(cardColor);
      this.renderGambleHistory();

      if (chosenColor === cardColor) {
        // WIN (Double up!)
        const winDelta = this.gambleAmount;
        this.gambleAmount *= 2;
        this.balance += winDelta;
        this.lastWin = this.gambleAmount;
        this.updateGambleUI();
        this.updateUI();

        window.slotAudio.playGambleWin();
        if (window.particleEngine) window.particleEngine.spawnCelebration(false);
        this.showMessage(window.i18n ? window.i18n.t('gambleWon', { amount: this.gambleAmount }) : `🎉 DUPLIRANO: ${this.gambleAmount}!`, 'jackpot');

        // Reset flip card for next double
        setTimeout(() => {
          if (this.flipCardInner) {
            this.flipCardInner.classList.remove('is-flipped');
            this.flipCardInner.classList.add('shuffling');
          }
          if (this.gambleRedBtn) this.gambleRedBtn.disabled = false;
          if (this.gambleBlackBtn) this.gambleBlackBtn.disabled = false;
          if (this.gambleTakeBtn) this.gambleTakeBtn.disabled = false;
        }, 900);
      } else {
        // LOSE (Bust)
        this.balance = Math.max(0, this.balance - this.gambleAmount);
        this.lastWin = 0;
        this.gambleAmount = 0;
        this.updateUI();

        window.slotAudio.playGambleLose();
        this.showMessage(window.i18n ? window.i18n.t('gambleLost') : '❌ VIŠE SREĆE DRUGI PUT!', 'normal');

        setTimeout(() => {
          this.closeGambleModal();
          if (this.gambleRedBtn) this.gambleRedBtn.disabled = false;
          if (this.gambleBlackBtn) this.gambleBlackBtn.disabled = false;
          if (this.gambleTakeBtn) this.gambleTakeBtn.disabled = false;
        }, 1200);
      }
    }, 600);
  }

  // ==========================================================
  // HOLD & WIN ("IGT RESPINS") BONUS ENGINE
  // ==========================================================
  initHoldWinModal() {
    this.holdWinModal = document.getElementById('holdwin-modal');
    this.holdWinGrid = document.getElementById('hold-win-grid');
    this.hwSpinBtn = document.getElementById('hw-spin-btn');
    this.hwTotalEl = document.getElementById('hw-total-amount');
    this.respinsPips = document.getElementById('respins-pips');
    this.jSilverVal = document.getElementById('j-silver-val');
    this.jGoldVal = document.getElementById('j-gold-val');
    this.jDiamondVal = document.getElementById('j-diamond-val');

    if (this.hwSpinBtn) {
      this.hwSpinBtn.addEventListener('click', () => this.executeHoldWinRespin());
    }
  }

  triggerHoldAndWin(sourceMatrix) {
    this.isSpinning = false;
    this.holdWinActive = true;
    this.holdWinRespinsLeft = 3;
    this.holdWinTotal = 0;
    this.holdWinTiles = new Array(9).fill(null);

    // Dynamic Jackpots based on bet
    const silver = this.bet * 30;
    const gold = this.bet * 75;
    const diamond = this.bet * 300;
    if (this.jSilverVal) this.jSilverVal.textContent = silver.toLocaleString();
    if (this.jGoldVal) this.jGoldVal.textContent = gold.toLocaleString();
    if (this.jDiamondVal) this.jDiamondVal.textContent = diamond.toLocaleString();

    // Map landing coins into the 9 tiles
    let tileIdx = 0;
    for (let row of ['top', 'center', 'bottom']) {
      for (let c = 0; c < 3; c++) {
        if (sourceMatrix[c][row].id === 'coin') {
          const coinVal = this.bet * (Math.floor(Math.random() * 4) + 2); // 2x..5x bet
          this.holdWinTiles[tileIdx] = { val: coinVal };
          this.holdWinTotal += coinVal;
        }
        tileIdx++;
      }
    }

    window.slotAudio.playJackpot();
    if (window.particleEngine) window.particleEngine.spawnCelebration(true);

    this.renderHoldWinGrid();
    this.updateHoldWinUI();

    if (this.holdWinModal) {
      this.holdWinModal.classList.add('active');
    }
    this.showMessage(window.i18n ? window.i18n.t('holdWinHeading') : '🔥 GRAND RESPINS AKTIVAN! 🔥', 'jackpot');
  }

  updateHoldWinUI() {
    if (this.hwTotalEl) this.hwTotalEl.textContent = this.holdWinTotal.toLocaleString();
    if (this.respinsPips) {
      const pips = this.respinsPips.querySelectorAll('.respin-pip');
      pips.forEach((pip, idx) => {
        pip.classList.toggle('active', idx < this.holdWinRespinsLeft);
      });
    }
  }

  renderHoldWinGrid() {
    if (!this.holdWinGrid) return;
    const tiles = this.holdWinGrid.querySelectorAll('.hw-tile');
    tiles.forEach((tile, idx) => {
      const data = this.holdWinTiles[idx];
      tile.className = 'hw-tile'; // Reset base classes
      if (data) {
        tile.classList.add('locked');
        let jpTagClass = '';
        let displayVal = `+${data.val.toLocaleString()}`;

        if (data.isJackpot === 'SILVER') {
          tile.classList.add('is-silver-jackpot');
          jpTagClass = 'jp-tag-silver';
          displayVal = '🥈 SILVER';
        } else if (data.isJackpot === 'GOLD') {
          tile.classList.add('is-gold-jackpot');
          jpTagClass = 'jp-tag-gold';
          displayVal = '🏆 GOLD';
        } else if (data.isJackpot === 'DIAMOND') {
          tile.classList.add('is-diamond-jackpot');
          jpTagClass = 'jp-tag-diamond';
          displayVal = '💎 DIAMOND';
        }

        tile.innerHTML = `
          <div class="hw-coin-wrapper">
            <img src="assets/symbols/coin.svg" alt="Coin" class="hw-coin-img" />
            <span class="hw-coin-val ${jpTagClass}">${displayVal}</span>
          </div>
        `;
      } else {
        tile.innerHTML = '<div class="hw-cell-inner"></div>';
      }
    });
  }

  executeHoldWinRespin() {
    if (!this.holdWinActive || this.holdWinRespinsLeft <= 0) return;

    if (this.hwSpinBtn) this.hwSpinBtn.disabled = true;
    window.slotAudio.startSpinningSound();

    let newCoinsLocked = 0;
    const emptyIndices = [];
    this.holdWinTiles.forEach((t, i) => { if (!t) emptyIndices.push(i); });

    // Animate empty cells: vortex glow + fast blurred coins spinning
    if (this.holdWinGrid) {
      const tiles = this.holdWinGrid.querySelectorAll('.hw-tile');
      emptyIndices.forEach((idx) => {
        const tile = tiles[idx];
        if (tile) {
          tile.classList.add('is-respinning');
          tile.innerHTML = `
            <div class="hw-spinning-placeholder">
              <img src="assets/symbols/coin.svg" alt="Spinning" class="hw-spinning-coin-ghost" />
            </div>
          `;
        }
      });
    }

    setTimeout(() => {
      window.slotAudio.stopSpinningSound();

      // Remove spinning state from empty cells before landing
      if (this.holdWinGrid) {
        const tiles = this.holdWinGrid.querySelectorAll('.hw-tile');
        emptyIndices.forEach((idx) => {
          const tile = tiles[idx];
          if (tile) tile.classList.remove('is-respinning');
        });
      }

      // Chance to land a new coin on empty tiles
      emptyIndices.forEach((idx) => {
        const hitChance = Math.random();
        if (hitChance < 0.32) {
          newCoinsLocked++;
          // Jackpot or standard coin value
          let jackpotType = null;
          let coinVal = 0;
          if (hitChance < 0.035) {
            jackpotType = 'GOLD';
            coinVal = this.bet * 75;
          } else if (hitChance < 0.09) {
            jackpotType = 'SILVER';
            coinVal = this.bet * 30;
          } else {
            coinVal = this.bet * (Math.floor(Math.random() * 6) + 1);
          }

          this.holdWinTiles[idx] = { val: coinVal, isJackpot: jackpotType };
          this.holdWinTotal += coinVal;
        }
      });

      if (newCoinsLocked > 0) {
        this.holdWinRespinsLeft = 3; // Reset counter!
        window.slotAudio.playCoinLock();
        if (window.particleEngine) window.particleEngine.spawnCelebration(false);
      } else {
        this.holdWinRespinsLeft--;
        window.slotAudio.playReelStop(2);
      }

      this.renderHoldWinGrid();
      this.updateHoldWinUI();

      // Check if all 9 positions filled (DIAMOND JACKPOT!)
      const allFilled = this.holdWinTiles.every(t => t !== null);
      if (allFilled) {
        const diamondBonus = this.bet * 300;
        this.holdWinTotal += diamondBonus;
        this.updateHoldWinUI();
        window.slotAudio.playJackpot();
        if (window.particleEngine) window.particleEngine.spawnCelebration(true);
        this.showMessage('💎 DIAMOND JACKPOT! POPUNJENA SVA POLJA! 💎', 'jackpot');

        setTimeout(() => this.finishHoldAndWin(), 2400);
        return;
      }

      if (this.holdWinRespinsLeft <= 0) {
        setTimeout(() => this.finishHoldAndWin(), 1200);
      } else {
        if (this.hwSpinBtn) this.hwSpinBtn.disabled = false;
      }
    }, 900);
  }

  finishHoldAndWin() {
    this.balance += this.holdWinTotal;
    this.lastWin = this.holdWinTotal;
    this.holdWinActive = false;

    if (this.holdWinModal) {
      this.holdWinModal.classList.remove('active');
    }
    if (this.hwSpinBtn) this.hwSpinBtn.disabled = false;

    window.slotAudio.playJackpot();
    if (window.particleEngine) window.particleEngine.spawnCelebration(true);
    this.showMessage(window.i18n ? window.i18n.t('hwFinished', { amount: this.holdWinTotal }) : `🏆 ZAVRŠEN HOLD & WIN: +${this.holdWinTotal}!`, 'jackpot');

    this.showGambleTrigger(this.holdWinTotal);
    this.updateUI();
  }

  // ==========================================================
  // PROGRESSIVE JACKPOTS SYSTEM: SILVER, GOLD, DIAMOND
  // ==========================================================
  initProgressiveJackpots() {
    this.renderJackpotValues();

    // Subtle ambient casino ticker increment every 4 seconds
    setInterval(() => {
      this.jackpotSilver += Math.floor(Math.random() * 2) + 1;
      this.jackpotGold += (Math.random() < 0.6 ? 1 : 0);
      this.jackpotDiamond += (Math.random() < 0.3 ? 1 : 0);
      this.renderJackpotValues();
    }, 4000);
  }

  renderJackpotValues() {
    if (this.jpSilverEl) this.jpSilverEl.textContent = this.jackpotSilver.toLocaleString();
    if (this.jpGoldEl) this.jpGoldEl.textContent = this.jackpotGold.toLocaleString();
    if (this.jpDiamondEl) this.jpDiamondEl.textContent = this.jackpotDiamond.toLocaleString();
  }

  // Increment jackpots with every spin: Silver fills fastest, Gold slower, Diamond slowest
  incrementJackpotsOnSpin() {
    // Silver fills fastest (+8 to +16 RSD per spin, scaled with bet)
    const silverInc = Math.max(8, Math.round(this.bet * 0.45) + Math.floor(Math.random() * 5));
    // Gold fills medium/slower (+3 to +7 RSD per spin)
    const goldInc = Math.max(3, Math.round(this.bet * 0.18) + Math.floor(Math.random() * 3));
    // Diamond fills slowest (+1 to +3 RSD per spin)
    const diamondInc = Math.max(1, Math.round(this.bet * 0.06) + (Math.random() < 0.5 ? 1 : 0));

    this.jackpotSilver += silverInc;
    this.jackpotGold += goldInc;
    this.jackpotDiamond += diamondInc;
    this.renderJackpotValues();

    // Trigger visual number bump on spin
    [this.jpSilverEl, this.jpGoldEl, this.jpDiamondEl].forEach(el => {
      if (el) {
        el.classList.add('bump-val');
        setTimeout(() => el.classList.remove('bump-val'), 220);
      }
    });
  }

  checkMysteryJackpot() {
    // Mystery jackpot chance per spin
    const rand = Math.random();
    // Diamond Jackpot: ~0.003 (0.3% chance per spin)
    if (rand < 0.003) {
      this.awardProgressiveJackpot('diamond');
      return true;
    }
    // Gold Jackpot: ~0.008 (0.8% chance per spin)
    else if (rand < 0.011) {
      this.awardProgressiveJackpot('gold');
      return true;
    }
    // Silver Jackpot: ~0.022 (2.2% chance per spin)
    else if (rand < 0.033) {
      this.awardProgressiveJackpot('silver');
      return true;
    }
    return false;
  }

  awardProgressiveJackpot(tier) {
    let prize = 0;
    let badgeClass = '';
    let msgKey = '';

    if (tier === 'diamond') {
      prize = this.jackpotDiamond;
      this.jackpotDiamond = 25000;
      badgeClass = '.jp-diamond';
      msgKey = 'jackpotWonDiamond';
    } else if (tier === 'gold') {
      prize = this.jackpotGold;
      this.jackpotGold = 5000;
      badgeClass = '.jp-gold';
      msgKey = 'jackpotWonGold';
    } else {
      prize = this.jackpotSilver;
      this.jackpotSilver = 1000;
      badgeClass = '.jp-silver';
      msgKey = 'jackpotWonSilver';
    }

    this.balance += prize;
    this.lastWin = prize;
    this.renderJackpotValues();
    this.updateUI();

    // Pulse animation on the corresponding ticker pod
    const pod = document.querySelector(badgeClass);
    if (pod) {
      pod.classList.add('jp-hit-pulse');
      setTimeout(() => pod.classList.remove('jp-hit-pulse'), 5000);
    }

    window.slotAudio.playJackpot();
    if (window.particleEngine) window.particleEngine.spawnCelebration(true);

    const defaultMsg = tier === 'diamond' 
      ? `💎 DIAMOND JACKPOT! +${prize.toLocaleString()} RSD! 💎`
      : (tier === 'gold' 
        ? `🏆 GOLD JACKPOT! +${prize.toLocaleString()} RSD! 🏆`
        : `🥈 SILVER JACKPOT! +${prize.toLocaleString()} RSD! 🥈`);

    this.showMessage(window.i18n ? window.i18n.t(msgKey, { amount: prize.toLocaleString() }) : defaultMsg, 'jackpot');
    this.showGambleTrigger(prize);
  }

  updateUI() {
    if (this.balanceEl) this.balanceEl.textContent = this.balance.toLocaleString();
    if (this.betEl) this.betEl.textContent = this.bet.toLocaleString();
    if (this.winEl) this.winEl.textContent = this.lastWin.toLocaleString();
    if (this.spinBtn) {
      const disabled = this.isSpinning || this.holdWinActive;
      this.spinBtn.disabled = disabled;
      this.spinBtn.classList.toggle('disabled', disabled);
    }
  }
}

window.SlotGame = SlotGame3D;
