/**
 * Grand Slot Club - Grand Super Hot (5, 20, 40, 100 Lines)
 * Complete EGT-Style Video Slot Terminal Controller
 */

(function(root) {
  'use strict';

  // SVG Artwork for High-Res 3D Juicy EGT Symbols
  const SYMBOL_SVGS = {
    cherry: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg">
        <defs>
          <radialGradient id="cherryGrad1" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ff6b81" />
            <stop offset="40%" stop-color="#e81123" />
            <stop offset="100%" stop-color="#560000" />
          </radialGradient>
          <radialGradient id="cherryGrad2" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ff7b91" />
            <stop offset="45%" stop-color="#d60017" />
            <stop offset="100%" stop-color="#400000" />
          </radialGradient>
          <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ed573" />
            <stop offset="100%" stop-color="#0f5132" />
          </linearGradient>
          <filter id="fruitGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
          </filter>
        </defs>
        <path d="M 50 15 C 45 35 32 50 34 65" stroke="url(#stemGrad)" stroke-width="4.5" stroke-linecap="round" fill="none" />
        <path d="M 50 15 C 55 35 68 50 66 65" stroke="url(#stemGrad)" stroke-width="4.5" stroke-linecap="round" fill="none" />
        <path d="M 50 15 Q 65 8 72 18 Q 58 24 50 15 Z" fill="#2ed573" />
        <circle cx="34" cy="68" r="21" fill="url(#cherryGrad1)" filter="url(#fruitGlow)"/>
        <ellipse cx="28" cy="60" rx="6" ry="3.5" fill="#ffffff" opacity="0.65" transform="rotate(-30 28 60)"/>
        <circle cx="68" cy="68" r="21" fill="url(#cherryGrad2)" filter="url(#fruitGlow)"/>
        <ellipse cx="62" cy="60" rx="6" ry="3.5" fill="#ffffff" opacity="0.65" transform="rotate(-30 62 60)"/>
      </svg>
    `,
    lemon: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg">
        <defs>
          <radialGradient id="lemonGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#fffb7d" />
            <stop offset="35%" stop-color="#ffd32a" />
            <stop offset="85%" stop-color="#ffa801" />
            <stop offset="100%" stop-color="#b86000" />
          </radialGradient>
        </defs>
        <path d="M 50 12 Q 80 16 85 45 Q 88 78 50 88 Q 15 82 12 50 Q 15 16 50 12 Z" fill="#2ed573" opacity="0.9" transform="scale(0.35) translate(40, -10)" />
        <ellipse cx="50" cy="52" rx="36" ry="28" fill="url(#lemonGrad)" transform="rotate(-28 50 52)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"/>
        <ellipse cx="38" cy="40" rx="14" ry="6" fill="#ffffff" opacity="0.55" transform="rotate(-35 38 40)"/>
      </svg>
    `,
    orange: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg">
        <defs>
          <radialGradient id="orangeGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#ffbe76" />
            <stop offset="40%" stop-color="#ff793f" />
            <stop offset="90%" stop-color="#cd6133" />
            <stop offset="100%" stop-color="#842600" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="52" r="34" fill="url(#orangeGrad)" filter="drop-shadow(0 5px 6px rgba(0,0,0,0.55))"/>
        <path d="M 48 18 Q 50 12 56 14 Q 54 20 48 18 Z" fill="#2ed573" />
        <path d="M 50 18 Q 65 10 75 18 Q 62 26 50 18 Z" fill="#10ac84" />
        <ellipse cx="40" cy="38" rx="12" ry="5.5" fill="#ffffff" opacity="0.5" transform="rotate(-30 40 38)"/>
      </svg>
    `,
    plum: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg">
        <defs>
          <radialGradient id="plumGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#c56cf0" />
            <stop offset="40%" stop-color="#7d5fff" />
            <stop offset="85%" stop-color="#4b4b8f" />
            <stop offset="100%" stop-color="#181145" />
          </radialGradient>
        </defs>
        <path d="M 50 16 Q 52 8 60 12 Q 56 20 50 18 Z" fill="#2ed573" />
        <ellipse cx="50" cy="54" rx="30" ry="34" fill="url(#plumGrad)" filter="drop-shadow(0 5px 6px rgba(0,0,0,0.55))"/>
        <path d="M 50 22 C 48 40 48 65 52 86" stroke="#371a6e" stroke-width="2.5" fill="none" opacity="0.6"/>
        <ellipse cx="38" cy="40" rx="9" ry="4" fill="#ffffff" opacity="0.55" transform="rotate(-25 38 40)"/>
      </svg>
    `,
    watermelon: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg">
        <defs>
          <radialGradient id="melonFlesh" cx="40%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#ff7675" />
            <stop offset="50%" stop-color="#d63031" />
            <stop offset="100%" stop-color="#8a0000" />
          </radialGradient>
        </defs>
        <path d="M 15 35 A 42 42 0 0 0 85 35 Z" fill="#009432" stroke="#2ed573" stroke-width="4.5" filter="drop-shadow(0 5px 6px rgba(0,0,0,0.6))"/>
        <path d="M 18 36 A 38 38 0 0 0 82 36 Z" fill="#f5f6fa" />
        <path d="M 22 37 A 34 34 0 0 0 78 37 Z" fill="url(#melonFlesh)" />
        <!-- Seeds -->
        <circle cx="34" cy="45" r="2.2" fill="#1e272e" />
        <circle cx="50" cy="52" r="2.2" fill="#1e272e" />
        <circle cx="66" cy="45" r="2.2" fill="#1e272e" />
        <circle cx="42" cy="58" r="2.2" fill="#1e272e" />
        <circle cx="58" cy="58" r="2.2" fill="#1e272e" />
        <ellipse cx="32" cy="38" rx="8" ry="2.5" fill="#ffffff" opacity="0.45" />
      </svg>
    `,
    grapes: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg">
        <defs>
          <radialGradient id="grapeOrb" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#d980fa" />
            <stop offset="45%" stop-color="#9980fa" />
            <stop offset="90%" stop-color="#5758bb" />
            <stop offset="100%" stop-color="#1b1464" />
          </radialGradient>
        </defs>
        <path d="M 50 10 C 46 18 42 22 46 28" stroke="#10ac84" stroke-width="4" fill="none" />
        <path d="M 50 14 Q 70 8 72 22 Q 58 26 50 18 Z" fill="#2ed573" />
        <!-- Clustered Grapes -->
        <g filter="drop-shadow(0 4px 5px rgba(0,0,0,0.55))">
          <circle cx="38" cy="34" r="11" fill="url(#grapeOrb)" />
          <circle cx="62" cy="34" r="11" fill="url(#grapeOrb)" />
          <circle cx="50" cy="38" r="11.5" fill="url(#grapeOrb)" />
          <circle cx="32" cy="50" r="11" fill="url(#grapeOrb)" />
          <circle cx="50" cy="54" r="11.5" fill="url(#grapeOrb)" />
          <circle cx="68" cy="50" r="11" fill="url(#grapeOrb)" />
          <circle cx="41" cy="68" r="11" fill="url(#grapeOrb)" />
          <circle cx="59" cy="68" r="11" fill="url(#grapeOrb)" />
          <circle cx="50" cy="82" r="10.5" fill="url(#grapeOrb)" />
        </g>
      </svg>
    `,
    seven: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg sym-seven">
        <defs>
          <linearGradient id="goldEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffeaa7" />
            <stop offset="40%" stop-color="#fdcb6e" />
            <stop offset="70%" stop-color="#e17055" />
            <stop offset="100%" stop-color="#d63031" />
          </linearGradient>
          <linearGradient id="rubySeven" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff7675" />
            <stop offset="30%" stop-color="#d63031" />
            <stop offset="80%" stop-color="#8a0000" />
            <stop offset="100%" stop-color="#3d0000" />
          </linearGradient>
          <filter id="sevenGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#ff7675" flood-opacity="0.7"/>
          </filter>
        </defs>
        <!-- Chrome Bezel -->
        <path d="M 18 16 L 82 16 L 82 28 L 52 86 L 36 86 L 64 30 L 18 30 Z" fill="url(#goldEdge)" filter="url(#sevenGlow)" />
        <!-- Ruby Inset -->
        <path d="M 22 20 L 78 20 L 78 26 L 49 82 L 40 82 L 67 27 L 22 27 Z" fill="url(#rubySeven)" />
        <!-- Highlight Shimmer -->
        <polygon points="25,21 75,21 73,24 25,24" fill="#ffffff" opacity="0.75" />
      </svg>
    `,
    star: `
      <svg viewBox="0 0 100 100" class="egt-sym-svg sym-star">
        <defs>
          <radialGradient id="starGold" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="25%" stop-color="#ffeaa7" />
            <stop offset="60%" stop-color="#fdcb6e" />
            <stop offset="85%" stop-color="#e67e22" />
            <stop offset="100%" stop-color="#964000" />
          </radialGradient>
          <filter id="starGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ffd32a" flood-opacity="0.85"/>
          </filter>
        </defs>
        <polygon points="50,8 62,35 92,37 68,56 76,85 50,69 24,85 32,56 8,37 38,35" 
          fill="url(#starGold)" stroke="#f39c12" stroke-width="2" filter="url(#starGlow)" />
        <!-- Inner facets for authentic 3D gem look -->
        <polygon points="50,8 50,69 62,35" fill="#ffffff" opacity="0.3" />
        <polygon points="50,8 50,69 38,35" fill="#e67e22" opacity="0.4" />
        <polygon points="92,37 50,69 68,56" fill="#f39c12" opacity="0.35" />
        <polygon points="8,37 50,69 32,56" fill="#ffffff" opacity="0.25" />
      </svg>
    `
  };

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
      this.dom.betStepBtn = document.getElementById('superhot-btn-bet');
      this.dom.betDisplay = document.getElementById('superhot-val-bet');
      this.dom.totalBetDisplay = document.getElementById('superhot-val-totalbet');
      this.dom.winDisplay = document.getElementById('superhot-val-win');
      this.dom.balanceDisplay = document.getElementById('superhot-val-balance');
      this.dom.spinBtn = document.getElementById('superhot-btn-spin');
      this.dom.gambleBtn = document.getElementById('superhot-btn-gamble');
      this.dom.autoBtn = document.getElementById('superhot-btn-auto');
      this.dom.stopButtons = document.querySelectorAll('.superhot-micro-stop');

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

      if (this.dom.betStepBtn) {
        this.dom.betStepBtn.addEventListener('click', () => {
          if (this.isSpinning) return;
          this.stepBet();
        });
      }

      if (this.dom.spinBtn) {
        this.dom.spinBtn.addEventListener('click', () => {
          if (this.isSpinning) {
            this.slamStop();
          } else {
            this.handleSpin();
          }
        });
      }

      if (this.dom.gambleBtn) {
        this.dom.gambleBtn.addEventListener('click', () => {
          if (this.currentWin > 0 && !this.isSpinning) {
            this.openGambleModal();
          }
        });
      }

      if (this.dom.autoBtn) {
        this.dom.autoBtn.addEventListener('click', () => {
          this.toggleAutoSpin();
        });
      }

      if (this.dom.stopButtons) {
        this.dom.stopButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const reelIdx = parseInt(e.currentTarget.getAttribute('data-reel'), 10);
            this.stopSingleReel(reelIdx);
          });
        });
      }

      // Allow clicking on any spinning reel directly to stop it
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

      this.clearPaylineHighlights();
      this.renderGrid();
      this.updateConsoleUI();
    }

    stepBet() {
      const curIdx = this.betLevels.indexOf(this.lineBet);
      const nextIdx = (curIdx + 1) % this.betLevels.length;
      this.lineBet = this.betLevels[nextIdx];
      if (this.audio) this.audio.playReelStop(2);
      this.updateConsoleUI();
    }

    updateConsoleUI() {
      const totalBet = this.lineBet * this.selectedLines;

      if (this.dom.linesButtons) {
        this.dom.linesButtons.forEach(btn => {
          const l = parseInt(btn.getAttribute('data-lines'), 10);
          btn.classList.toggle('active', l === this.selectedLines);
        });
      }

      if (this.dom.betDisplay) this.dom.betDisplay.textContent = `${this.lineBet} ZLT`;
      if (this.dom.totalBetDisplay) this.dom.totalBetDisplay.textContent = `${totalBet} ZLT`;
      if (this.dom.winDisplay) this.dom.winDisplay.textContent = `${this.currentWin} ZLT`;
      if (this.dom.balanceDisplay && this.wallet) {
        this.dom.balanceDisplay.textContent = `${Math.floor(this.wallet.balance || 0)} ZLT`;
      }

      if (this.dom.gambleBtn) {
        const canGamble = (this.currentWin > 0 && this.currentWin <= totalBet * 35 && !this.isSpinning);
        this.dom.gambleBtn.disabled = !canGamble;
        this.dom.gambleBtn.classList.toggle('ready', canGamble);
      }

      if (this.dom.spinBtn) {
        if (this.isSpinning) {
          this.dom.spinBtn.textContent = 'STOP';
          this.dom.spinBtn.classList.add('is-stopping');
        } else {
          this.dom.spinBtn.textContent = 'START';
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

        const reelTrack = document.createElement('div');
        reelTrack.className = 'superhot-reel-track';

        for (let row = 0; row < rows; row++) {
          const symId = this.currentMatrix[r][row] || 'cherry';
          const cell = document.createElement('div');
          cell.className = `superhot-cell cell-${r}-${row} sym-${symId}`;
          cell.setAttribute('data-reel', r);
          cell.setAttribute('data-row', row);
          cell.innerHTML = `
            <div class="superhot-sym-wrapper">
              ${SYMBOL_SVGS[symId] || ''}
            </div>
            <div class="flame-particle-layer"></div>
          `;
          reelTrack.appendChild(cell);
        }

        reelCol.appendChild(reelTrack);
        this.dom.grid.appendChild(reelCol);
      }
    }

    handleSpin() {
      if (this.isSpinning) return;
      const totalBet = this.lineBet * this.selectedLines;

      if (this.wallet && this.wallet.balance < totalBet) {
        if (window.slotNotifications) {
          window.slotNotifications.show('Nemate dovoljno ZLT kredita za ovaj ulog!', 'error');
        }
        this.isAutoSpinning = false;
        return;
      }

      // Deduct bet
      if (this.wallet) {
        this.wallet.balance -= totalBet;
        this.wallet.updateUI();
      }
      if (this.wallet && typeof this.wallet.recordTurnover === 'function') {
        this.wallet.recordTurnover(totalBet);
      }

      this.currentWin = 0;
      this.clearPaylineHighlights();
      this.updateConsoleUI();

      this.isSpinning = true;
      this.reelStates = ['spinning', 'spinning', 'spinning', 'spinning', 'spinning'];

      // Pre-evaluate spin outcome
      const outcomeMatrix = this.engine.generateSpinMatrix(this.selectedLines);
      this.lastEvaluation = this.engine.evaluateSpin(outcomeMatrix, this.selectedLines, this.lineBet);

      // Start reel spin animations in DOM
      for (let r = 0; r < 5; r++) {
        const reelEl = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="${r}"]`);
        if (reelEl) {
          reelEl.classList.add('is-spinning');
          reelEl.classList.remove('has-suspense');
        }
      }

      // Play tick sound loop
      this.spinAudioInterval = setInterval(() => {
        if (this.isSpinning && this.audio) {
          this.audio.playReelTick();
        }
      }, 70);

      // Schedule natural reel stopping times
      const baseStops = [800, 1100, 1400, 1700, 2000];

      // If suspense trigger: slow down reels 4 and 5
      if (this.lastEvaluation.suspenseTrigger) {
        baseStops[3] = 2600;
        baseStops[4] = 3400;
        setTimeout(() => {
          if (this.isSpinning && this.reelStates[3] === 'spinning') {
            const reel4 = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="3"]`);
            const reel5 = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="4"]`);
            if (reel4) reel4.classList.add('has-suspense');
            if (reel5) reel5.classList.add('has-suspense');
            if (this.audio) this.audio.startSuspense();
          }
        }, 1450);
      }

      for (let r = 0; r < 5; r++) {
        this.reelTimers[r] = setTimeout(() => {
          this.stopSingleReel(r);
        }, baseStops[r]);
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

      // Update symbols for this reel in currentMatrix
      const { rows } = this.engine.getGridDimensions(this.selectedLines);
      for (let row = 0; row < rows; row++) {
        this.currentMatrix[reelIdx][row] = this.lastEvaluation.matrix[reelIdx][row];
      }

      // Update DOM
      const reelEl = this.dom.grid.querySelector(`.superhot-reel-column[data-reel-index="${reelIdx}"]`);
      if (reelEl) {
        reelEl.classList.remove('is-spinning');
        reelEl.classList.remove('has-suspense');
        const cells = reelEl.querySelectorAll('.superhot-cell');
        cells.forEach((cell, row) => {
          const symId = this.currentMatrix[reelIdx][row];
          cell.className = `superhot-cell cell-${reelIdx}-${row} sym-${symId}`;
          const wrap = cell.querySelector('.superhot-sym-wrapper');
          if (wrap) wrap.innerHTML = SYMBOL_SVGS[symId] || '';
        });
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
      for (let r = 0; r < 5; r++) {
        if (this.reelStates[r] === 'spinning') {
          this.stopSingleReel(r);
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
          this.wallet.balance += this.currentWin;
          this.wallet.updateUI();
        }

        // Trigger Flaming Reels Effect
        this.triggerFlamingReels(evalResult);

        // Sound
        if (this.audio) {
          this.audio.playFlameWhoosh();
          const tier = this.currentWin >= (evalResult.totalBet * 10) ? 'big' : 'normal';
          this.audio.playWinFanfare(tier);
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
        }, this.currentWin > 0 ? 2200 : 800);
      }
    }

    triggerFlamingReels(evalResult) {
      // Highlight winning positions with flame animation
      evalResult.winningPositions.forEach(pos => {
        const cell = this.dom.grid.querySelector(`.superhot-cell[data-reel="${pos.reel}"][data-row="${pos.row}"]`);
        if (cell) {
          cell.classList.add('flaming-symbol');
        }
      });

      // Draw active payline laser on canvas
      this.drawPaylines(evalResult.winningLines);
    }

    clearPaylineHighlights() {
      if (this.dom.grid) {
        const flaming = this.dom.grid.querySelectorAll('.flaming-symbol');
        flaming.forEach(el => el.classList.remove('flaming-symbol'));
      }
      if (this.dom.canvas) {
        const ctx = this.dom.canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
      }
    }

    drawPaylines(winningLines) {
      if (!this.dom.canvas || !winningLines || winningLines.length === 0) return;
      const canvas = this.dom.canvas;
      const rect = this.dom.grid.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colW = canvas.width / 5;
      const { rows } = this.engine.getGridDimensions(this.selectedLines);
      const rowH = canvas.height / rows;

      const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#e056fd', '#f1c40f', '#00d2d3'];

      winningLines.forEach((line, idx) => {
        const color = colors[idx % colors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
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
      });
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
          this.wallet.balance += addedWin;
          this.wallet.updateUI();
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
          this.wallet.balance = Math.max(0, this.wallet.balance - this.currentWin);
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
