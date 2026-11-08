/**
 * Grand Slot Club - Grand Super Hot (5, 20, 40, 100 Lines)
 * Complete EGT-Style Video Slot Terminal Controller
 * Real physical reel rolling, staggered deceleration, mechanical bounce, and direct reel click-to-stop.
 */

(function(root) {
  'use strict';

  // High-Resolution 3D Stylized Clay Fruit & Emblem Assets
  const SYMBOL_ASSETS = {
    cherry: 'assets/symbols/super-hot/cherry.png',
    lemon: 'assets/symbols/super-hot/lemon.png',
    orange: 'assets/symbols/super-hot/orange.png',
    plum: 'assets/symbols/super-hot/plum.png',
    watermelon: 'assets/symbols/super-hot/watermelon.png',
    grapes: 'assets/symbols/super-hot/grapes.png',
    seven: 'assets/symbols/super-hot/seven.png',
    star: 'assets/symbols/super-hot/star.png'
  };

  const SYMBOL_POOL = ['cherry', 'lemon', 'orange', 'plum', 'watermelon', 'grapes', 'seven', 'star'];

  function getSymbolHTML(symId) {
    const src = SYMBOL_ASSETS[symId] || `assets/symbols/super-hot/${symId}.png`;
    return `<img src="${src}" alt="${symId}" class="superhot-sym-img" draggable="false" />`;
  }

  class GrandSuperHotGame {
    constructor(wallet, jackpots) {
      this.wallet = wallet;
      this.jackpots = jackpots;
      this.engine = new root.SuperHotEngine();
      this.audio = new root.SuperHotAudio();

      this.lineOptions = [5, 20, 40, 100];
      this.selectedLines = 20; // Default 20 lines
      this.betLevels = [1, 2, 5, 10, 20];
      this.lineBet = 2; // Default 2 ZLT per line -> 40 ZLT total bet

      this.isSpinning = false;
      this.reelStates = ['idle', 'idle', 'idle', 'idle', 'idle'];
      this.reelTimers = [null, null, null, null, null];
      this.currentMatrix = null;
      this.lastEvaluation = null;

      this.currentWin = 0;
      this.gambleStreak = 0;
      this.gambleHistory = ['hearts', 'spades', 'diamonds', 'clubs', 'hearts'];

      // Mystery Jackpot Cards State
      this.jackpotGameState = null;

      // Auto-spin
      this.isAutoSpinning = false;

      this.dom = {};
      this.initDefaultMatrix();
    }

    initDefaultMatrix() {
      const { rows } = this.engine.getGridDimensions(this.selectedLines);
      this.currentMatrix = [];
      const defaultSyms = ['cherry', 'orange', 'plum', 'lemon', 'watermelon', 'grapes', 'seven'];
      for (let r = 0; r < 5; r++) {
        const col = [];
        for (let row = 0; row < rows; row++) {
          col.push(defaultSyms[(r + row) % defaultSyms.length]);
        }
        this.currentMatrix.push(col);
      }
    }

    mount() {
      this.cacheDOM();
      this.bindEvents();
      this.syncJackpotDisplays();
      this.renderGrid();
      this.updateConsoleUI();
      if (this.audio) this.audio.initContext();
    }

    unmount() {
      this.forceExit();
      if (this.audio) {
        this.audio.stopSuspense();
        this.audio.stopHeartbeat();
      }
    }

    forceExit() {
      this.isAutoSpinning = false;
      this.isSpinning = false;
      for (let i = 0; i < 5; i++) {
        if (this.reelTimers[i]) {
          clearTimeout(this.reelTimers[i]);
          this.reelTimers[i] = null;
        }
        this.reelStates[i] = 'idle';
      }
      this.closeGambleModal();
      this.closeJackpotModal();
    }

    cacheDOM() {
      this.dom.view = document.getElementById('superhot-game-view');
      this.dom.grid = document.getElementById('superhot-reels-grid');
      this.dom.canvas = document.getElementById('superhot-paylines-canvas');
      this.dom.linesButtons = document.querySelectorAll('.superhot-line-btn');
      this.dom.lineCostIndicator = document.getElementById('superhot-line-cost-indicator');

      // Canonical Global App HUD Counters (Single, unified luxury bar)
      this.dom.balanceDisplay = document.getElementById('val-balance');
      this.dom.balanceSub = document.getElementById('hud-balance-rsd');
      this.dom.betDisplay = document.getElementById('val-bet');
      this.dom.betSub = document.getElementById('hud-bet-rsd');
      this.dom.winDisplay = document.getElementById('val-win');
      this.dom.denomDisplay = document.getElementById('hud-denom-val');
      this.dom.denomSub = document.getElementById('hud-denom-sub');

      // Canonical Global Controls
      this.dom.spinBtn = document.getElementById('spin-btn');
      this.dom.spinLabel = document.querySelector('#spin-btn .spin-text-mini') || document.getElementById('spin-btn');
      this.dom.gambleBtn = document.getElementById('gamble-btn');
      this.dom.autoBtn = document.getElementById('auto-btn');
      this.dom.maxBetBtn = document.getElementById('max-bet-btn');
      this.dom.betMinus = document.getElementById('bet-minus');
      this.dom.betPlus = document.getElementById('bet-plus');
      this.dom.statusBanner = document.getElementById('status-banner');

      // Jackpot meters
      this.dom.jpClubs = document.getElementById('superhot-jp-clubs');
      this.dom.jpDiamonds = document.getElementById('superhot-jp-diamonds');
      this.dom.jpHearts = document.getElementById('superhot-jp-hearts');
      this.dom.jpSpades = document.getElementById('superhot-jp-spades');

      // Modals
      this.dom.gambleModal = document.getElementById('superhot-gamble-modal');
      this.dom.jackpotModal = document.getElementById('superhot-jackpot-modal');
    }

    bindEvents() {
      if (this.dom.linesButtons) {
        this.dom.linesButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            if (this.isSpinning) return;
            const lines = parseInt(e.currentTarget.getAttribute('data-lines'), 10);
            this.setLineCount(lines);
          });
        });
      }

      // Allow clicking directly on any spinning reel column to slam stop it
      if (this.dom.grid) {
        this.dom.grid.addEventListener('click', (e) => {
          const reelEl = e.target.closest('.superhot-reel-column');
          if (reelEl && this.isSpinning) {
            const reelIdx = parseInt(reelEl.getAttribute('data-reel-index'), 10);
            this.stopSingleReel(reelIdx);
          }
        });
      }
    }

    setLineCount(lines) {
      if (!this.lineOptions.includes(lines) || this.isSpinning) return;
      const prevDim = this.engine.getGridDimensions(this.selectedLines);
      this.selectedLines = lines;
      const newDim = this.engine.getGridDimensions(this.selectedLines);

      if (this.audio) this.audio.playReelStop(0);

      if (prevDim.rows !== newDim.rows) {
        // Matrix morphology change (5x3 <-> 5x4)
        this.initDefaultMatrix();
      }

      this.stopSequentialLineCycle();
      this.clearPaylineHighlights();
      this.renderGrid();
      this.updateConsoleUI();
    }

    stepBet(direction = 1) {
      const curIdx = this.betLevels.indexOf(this.lineBet);
      let nextIdx = curIdx + direction;
      if (nextIdx >= this.betLevels.length) nextIdx = 0;
      if (nextIdx < 0) nextIdx = this.betLevels.length - 1;
      this.lineBet = this.betLevels[nextIdx];
      if (this.audio) this.audio.playReelStop(2);
      this.updateConsoleUI();
    }

    setMaxBet() {
      this.lineBet = this.betLevels[this.betLevels.length - 1];
      if (this.audio) this.audio.playReelStop(4);
      this.updateConsoleUI();
    }

    updateConsoleUI() {
      const totalBetCredits = this.lineBet * this.selectedLines;
      const denom = (this.wallet && this.wallet.activeDenom) ? this.wallet.activeDenom : 1;
      const totalBetZLT = +(totalBetCredits * denom).toFixed(2);

      if (this.wallet) {
        this.wallet.bet = totalBetCredits;
      }

      if (this.dom.linesButtons) {
        this.dom.linesButtons.forEach(btn => {
          const l = parseInt(btn.getAttribute('data-lines'), 10);
          btn.classList.toggle('active', l === this.selectedLines);
        });
      }

      if (this.dom.lineCostIndicator) {
        this.dom.lineCostIndicator.textContent = `${this.lineBet} KR / LINIJA (${totalBetCredits} KR UKUPNO)`;
      }

      if (this.dom.betDisplay) {
        this.dom.betDisplay.textContent = `${totalBetCredits}`;
      }
      if (this.dom.betSub) {
        this.dom.betSub.textContent = `≈ ${totalBetZLT} ZLT`;
      }
      if (this.dom.winDisplay) {
        this.dom.winDisplay.textContent = `${this.currentWin}`;
      }

      if (this.dom.balanceDisplay && this.wallet) {
        this.dom.balanceDisplay.textContent = `${Math.floor(this.wallet.balance || 0).toLocaleString()}`;
      }
      if (this.dom.balanceSub && this.wallet) {
        this.dom.balanceSub.textContent = `≈ ${(this.wallet.rsdBalance || 0).toLocaleString()} ZLT`;
      }

      if (this.dom.gambleBtn) {
        const canGamble = (this.currentWin > 0 && this.currentWin <= totalBetCredits * 35 && !this.isSpinning);
        this.dom.gambleBtn.disabled = !canGamble;
        this.dom.gambleBtn.classList.toggle('is-dimmed', !canGamble);
        this.dom.gambleBtn.classList.toggle('glow-ready', canGamble);
      }

      if (this.dom.spinBtn) {
        if (this.isSpinning) {
          if (this.dom.spinLabel) this.dom.spinLabel.textContent = 'STOP';
          this.dom.spinBtn.classList.add('is-stopping');
        } else {
          if (this.dom.spinLabel) this.dom.spinLabel.textContent = 'SPIN';
          this.dom.spinBtn.classList.remove('is-stopping');
        }
      }
    }
      if (this.dom.balanceDisplay && this.wallet) {
        this.dom.balanceDisplay.textContent = `${Math.floor(this.wallet.balance || 0).toLocaleString()}`;
      }
      if (this.dom.balanceSub && this.wallet) {
        this.dom.balanceSub.textContent = `≈ ${Math.floor(this.wallet.balance || 0).toLocaleString()} ZLT`;
      }

      if (this.dom.gambleBtn) {
        const canGamble = (this.currentWin > 0 && this.currentWin <= totalBet * 35 && !this.isSpinning);
        this.dom.gambleBtn.disabled = !canGamble;
        this.dom.gambleBtn.classList.toggle('is-dimmed', !canGamble);
        this.dom.gambleBtn.classList.toggle('glow-ready', canGamble);
      }

      if (this.dom.spinBtn) {
        if (this.isSpinning) {
          if (this.dom.spinLabel) this.dom.spinLabel.textContent = 'STOP';
          this.dom.spinBtn.classList.add('is-stopping');
        } else {
          if (this.dom.spinLabel) this.dom.spinLabel.textContent = 'SPIN';
          this.dom.spinBtn.classList.remove('is-stopping');
        }
      }
    }

    syncJackpotDisplays() {
      const format = (v) => `${Math.floor(v).toLocaleString()} ZLT`;
      const baseJp = (this.jackpots && this.jackpots.meters) ? this.jackpots.meters : {
        mini: 1240, minor: 4580, major: 18920, grand: 78500
      };
      if (this.dom.jpClubs) this.dom.jpClubs.textContent = format(baseJp.mini || 1240);
      if (this.dom.jpDiamonds) this.dom.jpDiamonds.textContent = format(baseJp.minor || 4580);
      if (this.dom.jpHearts) this.dom.jpHearts.textContent = format(baseJp.major || 18920);
      if (this.dom.jpSpades) this.dom.jpSpades.textContent = format(baseJp.grand || 78500);
    }

    renderGrid() {
      if (!this.dom.grid) return;
      const { rows } = this.engine.getGridDimensions(this.selectedLines);

      // Morphing class: 5x3 vs 5x4
      this.dom.grid.className = `superhot-reels-container rows-${rows}`;
      this.dom.grid.innerHTML = '';

      for (let r = 0; r < 5; r++) {
        const reelCol = document.createElement('div');
        reelCol.className = `superhot-reel-column reel-${r}`;
        reelCol.setAttribute('data-reel-index', r);

        const reelStrip = document.createElement('div');
        reelStrip.className = 'superhot-reel-strip';

        for (let row = 0; row < rows; row++) {
          const symId = this.currentMatrix[r][row] || 'cherry';
          const cell = document.createElement('div');
          cell.className = `superhot-cell cell-${r}-${row} sym-${symId}`;
          cell.setAttribute('data-reel', r);
          cell.setAttribute('data-row', row);
          cell.style.height = `${100 / rows}%`;
          cell.innerHTML = `
            <div class="superhot-sym-wrapper">
              ${getSymbolHTML(symId)}
            </div>
            <div class="flame-particle-layer"></div>
          `;
          reelStrip.appendChild(cell);
        }

        reelCol.appendChild(reelStrip);
        this.dom.grid.appendChild(reelCol);
      }
    }

    handleSpin() {
      if (this.isSpinning) return;
      const totalBetCredits = this.lineBet * this.selectedLines;

      if (this.wallet && !this.wallet.canAffordSpin()) {
        if (this.dom.statusBanner) {
          this.dom.statusBanner.textContent = 'NEMATE DOVOLJNO KREDITA ZA OVAJ ULOG!';
          this.dom.statusBanner.className = 'status-banner status-warning';
        }
        this.isAutoSpinning = false;
        if (this.dom.autoBtn) this.dom.autoBtn.classList.remove('active');
        return;
      }

      // Deduct bet via CasinoWallet
      if (this.wallet) {
        this.wallet.deductBet(totalBetCredits);
      }
      if (this.wallet && typeof this.wallet.recordTurnover === 'function') {
        this.wallet.recordTurnover(totalBetCredits);
      }

      this.currentWin = 0;
      this.stopSequentialLineCycle();
      this.clearPaylineHighlights();
      this.updateConsoleUI();

      if (this.dom.statusBanner) {
        this.dom.statusBanner.textContent = `VRTENJE U TOKU (${this.selectedLines} LINIJA, ULOG ${totalBetCredits} KR)...`;
        this.dom.statusBanner.className = 'status-banner status-normal';
      }

      this.isSpinning = true;
      this.reelStates = ['spinning', 'spinning', 'spinning', 'spinning', 'spinning'];

      // Pre-evaluate spin outcome
      const outcomeMatrix = this.engine.generateSpinMatrix(this.selectedLines);
      this.lastEvaluation = this.engine.evaluateSpin(outcomeMatrix, this.selectedLines, this.lineBet);

      const { rows } = this.engine.getGridDimensions(this.selectedLines);

      // Play tick sound loop
      this.spinAudioInterval = setInterval(() => {
        if (this.isSpinning && this.audio) {
          this.audio.playReelTick();
        }
      }, 75);

      // Staggered durations for authentic slot machine stops
      const durations = [750, 1000, 1250, 1500, 1750];

      // If suspense trigger: slow down reels 4 and 5
      if (this.lastEvaluation.suspenseTrigger) {
        durations[3] = 2400;
        durations[4] = 3100;
        setTimeout(() => {
          if (this.isSpinning && this.reelStates[3] === 'spinning') {
            const reel4 = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="3"]`);
            const reel5 = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="4"]`);
            if (reel4) reel4.classList.add('has-suspense');
            if (reel5) reel5.classList.add('has-suspense');
            if (this.audio) this.audio.startSuspense();
          }
        }, 1200);
      }

      // Setup continuous vertical rolling animation for each reel
      for (let r = 0; r < 5; r++) {
        const reelCol = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="${r}"]`);
        if (!reelCol) continue;

        reelCol.classList.add('is-spinning');
        reelCol.classList.remove('has-suspense');

        const reelStrip = reelCol.querySelector('.superhot-reel-strip');
        if (!reelStrip) continue;

        reelStrip.classList.remove('mechanical-snap-bounce');
        reelStrip.style.height = 'auto'; // allow extended length during spin

        const targetSyms = this.lastEvaluation.matrix[r]; // [rows]
        const prevSyms = this.currentMatrix[r]; // [rows]

        // Build continuous reel strip: target (rows) + filler (16) + previous (rows)
        const fillerCount = 16;
        const totalTilesCount = rows + fillerCount + rows;
        const stripTiles = [];

        // Top tiles: target landing symbols
        for (let row = 0; row < rows; row++) {
          stripTiles.push(targetSyms[row]);
        }
        // Middle tiles: random spinning symbols
        for (let i = 0; i < fillerCount; i++) {
          stripTiles.push(SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)]);
        }
        // Bottom tiles: previous resting symbols
        for (let row = 0; row < rows; row++) {
          stripTiles.push(prevSyms[row] || 'cherry');
        }

        const tileH = reelCol.clientHeight / rows;
        const scrollDist = (totalTilesCount - rows) * tileH;

        reelStrip.innerHTML = stripTiles.map((symId, idx) => `
          <div class="superhot-cell cell-tile sym-${symId}" style="height: ${tileH}px;">
            <div class="superhot-sym-wrapper">
              ${getSymbolHTML(symId)}
            </div>
            <div class="flame-particle-layer"></div>
          </div>
        `).join('');

        // Start from bottom resting position
        reelStrip.style.transition = 'none';
        reelStrip.style.transform = `translateY(-${scrollDist}px)`;
        void reelStrip.offsetWidth; // Force layout reflow

        // Animate downwards with realistic deceleration curve
        const dur = durations[r];
        reelStrip.style.transition = `transform ${dur}ms cubic-bezier(0.2, 0.95, 0.35, 1.0)`;
        reelStrip.style.transform = 'translateY(0px)';

        // Schedule reel stop
        this.reelTimers[r] = setTimeout(() => {
          this.stopSingleReel(r);
        }, dur);
      }

      this.updateConsoleUI();
    }

    stopSingleReel(reelIdx) {
      if (!this.isSpinning || this.reelStates[reelIdx] !== 'spinning') return;

      if (this.reelTimers[reelIdx]) {
        clearTimeout(this.reelTimers[reelIdx]);
        this.reelTimers[reelIdx] = null;
      }

      this.reelStates[reelIdx] = 'locked';

      // Update currentMatrix
      const { rows } = this.engine.getGridDimensions(this.selectedLines);
      for (let row = 0; row < rows; row++) {
        this.currentMatrix[reelIdx][row] = this.lastEvaluation.matrix[reelIdx][row];
      }

      // Update DOM
      const reelCol = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="${reelIdx}"]`);
      if (reelCol) {
        reelCol.classList.remove('is-spinning');
        reelCol.classList.remove('has-suspense');

        const reelStrip = reelCol.querySelector('.superhot-reel-strip');
        if (reelStrip) {
          // Rebuild final resting cells
          reelStrip.innerHTML = '';
          reelStrip.style.height = '100%';
          for (let row = 0; row < rows; row++) {
            const symId = this.currentMatrix[reelIdx][row];
            const cell = document.createElement('div');
            cell.className = `superhot-cell cell-${reelIdx}-${row} sym-${symId}`;
            cell.setAttribute('data-reel', reelIdx);
            cell.setAttribute('data-row', row);
            cell.style.height = `${100 / rows}%`;
            cell.innerHTML = `
              <div class="superhot-sym-wrapper">
                ${getSymbolHTML(symId)}
              </div>
              <div class="flame-particle-layer"></div>
            `;
            reelStrip.appendChild(cell);
          }

          // Apply authentic mechanical snap-bounce keyframe animation
          reelStrip.style.transition = 'none';
          reelStrip.style.setProperty('--stop-overshoot', '12px');
          reelStrip.style.setProperty('--stop-rebound', '-4px');
          reelStrip.style.setProperty('--stop-micro', '1px');
          reelStrip.style.setProperty('--stop-target', '0px');
          reelStrip.classList.add('mechanical-snap-bounce');
          reelStrip.style.transform = 'translateY(0px)';
        }
      }

      // Sound
      if (this.audio) this.audio.playReelStop(reelIdx);

      // Check if scatter landed on this reel
      let hasScatterOnReel = false;
      for (let row = 0; row < rows; row++) {
        if (this.currentMatrix[reelIdx][row] === 'star') {
          hasScatterOnReel = true;
          break;
        }
      }
      if (hasScatterOnReel && this.audio) {
        this.audio.playScatterBell(reelIdx + 1);
      }

      // Check if all reels are locked
      if (this.reelStates.every(s => s === 'locked')) {
        this.finalizeSpin();
      }
    }

    slamStop() {
      if (!this.isSpinning) return;
      if (this.audio) this.audio.playSlamStop();
      let delay = 0;
      for (let r = 0; r < 5; r++) {
        if (this.reelStates[r] === 'spinning') {
          setTimeout(() => {
            if (this.reelStates[r] === 'spinning') {
              this.stopSingleReel(r);
            }
          }, delay);
          delay += 60;
        }
      }
    }

    finalizeSpin() {
      this.isSpinning = false;
      if (this.spinAudioInterval) {
        clearInterval(this.spinAudioInterval);
        this.spinAudioInterval = null;
      }
      if (this.audio) this.audio.stopSuspense();

      const evalResult = this.lastEvaluation;
      this.currentWin = evalResult.totalWin;

      if (this.currentWin > 0) {
        // Credit win to wallet
        if (this.wallet) {
          this.wallet.addWin(this.currentWin);
        }

        // Trigger authentic EGT Flaming Reels & Sequential Line Presentation
        this.triggerFlamingReels(evalResult);

        // Sound
        if (this.audio) {
          this.audio.playFlameWhoosh();
          const tier = this.currentWin >= (evalResult.totalBet * 10) ? 'big' : 'normal';
          this.audio.playWinFanfare(tier);
        }
      } else {
        if (this.dom.statusBanner) {
          this.dom.statusBanner.textContent = 'VIŠE SREĆE U SLEDEĆEM SPJINU! ZAVRTITE PONOVO.';
          this.dom.statusBanner.className = 'status-banner status-normal';
        }
      }

      this.updateConsoleUI();

      // Check for Mystery Jackpot Trigger
      if (evalResult.mysteryJackpotTrigger) {
        setTimeout(() => {
          this.triggerMysteryJackpot();
        }, 1200);
      } else if (this.isAutoSpinning) {
        setTimeout(() => {
          if (this.isAutoSpinning) this.handleSpin();
        }, this.currentWin > 0 ? 2600 : 800);
      }
    }

    triggerFlamingReels(evalResult) {
      // 1. All winning symbols burst into authentic EGT fire
      evalResult.winningPositions.forEach(pos => {
        const cell = this.dom.grid.querySelector(`.superhot-cell[data-reel="${pos.reel}"][data-row="${pos.row}"]`);
        if (cell) {
          cell.classList.add('flaming-symbol');
        }
      });

      // 2. Start sequential line cycle (one line at a time, no chaotic spiderwebs)
      this.startSequentialLineCycle(evalResult.winningLines, evalResult.scatterWin);
    }

    startSequentialLineCycle(winningLines, scatterWin = 0) {
      this.stopSequentialLineCycle();
      const lines = winningLines || [];

      const showSingleLine = (line) => {
        if (!this.dom.canvas || this.isSpinning || !line) return;
        const canvas = this.dom.canvas;
        const rect = this.dom.grid.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colW = canvas.width / 5;
        const { rows } = this.engine.getGridDimensions(this.selectedLines);
        const rowH = canvas.height / rows;

        // Draw ONLY this specific winning line with gold & fire glow
        ctx.save();
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        line.positions.forEach((pos, pIdx) => {
          const cx = (pos.reel * colW) + (colW / 2);
          const cy = (pos.row * rowH) + (rowH / 2);
          if (pIdx === 0) {
            ctx.moveTo(cx, cy);
          } else {
            ctx.lineTo(cx, cy);
          }
        });
        ctx.stroke();

        // Glowing node indicators
        line.positions.forEach(pos => {
          const cx = (pos.reel * colW) + (colW / 2);
          const cy = (pos.row * rowH) + (rowH / 2);
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#e67e22';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        ctx.restore();

        // Update status banner with exact line breakdown
        if (this.dom.statusBanner) {
          const denom = (this.wallet && this.wallet.activeDenom) ? this.wallet.activeDenom : 1;
          const zltVal = +(line.payout * denom).toFixed(2);
          this.dom.statusBanner.textContent = `LINIJA ${line.lineIndex}: ${line.symbolName} x${line.matchCount} ➜ +${line.payout} KR (≈ ${zltVal} ZLT)`;
          this.dom.statusBanner.className = 'status-banner status-win';
        }
      };

      if (lines.length > 0) {
        let idx = 0;
        showSingleLine(lines[0]);

        if (lines.length > 1) {
          this.lineCycleInterval = setInterval(() => {
            if (this.isSpinning) {
              this.stopSequentialLineCycle();
              return;
            }
            idx = (idx + 1) % lines.length;
            showSingleLine(lines[idx]);
          }, 1400);
        }
      } else if (scatterWin > 0 && this.dom.statusBanner) {
        const denom = (this.wallet && this.wallet.activeDenom) ? this.wallet.activeDenom : 1;
        const zltVal = +(scatterWin * denom).toFixed(2);
        this.dom.statusBanner.textContent = `⭐ SCATTER DOBITAK (ZLATNA ZVEZDA): +${scatterWin} KR (≈ ${zltVal} ZLT)!`;
        this.dom.statusBanner.className = 'status-banner status-jackpot';
      }
    }

    stopSequentialLineCycle() {
      if (this.lineCycleInterval) {
        clearInterval(this.lineCycleInterval);
        this.lineCycleInterval = null;
      }
      if (this.dom.canvas) {
        const ctx = this.dom.canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
      }
    }

    clearPaylineHighlights() {
      this.stopSequentialLineCycle();
      if (this.dom.grid) {
        const flaming = this.dom.grid.querySelectorAll('.flaming-symbol');
        flaming.forEach(el => el.classList.remove('flaming-symbol'));
      }
    }

    toggleAutoSpin() {
      this.isAutoSpinning = !this.isAutoSpinning;
      if (this.dom.autoBtn) {
        this.dom.autoBtn.classList.toggle('active', this.isAutoSpinning);
      }
      if (this.isAutoSpinning && !this.isSpinning) {
        this.handleSpin();
      }
    }
      }
      if (this.isAutoSpinning && !this.isSpinning) {
        this.handleSpin();
      }
    }

    // ==========================================
    // GAMBLE (DUPLANJE CRVENO / CRNO)
    // ==========================================
    openGambleModal() {
      if (!this.dom.gambleModal || this.currentWin <= 0) return;
      this.gambleStreak = 0;
      this.dom.gambleModal.style.display = 'flex';
      this.renderGambleUI();
      if (this.audio) this.audio.startHeartbeat();
    }

    closeGambleModal() {
      if (this.dom.gambleModal) this.dom.gambleModal.style.display = 'none';
      if (this.audio) this.audio.stopHeartbeat();
    }

    renderGambleUI() {
      const amountEl = document.getElementById('gamble-amount');
      const toWinEl = document.getElementById('gamble-to-win');
      const historyEl = document.getElementById('gamble-history-list');
      const cardEl = document.getElementById('gamble-card-display');

      if (amountEl) amountEl.textContent = `${this.currentWin} ZLT`;
      if (toWinEl) toWinEl.textContent = `${this.currentWin * 2} ZLT`;

      if (historyEl) {
        historyEl.innerHTML = this.gambleHistory.slice(-5).map(suit => {
          const isRed = (suit === 'hearts' || suit === 'diamonds');
          const symbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit] || '♥';
          return `<span class="gamble-history-card ${isRed ? 'red' : 'black'}">${symbol}</span>`;
        }).join('');
      }

      if (cardEl) {
        cardEl.className = 'gamble-card is-blinking';
        cardEl.innerHTML = `
          <div class="card-inner">
            <div class="card-back"></div>
            <div class="card-front">?</div>
          </div>
        `;
      }

      // Bind red / black / collect buttons
      const btnRed = document.getElementById('btn-gamble-red');
      const btnBlack = document.getElementById('btn-gamble-black');
      const btnCollect = document.getElementById('btn-gamble-collect');

      if (btnRed) {
        btnRed.onclick = () => this.executeGambleChoice('red');
      }
      if (btnBlack) {
        btnBlack.onclick = () => this.executeGambleChoice('black');
      }
      if (btnCollect) {
        btnCollect.onclick = () => {
          this.closeGambleModal();
          this.updateConsoleUI();
        };
      }
    }

    executeGambleChoice(choice) {
      if (this.audio) this.audio.playCardFlip();
      const cardEl = document.getElementById('gamble-card-display');
      if (cardEl) cardEl.classList.remove('is-blinking');

      // 50/50 Outcome
      const isRed = Math.random() < 0.5;
      const actualColor = isRed ? 'red' : 'black';
      const actualSuit = isRed ? (Math.random() < 0.5 ? 'hearts' : 'diamonds') : (Math.random() < 0.5 ? 'spades' : 'clubs');
      this.gambleHistory.push(actualSuit);

      const suitSym = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[actualSuit];

      if (cardEl) {
        cardEl.classList.add(actualColor);
        cardEl.innerHTML = `
          <div class="card-revealed ${actualColor}">
            <span class="card-suit-top">${suitSym}</span>
            <span class="card-suit-center">${suitSym}</span>
            <span class="card-suit-bot">${suitSym}</span>
          </div>
        `;
      }

      if (choice === actualColor) {
        // Double win!
        const addedWin = this.currentWin;
        this.currentWin *= 2;
        if (this.wallet) {
          this.wallet.addWin(addedWin);
        }
        if (this.audio) this.audio.playWinFanfare('normal');
        this.gambleStreak++;

        setTimeout(() => {
          if (this.gambleStreak >= 5) {
            // Max gamble reached -> collect automatically
            this.closeGambleModal();
            this.updateConsoleUI();
          } else {
            this.renderGambleUI();
          }
        }, 1200);
      } else {
        // Lost gamble
        if (this.wallet) {
          this.wallet.deductBet(this.currentWin);
          this.wallet.lastWin = 0;
          this.wallet.updateUI();
        }
        this.currentWin = 0;
        this.updateConsoleUI();

        setTimeout(() => {
          this.closeGambleModal();
        }, 1400);
      }
    }

    // ==========================================
    // 4-LEVEL MYSTERY JACKPOT CARDS
    // ==========================================
    triggerMysteryJackpot() {
      if (!this.dom.jackpotModal) return;
      if (this.audio) this.audio.playJackpotAlarm();

      // Setup 12 cards (3 clubs, 3 diamonds, 3 hearts, 3 spades, shuffled)
      const suits = ['clubs', 'clubs', 'clubs', 'diamonds', 'diamonds', 'diamonds', 'hearts', 'hearts', 'hearts', 'spades', 'spades', 'spades'];
      // Fisher-Yates shuffle
      for (let i = suits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [suits[i], suits[j]] = [suits[j], suits[i]];
      }

      this.jackpotGameState = {
        cards: suits.map((suit, index) => ({ id: index, suit, revealed: false })),
        counts: { clubs: 0, diamonds: 0, hearts: 0, spades: 0 },
        isFinished: false
      };

      this.dom.jackpotModal.style.display = 'flex';
      this.renderJackpotModal();
    }

    closeJackpotModal() {
      if (this.dom.jackpotModal) this.dom.jackpotModal.style.display = 'none';
      this.jackpotGameState = null;
    }

    renderJackpotModal() {
      const grid = document.getElementById('superhot-jackpot-cards-grid');
      if (!grid || !this.jackpotGameState) return;

      grid.innerHTML = '';
      this.jackpotGameState.cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `jackpot-pick-card ${card.revealed ? 'revealed' : ''}`;
        cardEl.setAttribute('data-card-id', card.id);

        const suitSym = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' }[card.suit];
        const isRed = (card.suit === 'hearts' || card.suit === 'diamonds');

        cardEl.innerHTML = `
          <div class="card-flipper">
            <div class="card-back-side">
              <span class="gold-shield">♚</span>
            </div>
            <div class="card-face-side ${isRed ? 'red' : 'black'}">
              <span class="jp-suit">${suitSym}</span>
            </div>
          </div>
        `;

        cardEl.onclick = () => this.handleJackpotCardPick(card.id);
        grid.appendChild(cardEl);
      });
    }

    handleJackpotCardPick(cardId) {
      if (!this.jackpotGameState || this.jackpotGameState.isFinished) return;
      const card = this.jackpotGameState.cards[cardId];
      if (card.revealed) return;

      card.revealed = true;
      this.jackpotGameState.counts[card.suit]++;

      if (this.audio) this.audio.playCardFlip();

      // Update card visual
      const cardEl = document.querySelector(`.jackpot-pick-card[data-card-id="${cardId}"]`);
      if (cardEl) cardEl.classList.add('revealed');

      // Check if any suit reached 3
      if (this.jackpotGameState.counts[card.suit] >= 3) {
        this.jackpotGameState.isFinished = true;
        this.awardJackpotLevel(card.suit);
      }
    }

    awardJackpotLevel(suit) {
      const names = {
        clubs: { name: 'TREF (I NIVO)', baseVal: 1240 },
        diamonds: { name: 'KARO (II NIVO)', baseVal: 4580 },
        hearts: { name: 'SRCE (III NIVO)', baseVal: 18920 },
        spades: { name: 'PIK (IV GRAND)', baseVal: 78500 }
      };

      const info = names[suit] || names.clubs;
      const amount = info.baseVal;

      if (this.wallet) {
        this.wallet.balance += amount;
        this.wallet.updateUI();
      }

      if (this.audio) this.audio.playWinFanfare('epic');

      const titleEl = document.getElementById('superhot-jackpot-status-title');
      if (titleEl) {
        titleEl.textContent = `ČESTITAMO! OSVOJILI STE ${info.name}: ${amount.toLocaleString()} ZLT!`;
        titleEl.classList.add('winner-pulse');
      }

      setTimeout(() => {
        this.closeJackpotModal();
        this.updateConsoleUI();
      }, 4000);
    }
  }

  // Export
  root.GrandSuperHotGame = GrandSuperHotGame;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GrandSuperHotGame };
  }
})(typeof window !== 'undefined' ? window : global);
