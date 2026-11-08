/**
 * Grand Slot Club - European Royal Roulette (Evropski Rulet Profesional)
 * 
 * Premier Single-Zero European Casino Roulette Engine
 * Features:
 * - 37 Pockets (0 green, 1-36 alternating red/black) in authentic European cylinder sequence
 * - Full European Table Layout with Complete Inside & Outside Betting:
 *   * Straight Up (Plein - 35:1)
 *   * Split (Cheval - 17:1) - Horizontal, Vertical, and 0-Splits
 *   * Street (Transversale Pleine - 11:1) & Trios (0-1-2, 0-2-3)
 *   * Corner / Square (Carré - 8:1) & First Four (0-1-2-3)
 *   * Six Line / Double Street (Transversale Simple - 5:1)
 *   * Dozens (1-12, 13-24, 25-36 - 2:1) & Columns (Col 1, Col 2, Col 3 - 2:1)
 *   * Even Chances (Red/Black, Even/Odd, 1-18/19-36 - 1:1)
 * - Authentic Serbian / French Call Bets & Racetrack (Francuski Oval):
 *   * Mala Serija (Tiers du Cylindre - 6 žetona)
 *   * Velika Serija (Voisins du Zéro - 9 žetona)
 *   * Nulta Serija (Jeu Zéro - 4 žetona)
 *   * Orfelini (Orphelins - 5 žetona)
 *   * Krunice / Komšije (Neighbors - Broj + 2 suseda levo i desno = 5 žetona)
 * - Multi-layer 60FPS Canvas Wheel Physics:
 *   * Polished Rosewood outer bowl with brass beveling
 *   * Ball raceway with 8 brass rhombus deflectors
 *   * Spinning rotor with metallic frets, deep pockets, and turning crosshead turret
 *   * Decelerating ball physics, deflector collision bounces, fret hops, and locked pocket settle
 * - Synthesized Audio Engine (raceway rolling, deflector ticks, fret clatter, and win fanfare)
 * - Fullscreen Scalable Architecture (Auto-scaling on mobile, tablet, and widescreen desktop)
 * - Dynamic Hover & Tap Highlighting across both Felt and Racetrack
 * - Rebet, 2X, Clear, and Undo actions
 * - Integrated with Wallet & Player Tracker
 */

// European Roulette Wheel Number Sequence (clockwise on physical cylinder)
const ROULETTE_WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

if (typeof window !== 'undefined') {
  window.ROULETTE_WHEEL_NUMBERS = ROULETTE_WHEEL_NUMBERS;
  window.RED_NUMBERS = RED_NUMBERS;
}

class RoyalRouletteGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.isSpinning = false;
    this.selectedChip = 20; // 10, 20, 50, 100, 500, 1000

    // Bets storage: spotId -> { amount: number, type: string, numbers: number[], label: string }
    this.bets = {};
    this.lastBets = {};
    this.betHistoryStack = []; // For Undo functionality

    // Racetrack settings
    this.neighborCount = 2; // "Krunica" radius (2 left + number + 2 right = 5 numbers)
    this.activeViewTab = 'table'; // 'table' | 'oval' | 'wheel'

    // History & Stats
    this.history = [17, 4, 0, 32, 15, 29, 7, 12, 36, 21];

    // Canvas & Physics
    this.viewContainer = document.getElementById('roulette-game-view');
    this.canvasEl = document.getElementById('roulette-wheel-canvas');
    this.ctx = null;
    this.animFrameId = null;

    this.wheelAngle = 0;
    this.ballAngle = 0;
    this.ballRadius = 0;
    this.isBallSettled = false;
    this.winningNumber = 0;

    // Web Audio Synthesizer Context
    this.audioCtx = null;

    this.bindEvents();
  }

  getNumberColor(num) {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  }

  /* ==========================================================================
     DOM Event Binding & Controls
     ========================================================================== */
  bindEvents() {
    // 1. Chip Selector
    const chips = document.querySelectorAll('.roulette-chip-opt');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.isSpinning) return;
        chips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedChip = Number(chip.getAttribute('data-value')) || 20;
        this.playClick();
      });
    });

    // 2. View Mode Tabs (Sto, Oval / Serije, Točak)
    const viewTabs = document.querySelectorAll('.roulette-view-tab');
    viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-tab');
        if (mode) this.switchViewTab(mode);
      });
    });

    // 3. Action Buttons
    const btnSpin = document.getElementById('btn-roulette-spin');
    if (btnSpin) btnSpin.addEventListener('click', () => this.spin());

    const btnClear = document.getElementById('btn-roulette-clear');
    if (btnClear) btnClear.addEventListener('click', () => this.clearBets());

    const btnDouble = document.getElementById('btn-roulette-double');
    if (btnDouble) btnDouble.addEventListener('click', () => this.doubleBets());

    const btnRebet = document.getElementById('btn-roulette-rebet');
    if (btnRebet) btnRebet.addEventListener('click', () => this.rebet());

    const btnUndo = document.getElementById('btn-roulette-undo');
    if (btnUndo) btnUndo.addEventListener('click', () => this.undoLastBet());

    // 4. Series Call Bets (Mala, Velika, Nulta, Orfelini)
    const seriesBtns = document.querySelectorAll('.btn-series-call');
    seriesBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isSpinning) return;
        const seriesType = btn.getAttribute('data-series');
        if (seriesType) this.placeSeriesBet(seriesType);
      });
    });

    // 5. Neighbors Stepper (+ / -)
    const btnNeighMinus = document.getElementById('roulette-neigh-minus');
    const btnNeighPlus = document.getElementById('roulette-neigh-plus');
    if (btnNeighMinus) {
      btnNeighMinus.addEventListener('click', () => {
        if (this.neighborCount > 1) {
          this.neighborCount--;
          this.updateNeighborDisplay();
          this.playClick();
        }
      });
    }
    if (btnNeighPlus) {
      btnNeighPlus.addEventListener('click', () => {
        if (this.neighborCount < 4) {
          this.neighborCount++;
          this.updateNeighborDisplay();
          this.playClick();
        }
      });
    }

    // 6. Interactive Table Felt & Hit Zones
    this.bindTableFeltInteractions();

    // 7. Interactive Racetrack / Oval Numbers
    this.bindRacetrackInteractions();

    // Responsive Canvas Resize
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', () => {
        if (this.isActive) this.initCanvas();
      });
    }
  }

  updateNeighborDisplay() {
    const valEl = document.getElementById('roulette-neigh-val');
    if (valEl) valEl.textContent = `±${this.neighborCount}`;
  }

  switchViewTab(tabMode) {
    this.activeViewTab = tabMode;
    const viewTabs = document.querySelectorAll('.roulette-view-tab');
    viewTabs.forEach(t => {
      const isCurrent = t.getAttribute('data-tab') === tabMode;
      t.classList.toggle('active', isCurrent);
      t.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    const feltSection = document.getElementById('roulette-felt-section');
    const ovalSection = document.getElementById('roulette-oval-section');
    const wheelSection = document.getElementById('roulette-wheel-zoom-section');
    const panel = document.querySelector('.roulette-cabinet-panel');

    if (panel) {
      panel.classList.toggle('view-table-active', tabMode === 'table');
      panel.classList.toggle('view-oval-active', tabMode === 'oval');
      panel.classList.toggle('view-wheel-active', tabMode === 'wheel');
    }

    if (feltSection) feltSection.style.display = (tabMode === 'table') ? 'flex' : 'none';
    if (ovalSection) ovalSection.style.display = (tabMode === 'oval') ? 'flex' : 'none';
    if (wheelSection) wheelSection.style.display = (tabMode === 'wheel') ? 'flex' : 'none';

    this.playClick();
    setTimeout(() => this.initCanvas(), 40);
  }

  /* ==========================================================================
     High-Resolution Canvas Wheel Initialization & 3D Shading
     ========================================================================== */
  initCanvas() {
    this.canvasEl = document.getElementById('roulette-wheel-canvas');
    if (!this.canvasEl) return;

    const rect = this.canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const isWheelMode = this.activeViewTab === 'wheel';

    let displaySize;
    if (isWheelMode) {
      const screenBound = typeof window !== 'undefined' ? window.innerWidth : 800;
      displaySize = Math.min(440, Math.max(280, Math.floor(screenBound * 0.88)));
    } else {
      displaySize = Math.min(260, Math.max(200, Math.floor(rect.width || 240)));
    }

    this.canvasEl.width = displaySize * dpr;
    this.canvasEl.height = displaySize * dpr;
    this.canvasEl.style.width = `${displaySize}px`;
    this.canvasEl.style.height = `${displaySize}px`;

    this.ctx = this.canvasEl.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvasSize = displaySize;

    this.drawWheel(this.wheelAngle, this.ballAngle, this.ballRadius, this.isBallSettled, this.winningNumber);
  }

  mount() {
    this.isActive = true;
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }

    this.initCanvas();
    this.renderHistory();
    this.updateNeighborDisplay();
    this.updateTotalBetDisplay();
    this.switchViewTab('table');
  }

  unmount() {
    this.isActive = false;
    this.isSpinning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
  }

  forceExit() {
    this.isSpinning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /* ==========================================================================
     Betting Mathematics, Placements & Serbian Call Bets
     ========================================================================== */
  bindTableFeltInteractions() {
    const tableContainer = document.getElementById('roulette-felt-section');
    if (!tableContainer) return;

    // Direct delegation for all betting spots (Numbers, Splits, Corners, Streets, Outside)
    tableContainer.addEventListener('click', (e) => {
      if (this.isSpinning) return;
      const target = e.target.closest('.roulette-spot');
      if (!target) return;

      const spotId = target.getAttribute('data-spot');
      const spotType = target.getAttribute('data-type') || 'straight';
      const numsRaw = target.getAttribute('data-nums') || '';
      const numbers = numsRaw ? numsRaw.split(',').map(Number) : [];

      if (spotId && numbers.length > 0) {
        this.addBet(spotId, spotType, numbers, target);
      }
    });

    // Hover Highlight Over Table Numbers
    tableContainer.addEventListener('mouseover', (e) => {
      const target = e.target.closest('.roulette-spot');
      if (!target) {
        this.clearNumberHighlights();
        return;
      }
      const numsRaw = target.getAttribute('data-nums') || '';
      if (numsRaw) {
        const nums = numsRaw.split(',').map(Number);
        this.highlightNumbers(nums);
      }
    });

    tableContainer.addEventListener('mouseleave', () => {
      this.clearNumberHighlights();
    });
  }

  bindRacetrackInteractions() {
    const ovalContainer = document.getElementById('roulette-oval-section');
    if (!ovalContainer) return;

    const FRENCH_SERIES_NUMBERS = {
      mala: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
      velika: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
      nula: [12, 35, 3, 26, 0, 32, 15],
      orfelini: [1, 20, 14, 31, 9, 17, 34, 6]
    };

    // Clicking an individual number or sector on the oval
    ovalContainer.addEventListener('click', (e) => {
      if (this.isSpinning) return;

      // Sector Zone click inside the oval
      const sectorTarget = e.target.closest('.racetrack-sector-zone');
      if (sectorTarget) {
        const seriesType = sectorTarget.getAttribute('data-series');
        if (seriesType) {
          this.placeSeriesBet(seriesType);
          return;
        }
      }

      // Individual number click (Krunica / Neighbors)
      const numTarget = e.target.closest('.racetrack-number-btn');
      if (numTarget) {
        const num = Number(numTarget.getAttribute('data-num'));
        if (!isNaN(num)) {
          this.placeNeighborBet(num);
        }
      }
    });

    // Hover on oval highlights the numbers
    ovalContainer.addEventListener('mouseover', (e) => {
      // Sector Zone or Series Button hover
      const sectorTarget = e.target.closest('.racetrack-sector-zone, .btn-series-call');
      if (sectorTarget) {
        const seriesType = sectorTarget.getAttribute('data-series');
        if (seriesType && FRENCH_SERIES_NUMBERS[seriesType]) {
          this.highlightNumbers(FRENCH_SERIES_NUMBERS[seriesType]);
          return;
        }
      }

      // Individual number hover (shows krunica / neighbors halo)
      const numTarget = e.target.closest('.racetrack-number-btn');
      if (numTarget) {
        const num = Number(numTarget.getAttribute('data-num'));
        if (!isNaN(num)) {
          const neighbors = this.getWheelNeighbors(num, this.neighborCount);
          this.highlightNumbers(neighbors);
        }
      }
    });

    ovalContainer.addEventListener('mouseleave', () => {
      this.clearNumberHighlights();
    });
  }

  highlightNumbers(nums) {
    this.clearNumberHighlights();
    nums.forEach(n => {
      const feltEls = document.querySelectorAll(`.roulette-spot[data-spot="num_${n}"]`);
      feltEls.forEach(el => el.classList.add('spot-preview-highlight'));
      const ovalEls = document.querySelectorAll(`.racetrack-number-btn[data-num="${n}"]`);
      ovalEls.forEach(el => el.classList.add('oval-preview-highlight'));
    });
  }

  clearNumberHighlights() {
    document.querySelectorAll('.spot-preview-highlight').forEach(el => el.classList.remove('spot-preview-highlight'));
    document.querySelectorAll('.oval-preview-highlight').forEach(el => el.classList.remove('oval-preview-highlight'));
  }

  addBet(spotId, type, numbers, element = null) {
    if (!this.wallet) return;

    if (this.wallet.balance < this.selectedChip) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Nemate dovoljno ZLT kredita za ovaj čip!', 'normal');
      }
      return;
    }

    // Deduct from wallet
    this.wallet.balance -= this.selectedChip;
    this.wallet.updateUI();

    if (!this.bets[spotId]) {
      const el = element || (typeof document !== 'undefined' && typeof document.querySelector === 'function' ? document.querySelector(`.roulette-spot[data-spot="${spotId}"]`) : null);
      this.bets[spotId] = {
        spotId,
        type,
        numbers,
        amount: 0,
        element: el
      };
    }

    this.bets[spotId].amount += this.selectedChip;
    this.betHistoryStack.push({ spotId, amount: this.selectedChip });

    this.renderChipBadge(this.bets[spotId]);
    this.updateTotalBetDisplay();
    this.playChipClick();
  }

  renderChipBadge(bet) {
    const el = bet.element || (typeof document !== 'undefined' && typeof document.querySelector === 'function' ? document.querySelector(`.roulette-spot[data-spot="${bet.spotId}"]`) : null);
    if (!el) return;

    let badge = el.querySelector('.roulette-chip-marker');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'roulette-chip-marker';
      el.appendChild(badge);
    }

    const amt = bet.amount;
    badge.textContent = amt >= 1000 ? `${(amt / 1000).toFixed(1)}k` : amt;
    badge.dataset.val = amt;
  }

  /* ==========================================================================
     Serbian Call Bets (Francuske Serije & Krunica)
     ========================================================================== */
  getWheelNeighbors(centerNum, count = 2) {
    const idx = ROULETTE_WHEEL_NUMBERS.indexOf(centerNum);
    if (idx === -1) return [centerNum];

    const len = ROULETTE_WHEEL_NUMBERS.length;
    const result = [];
    for (let i = -count; i <= count; i++) {
      const targetIdx = (idx + i + len) % len;
      result.push(ROULETTE_WHEEL_NUMBERS[targetIdx]);
    }
    return result;
  }

  placeNeighborBet(centerNum) {
    const neighbors = this.getWheelNeighbors(centerNum, this.neighborCount);
    const totalCost = neighbors.length * this.selectedChip;

    if (this.wallet.balance < totalCost) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage(`⚠️ Za Krunicu oko ${centerNum} (±${this.neighborCount}) potrebno je ${totalCost} ZLT!`, 'normal');
      }
      return;
    }

    neighbors.forEach(num => {
      this.addBet(`num_${num}`, 'straight', [num]);
    });

    if (typeof window.slotApp?.showMessage === 'function') {
      window.slotApp.showMessage(`👑 Krunica oko broja ${centerNum} postavljena (5 brojeva, ${totalCost} ZLT)!`, 'normal');
    }
  }

  placeSeriesBet(series) {
    const chip = this.selectedChip;

    if (series === 'mala') {
      // Mala Serija (Tiers du Cylindre) - 6 žetona na 6 splitova:
      // 5/8, 10/11, 13/16, 23/24, 27/30, 33/36
      const cost = chip * 6;
      if (this.wallet.balance < cost) {
        if (typeof window.slotApp?.showMessage === 'function') {
          window.slotApp.showMessage(`⚠️ Za Malu Seriju potrebno je ${cost} ZLT (6 žetona)!`, 'normal');
        }
        return;
      }
      this.addBet('split_5_8', 'split', [5, 8]);
      this.addBet('split_10_11', 'split', [10, 11]);
      this.addBet('split_13_16', 'split', [13, 16]);
      this.addBet('split_23_24', 'split', [23, 24]);
      this.addBet('split_27_30', 'split', [27, 30]);
      this.addBet('split_33_36', 'split', [33, 36]);
      this.showMessage(`🎰 Postavljena MALA SERIJA (Tiers - 12 brojeva, ${cost} ZLT)!`);

    } else if (series === 'velika') {
      // Velika Serija (Voisins du Zéro) - 9 žetona:
      // 2 na Trio 0/2/3, 1 na 4/7, 1 na 12/15, 1 na 18/21, 1 na 19/22, 2 na Carré 25/26/28/29, 1 na 32/35
      const cost = chip * 9;
      if (this.wallet.balance < cost) {
        if (typeof window.slotApp?.showMessage === 'function') {
          window.slotApp.showMessage(`⚠️ Za Veliku Seriju potrebno je ${cost} ZLT (9 žetona)!`, 'normal');
        }
        return;
      }
      // 2 chips on Trio 0/2/3
      this.addBet('trio_0_2_3', 'trio', [0, 2, 3]);
      this.addBet('trio_0_2_3', 'trio', [0, 2, 3]);
      // 1 on splits
      this.addBet('split_4_7', 'split', [4, 7]);
      this.addBet('split_12_15', 'split', [12, 15]);
      this.addBet('split_18_21', 'split', [18, 21]);
      this.addBet('split_19_22', 'split', [19, 22]);
      // 2 on Corner 25-29
      this.addBet('corner_25_26_28_29', 'corner', [25, 26, 28, 29]);
      this.addBet('corner_25_26_28_29', 'corner', [25, 26, 28, 29]);
      // 1 on split 32/35
      this.addBet('split_32_35', 'split', [32, 35]);
      this.showMessage(`🎰 Postavljena VELIKA SERIJA (Voisins - 17 brojeva, ${cost} ZLT)!`);

    } else if (series === 'nula') {
      // Nulta Serija (Jeu Zéro) - 4 žetona:
      // 1 na Plein 26, 1 na Split 0/3, 1 na Split 12/15, 1 na Split 32/35
      const cost = chip * 4;
      if (this.wallet.balance < cost) {
        if (typeof window.slotApp?.showMessage === 'function') {
          window.slotApp.showMessage(`⚠️ Za Nultu Seriju potrebno je ${cost} ZLT (4 žetona)!`, 'normal');
        }
        return;
      }
      this.addBet('num_26', 'straight', [26]);
      this.addBet('split_0_3', 'split', [0, 3]);
      this.addBet('split_12_15', 'split', [12, 15]);
      this.addBet('split_32_35', 'split', [32, 35]);
      this.showMessage(`🎰 Postavljena NULTA SERIJA (Zero Spiel - 7 brojeva, ${cost} ZLT)!`);

    } else if (series === 'orfelini') {
      // Orfelini (Orphelins) - 5 žetona:
      // 1 na Plein 1, 1 na Split 6/9, 1 na Split 14/17, 1 na Split 17/20, 1 na Split 31/34
      const cost = chip * 5;
      if (this.wallet.balance < cost) {
        if (typeof window.slotApp?.showMessage === 'function') {
          window.slotApp.showMessage(`⚠️ Za Orfeline potrebno je ${cost} ZLT (5 žetona)!`, 'normal');
        }
        return;
      }
      this.addBet('num_1', 'straight', [1]);
      this.addBet('split_6_9', 'split', [6, 9]);
      this.addBet('split_14_17', 'split', [14, 17]);
      this.addBet('split_17_20', 'split', [17, 20]);
      this.addBet('split_31_34', 'split', [31, 34]);
      this.showMessage(`🎰 Postavljeni ORFELINI (Orphelins - 8 brojeva, ${cost} ZLT)!`);
    }
  }

  showMessage(msg) {
    const banner = document.getElementById('roulette-status-banner');
    if (banner) {
      banner.textContent = msg;
      banner.className = 'roulette-status-banner normal';
    }
  }

  /* ==========================================================================
     Bet Clearing, Doubling, Rebet, Undo
     ========================================================================== */
  clearBets() {
    if (this.isSpinning) return;
    const totalBet = Object.values(this.bets).reduce((sum, b) => sum + b.amount, 0);
    if (totalBet > 0 && this.wallet) {
      this.wallet.balance += totalBet;
      this.wallet.updateUI();
    }
    this.bets = {};
    this.betHistoryStack = [];
    document.querySelectorAll('.roulette-chip-marker').forEach(m => m.remove());
    this.updateTotalBetDisplay();
    this.playClick();
  }

  doubleBets() {
    if (this.isSpinning) return;
    const totalBet = Object.values(this.bets).reduce((sum, b) => sum + b.amount, 0);
    if (totalBet === 0) return;

    if (this.wallet.balance < totalBet) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Nemate dovoljno kredita za dupliranje!', 'normal');
      }
      return;
    }

    this.wallet.balance -= totalBet;
    this.wallet.updateUI();

    Object.values(this.bets).forEach(bet => {
      bet.amount *= 2;
      this.renderChipBadge(bet);
    });

    this.updateTotalBetDisplay();
    this.playClick();
  }

  rebet() {
    if (this.isSpinning) return;
    if (Object.keys(this.lastBets).length === 0) return;

    this.clearBets();
    const needed = Object.values(this.lastBets).reduce((sum, b) => sum + b.amount, 0);

    if (this.wallet.balance < needed) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Nemate dovoljno kredita za ponavljanje prethodnog uloga!', 'normal');
      }
      return;
    }

    this.wallet.balance -= needed;
    this.wallet.updateUI();

    this.bets = JSON.parse(JSON.stringify(this.lastBets));
    Object.values(this.bets).forEach(b => {
      this.renderChipBadge(b);
    });

    this.updateTotalBetDisplay();
    this.playClick();
  }

  undoLastBet() {
    if (this.isSpinning) return;
    if (this.betHistoryStack.length === 0) return;

    const last = this.betHistoryStack.pop();
    if (!last || !this.bets[last.spotId]) return;

    this.wallet.balance += last.amount;
    this.wallet.updateUI();

    this.bets[last.spotId].amount -= last.amount;
    if (this.bets[last.spotId].amount <= 0) {
      const el = (typeof document !== 'undefined' && typeof document.querySelector === 'function') ? document.querySelector(`.roulette-spot[data-spot="${last.spotId}"]`) : null;
      if (el) {
        const marker = el.querySelector('.roulette-chip-marker');
        if (marker) marker.remove();
      }
      delete this.bets[last.spotId];
    } else {
      this.renderChipBadge(this.bets[last.spotId]);
    }

    this.updateTotalBetDisplay();
    this.playClick();
  }

  updateTotalBetDisplay() {
    const total = Object.values(this.bets).reduce((sum, b) => sum + b.amount, 0);
    const betEl = document.getElementById('roulette-total-bet');
    if (betEl) betEl.textContent = `${total.toLocaleString()} ZLT`;
  }

  /* ==========================================================================
     Realistic 3D Wheel Physics & Rendering Engine
     ========================================================================== */
  drawWheel(wheelAngle, ballAngle, ballRadiusNorm, isSettled, winNum) {
    if (!this.ctx || !this.canvasEl) return;
    const ctx = this.ctx;
    const size = this.canvasSize;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.48;

    ctx.clearRect(0, 0, size, size);

    // 1. Polished Mahogany Outer Bowl Rim
    const woodGrad = ctx.createRadialGradient(cx, cy, outerR * 0.75, cx, cy, outerR);
    woodGrad.addColorStop(0, '#1c0e06');
    woodGrad.addColorStop(0.35, '#3b1c0b');
    woodGrad.addColorStop(0.7, '#241006');
    woodGrad.addColorStop(1, '#110602');

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = woodGrad;
    ctx.fill();

    // Outer Brass Trim & Specular Reflection
    ctx.lineWidth = 3.5;
    const brassGrad = ctx.createLinearGradient(0, 0, size, size);
    brassGrad.addColorStop(0, '#ffd700');
    brassGrad.addColorStop(0.3, '#aa771c');
    brassGrad.addColorStop(0.5, '#fff6a9');
    brassGrad.addColorStop(0.8, '#aa771c');
    brassGrad.addColorStop(1, '#8b6508');
    ctx.strokeStyle = brassGrad;
    ctx.stroke();

    // 2. Ball Raceway Track
    const trackR = outerR * 0.90;
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0503';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.stroke();

    // 8 Brass Rhombus Deflectors (Diamond frets around the bowl)
    for (let d = 0; d < 8; d++) {
      const defAngle = (d * Math.PI) / 4;
      const defR = outerR * 0.81;
      const dx = cx + Math.cos(defAngle) * defR;
      const dy = cy + Math.sin(defAngle) * defR;

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(defAngle + Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fillStyle = '#ffe066';
      ctx.fill();
      ctx.strokeStyle = '#8b6508';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Rotating Rotor Assembly
    const rotorR = outerR * 0.74;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wheelAngle);

    // Pocket ring
    const pocketStep = (Math.PI * 2) / 37;
    const pocketInnerR = rotorR * 0.65;

    for (let i = 0; i < 37; i++) {
      const pAngle = i * pocketStep;
      const num = ROULETTE_WHEEL_NUMBERS[i];
      const color = this.getNumberColor(num);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rotorR, pAngle, pAngle + pocketStep);
      ctx.closePath();

      if (color === 'green') ctx.fillStyle = '#059669';
      else if (color === 'red') ctx.fillStyle = '#dc2626';
      else ctx.fillStyle = '#18181b';
      ctx.fill();

      // Pocket fret separators
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Number Typography
      ctx.save();
      ctx.rotate(pAngle + pocketStep / 2);
      ctx.translate(rotorR * 0.84, 0);
      ctx.rotate(Math.PI / 2);

      ctx.font = 'bold 9px "Cinzel", serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(String(num), 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Inner Metallic Cone & Turret
    const turretGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, pocketInnerR);
    turretGrad.addColorStop(0, '#fef08a');
    turretGrad.addColorStop(0.3, '#d4af37');
    turretGrad.addColorStop(0.7, '#854d0e');
    turretGrad.addColorStop(1, '#3b1c06');

    ctx.beginPath();
    ctx.arc(0, 0, pocketInnerR, 0, Math.PI * 2);
    ctx.fillStyle = turretGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Concentric Lathe Brass Rings
    ctx.beginPath();
    ctx.arc(0, 0, pocketInnerR * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, pocketInnerR * 0.45, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4 Turret Arms (Crosshead Spindle with 3D drop shadow & brass gradient)
    for (let a = 0; a < 4; a++) {
      const armA = (a * Math.PI) / 2;
      ctx.save();
      ctx.rotate(armA);

      // Arm Cast Shadow
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(pocketInnerR * 0.68, 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Brass Arm Bar
      const armGrad = ctx.createLinearGradient(0, -2, 0, 2);
      armGrad.addColorStop(0, '#fef9c3');
      armGrad.addColorStop(0.5, '#eab308');
      armGrad.addColorStop(1, '#713f12');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pocketInnerR * 0.68, 0);
      ctx.strokeStyle = armGrad;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Arm Brass Finial Knob
      ctx.beginPath();
      ctx.arc(pocketInnerR * 0.68, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    }

    // Center Antique Brass Finial Acorn (Soft Spherical Shading - Zero Harsh Glare)
    const acornGrad = ctx.createRadialGradient(-2.5, -2.5, 1, 0, 0, 9);
    acornGrad.addColorStop(0, '#fffbeb');
    acornGrad.addColorStop(0.3, '#facc15');
    acornGrad.addColorStop(0.6, '#a16207');
    acornGrad.addColorStop(1, '#451a03');
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = acornGrad;
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore(); // Exit rotor translation

    // 4. The Ivory Ball (During Spin or Settled)
    if (this.isSpinning || isSettled) {
      const currentBallR = outerR * (ballRadiusNorm || 0.88);
      const bx = cx + Math.cos(ballAngle) * currentBallR;
      const by = cy + Math.sin(ballAngle) * currentBallR;

      // Ball Drop Shadow on wood
      ctx.beginPath();
      ctx.arc(bx + 2, by + 3, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();

      // Ball Sphere with 3D Specular Highlight
      const ballGrad = ctx.createRadialGradient(bx - 1.5, by - 1.5, 1, bx, by, 5);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.5, '#f8fafc');
      ballGrad.addColorStop(1, '#94a3b8');

      ctx.beginPath();
      ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  /* ==========================================================================
     Spin Action & Multi-Phase Physics
     ========================================================================== */
  spin() {
    if (this.isSpinning) return;

    const totalBet = Object.values(this.bets).reduce((sum, b) => sum + b.amount, 0);
    if (totalBet === 0) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Postavite uloge na stolu ili ovalu pre okretanja!', 'normal');
      }
      return;
    }

    this.isSpinning = true;
    this.isBallSettled = false;
    this.lastBets = JSON.parse(JSON.stringify(this.bets));

    const btnSpin = document.getElementById('btn-roulette-spin');
    if (btnSpin) {
      btnSpin.disabled = true;
      btnSpin.classList.add('spinning');
    }

    // Pick winning number (0-36)
    const winNum = Math.floor(Math.random() * 37);
    this.winningNumber = winNum;

    // Target pocket index in the sequence
    const winPocketIndex = ROULETTE_WHEEL_NUMBERS.indexOf(winNum);
    const pocketStep = (Math.PI * 2) / 37;

    // Auto-switch to live wheel / table zoom on mobile
    if (window.innerWidth < 960 && this.activeViewTab !== 'table') {
      this.switchViewTab('table');
    }

    // Physics parameters
    let startTime = performance.now();
    const duration = 4800; // 4.8s realistic casino spin duration
    let wheelVelocity = 0.045; // Rotor spins clockwise
    let initialBallVelocity = -0.22; // Ball launches counter-clockwise

    this.playBallTrackWhoosh();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Phase 1: High speed orbital raceway (0 -> 50% time)
      // Phase 2: Deceleration & drop down deflectors (50% -> 80% time)
      // Phase 3: Fret bounces and settles into pocket (80% -> 100% time)

      let currentBallR = 0.89; // Default on raceway track
      let ballSpeed = initialBallVelocity * (1 - Math.pow(progress, 2.2));

      if (progress > 0.50 && progress <= 0.82) {
        // Dropping down the deflectors
        const dropProg = (progress - 0.50) / 0.32;
        currentBallR = 0.89 - dropProg * 0.16;
        if (Math.random() < 0.15) {
          this.playFretClick();
          currentBallR += (Math.random() - 0.5) * 0.04; // Micro-jitter on deflector impact
        }
      } else if (progress > 0.82) {
        // In the pocket ring: bouncing over frets
        const fretProg = (progress - 0.82) / 0.18;
        const targetR = 0.72; // Settled pocket depth
        const hopHeight = 0.06 * (1 - fretProg);
        currentBallR = targetR + Math.abs(Math.sin(fretProg * Math.PI * 5)) * hopHeight;

        if (Math.random() < 0.25) this.playFretClick();
      }

      this.wheelAngle += wheelVelocity * (1 - progress * 0.65);
      this.ballAngle += ballSpeed;

      this.ballRadius = currentBallR;

      if (progress < 1) {
        this.drawWheel(this.wheelAngle, this.ballAngle, this.ballRadius, false, winNum);
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        // Locked in pocket: calculate exact angular alignment
        this.isSpinning = false;
        this.isBallSettled = true;

        // Position ball inside the exact winning pocket
        const pocketAngle = this.wheelAngle + (winPocketIndex * pocketStep) + pocketStep / 2;
        this.ballAngle = pocketAngle;
        this.ballRadius = 0.72;

        this.drawWheel(this.wheelAngle, this.ballAngle, this.ballRadius, true, winNum);
        this.finishSpin(winNum);
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  /* ==========================================================================
     Payout Evaluation & Winning Presentation
     ========================================================================== */
  finishSpin(winNum) {
    const btnSpin = document.getElementById('btn-roulette-spin');
    if (btnSpin) {
      btnSpin.disabled = false;
      btnSpin.classList.remove('spinning');
    }

    this.history.unshift(winNum);
    this.renderHistory();

    const winColor = this.getNumberColor(winNum);
    const colorLabel = winColor === 'green' ? 'ZELENA NULA' : (winColor === 'red' ? 'CRVENO' : 'CRNO');

    // Evaluate all placed bets
    let totalWon = 0;
    const winningBets = [];

    Object.values(this.bets).forEach(bet => {
      let isHit = false;
      let mult = 0;

      if (bet.numbers.includes(winNum)) {
        isHit = true;
        if (bet.type === 'straight') mult = 36;
        else if (bet.type === 'split') mult = 18;
        else if (bet.type === 'street' || bet.type === 'trio') mult = 12;
        else if (bet.type === 'corner') mult = 9;
        else if (bet.type === 'sixline') mult = 6;
      }

      // Outside Bets Evaluation
      if (bet.spotId === 'color_red' && winColor === 'red') { isHit = true; mult = 2; }
      else if (bet.spotId === 'color_black' && winColor === 'black') { isHit = true; mult = 2; }
      else if (bet.spotId === 'even' && winNum !== 0 && winNum % 2 === 0) { isHit = true; mult = 2; }
      else if (bet.spotId === 'odd' && winNum !== 0 && winNum % 2 !== 0) { isHit = true; mult = 2; }
      else if (bet.spotId === 'low' && winNum >= 1 && winNum <= 18) { isHit = true; mult = 2; }
      else if (bet.spotId === 'high' && winNum >= 19 && winNum <= 36) { isHit = true; mult = 2; }
      else if (bet.spotId === 'dozen_1' && winNum >= 1 && winNum <= 12) { isHit = true; mult = 3; }
      else if (bet.spotId === 'dozen_2' && winNum >= 13 && winNum <= 24) { isHit = true; mult = 3; }
      else if (bet.spotId === 'dozen_3' && winNum >= 25 && winNum <= 36) { isHit = true; mult = 3; }
      else if (bet.spotId === 'col_1' && winNum > 0 && winNum % 3 === 1) { isHit = true; mult = 3; }
      else if (bet.spotId === 'col_2' && winNum > 0 && winNum % 3 === 2) { isHit = true; mult = 3; }
      else if (bet.spotId === 'col_3' && winNum > 0 && winNum % 3 === 0) { isHit = true; mult = 3; }

      if (isHit && mult > 0) {
        const winVal = bet.amount * mult;
        totalWon += winVal;
        winningBets.push({ bet, winVal });
      }
    });

    const statusBanner = document.getElementById('roulette-status-banner');

    if (totalWon > 0) {
      this.wallet.balance += totalWon;
      this.wallet.updateUI();

      this.playWinChime();
      if (window.particleEngine && window.particleEngine.burst) window.particleEngine.burst(300, 250);

      // Highlight winning bets with glowing gold pulse
      winningBets.forEach(({ bet }) => {
        const el = document.querySelector(`.roulette-spot[data-spot="${bet.spotId}"]`);
        if (el) el.classList.add('winning-spot-glow');
      });

      if (statusBanner) {
        statusBanner.textContent = `🎯 POBEDNIK: ${winNum} (${colorLabel})! DOBITAK: +${totalWon.toLocaleString()} ZLT!`;
        statusBanner.className = 'roulette-status-banner win';
      }

      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage(`🏆 EVROPSKI RULET: Broj ${winNum} ${colorLabel}! Dobitak: +${totalWon.toLocaleString()} ZLT!`, 'jackpot');
      }

      if (window.slotApp?.playerTracker) {
        window.slotApp.playerTracker.recordSpin('roulette', Object.values(this.bets).reduce((s, b) => s + b.amount, 0), totalWon);
      }
    } else {
      if (statusBanner) {
        statusBanner.textContent = `🎯 POBEDNIČKI BROJ: ${winNum} (${colorLabel}). Nema dobitka u ovoj rundi.`;
        statusBanner.className = 'roulette-status-banner normal';
      }

      if (window.slotApp?.playerTracker) {
        window.slotApp.playerTracker.recordSpin('roulette', Object.values(this.bets).reduce((s, b) => s + b.amount, 0), 0);
      }
    }

    // Clear bets table after display interval
    setTimeout(() => {
      document.querySelectorAll('.winning-spot-glow').forEach(el => el.classList.remove('winning-spot-glow'));
      document.querySelectorAll('.roulette-chip-marker').forEach(m => m.remove());
      this.bets = {};
      this.betHistoryStack = [];
      this.updateTotalBetDisplay();
    }, 3500);
  }

  renderHistory() {
    const list = document.getElementById('roulette-history-list');
    if (list) {
      list.innerHTML = this.history.slice(0, 14).map((n, idx) => {
        const col = this.getNumberColor(n);
        return `<span class="roulette-hist-pill pill-${col} ${idx === 0 ? 'hist-latest' : ''}">${n}</span>`;
      }).join('');
    }

    // Compute simple statistics
    const statsRedEl = document.getElementById('roulette-stat-red');
    const statsBlackEl = document.getElementById('roulette-stat-black');
    if (statsRedEl && statsBlackEl) {
      const nonZero = this.history.filter(n => n !== 0);
      const reds = nonZero.filter(n => this.getNumberColor(n) === 'red').length;
      const total = nonZero.length || 1;
      const redPct = Math.round((reds / total) * 100);
      statsRedEl.textContent = `${redPct}% CRVENO`;
      statsBlackEl.textContent = `${100 - redPct}% CRNO`;
    }

    // Hot & Cold Numbers
    const hotEl = document.getElementById('roulette-hot-numbers');
    const coldEl = document.getElementById('roulette-cold-numbers');
    if (hotEl) {
      const freq = {};
      this.history.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
      const sorted = Object.keys(freq).map(Number).sort((a, b) => freq[b] - freq[a]);
      const hotList = sorted.slice(0, 5);
      if (hotList.length < 5) {
        [17, 32, 0, 29, 21].forEach(fallback => {
          if (!hotList.includes(fallback) && hotList.length < 5) hotList.push(fallback);
        });
      }
      hotEl.innerHTML = hotList.map(n => {
        const c = this.getNumberColor(n);
        return `<span class="roulette-hist-pill pill-${c}">${n}</span>`;
      }).join('');
    }
    if (coldEl) {
      const coldList = [5, 23, 11, 35, 8].filter(n => !this.history.slice(0, 6).includes(n)).slice(0, 5);
      coldEl.innerHTML = coldList.map(n => {
        const c = this.getNumberColor(n);
        return `<span class="roulette-hist-pill pill-${c}">${n}</span>`;
      }).join('');
    }
  }

  /* ==========================================================================
     Audio Synthesizers (Raceway Rolling, Deflector Tick, Win Bell)
     ========================================================================== */
  initAudio() {
    try {
      if (window.slotAudio && window.slotAudio.ctx) {
        this.audioCtx = window.slotAudio.ctx;
      } else if (!this.audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) this.audioCtx = new AudioClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (_) {}
  }

  playClick() {
    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }
  }

  playChipClick() {
    this.initAudio();
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (_) {}
  }

  playFretClick() {
    this.initAudio();
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.03);
    } catch (_) {}
  }

  playBallTrackWhoosh() {
    this.initAudio();
    if (!this.audioCtx) return;
    try {
      // Noise buffer for raceway friction
      const bufferSize = this.audioCtx.sampleRate * 2.5;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.05;
      }
      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 2.5);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.09, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 2.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      whiteNoise.start();
    } catch (_) {}
  }

  playWinChime() {
    if (window.slotAudio && window.slotAudio.playBigWin) {
      window.slotAudio.playBigWin();
      return;
    }
    this.initAudio();
    if (!this.audioCtx) return;
    try {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime + i * 0.12);
        osc.stop(this.audioCtx.currentTime + i * 0.12 + 0.45);
      });
    } catch (_) {}
  }
}

window.RoyalRouletteGame = RoyalRouletteGame;
