/**
 * Grand Royal Video Poker (Jacks or Better & Retro Aparat Poker)
 * Official GrandSlot Salon Edition
 * 
 * Features:
 * - Authentic 52-card single deck with Fisher-Yates shuffle
 * - Standard 9/6 Jacks or Better Paytable (up to 800x for Royal Flush)
 * - Dynamic Neon-Glow Paytable highlighting winning hand in real time
 * - Two-Phase Game Loop: DEAL -> HOLD (Interactive or Smart-Hold AI) -> DRAW
 * - Smart-Hold Assistant: automatically pre-holds winning combinations
 * - Retro Red/Black Gamble (Crveno/Crno Kocka) with multi-level doubling (up to 5x)
 * - Last 5 Gamble Cards History strip
 * - Full Web Audio API acoustic card deal, hold beep, and victory arpeggios
 * - Integrated with Central Wallet, Daily Missions and Lobby switcher
 */

const VP_SUITS = [
  { name: 'spades', symbol: '♠', color: 'black' },
  { name: 'hearts', symbol: '♥', color: 'red' },
  { name: 'diamonds', symbol: '♦', color: 'red' },
  { name: 'clubs', symbol: '♣', color: 'black' }
];

const VP_RANKS = [
  { rank: '2', val: 2 },
  { rank: '3', val: 3 },
  { rank: '4', val: 4 },
  { rank: '5', val: 5 },
  { rank: '6', val: 6 },
  { rank: '7', val: 7 },
  { rank: '8', val: 8 },
  { rank: '9', val: 9 },
  { rank: '10', val: 10 },
  { rank: 'J', val: 11 },
  { rank: 'Q', val: 12 },
  { rank: 'K', val: 13 },
  { rank: 'A', val: 14 }
];

const VP_PAYTABLE = [
  { id: 'royal_flush', name: 'ROYAL FLUSH', mult: 800 },
  { id: 'straight_flush', name: 'STRAIGHT FLUSH', mult: 50 },
  { id: 'four_of_a_kind', name: 'POKER (4 OF A KIND)', mult: 25 },
  { id: 'full_house', name: 'FULL HOUSE (FUL)', mult: 9 },
  { id: 'flush', name: 'FLUSH (BOJA)', mult: 6 },
  { id: 'straight', name: 'STRAIGHT (KENTA)', mult: 4 },
  { id: 'three_of_a_kind', name: 'TRILING (3 OF A KIND)', mult: 3 },
  { id: 'two_pair', name: 'DVA PARA (TWO PAIR)', mult: 2 },
  { id: 'jacks_or_better', name: 'JACKS OR BETTER (J+)', mult: 1 }
];

class RoyalVideoPokerGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.gameState = 'betting'; // 'betting', 'hold_phase', 'round_over', 'gamble_phase'

    this.currentBet = 20;
    this.minBet = 10;
    this.maxBet = 2000;

    // Deck & Hand
    this.deck = [];
    this.hand = []; // 5 cards
    this.heldIndices = [false, false, false, false, false];

    // Current Payout & Evaluation
    this.lastWinAmount = 0;
    this.currentWinningHand = null;

    // Gamble (Crveno/Crno) State
    this.gamblePool = 0;
    this.gambleStreak = 0;
    this.gambleMaxStreak = 5;
    this.gambleHistory = ['hearts', 'spades', 'diamonds', 'clubs', 'hearts'];
    this.gambleFlashing = false;
    this.gambleFlashTimer = null;

    // Audio & Timers
    this.audioCtx = null;
    this.activeTimers = [];

    // DOM References
    this.viewContainer = typeof document !== 'undefined' ? document.getElementById('videopoker-game-view') : null;
    this.paytableRows = {};
    this.cardContainers = [];
    this.holdBadges = [];

    if (typeof document !== 'undefined') {
      this.initDOM();
    }
  }

  /* ==========================================================================
     Deck Engine & Shuffling
     ========================================================================== */
  initDeck() {
    this.deck = [];
    for (const suit of VP_SUITS) {
      for (const r of VP_RANKS) {
        this.deck.push({
          suit: suit.name,
          symbol: suit.symbol,
          color: suit.color,
          rank: r.rank,
          val: r.val,
          id: `vp_${suit.name}_${r.rank}_${Math.random().toString(36).substr(2, 4)}`
        });
      }
    }
    this.shuffleDeck();
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCardFromDeck() {
    if (this.deck.length === 0) {
      this.initDeck();
    }
    return this.deck.pop();
  }

  /* ==========================================================================
     Lifecycle: Mount / Unmount
     ========================================================================== */
  mount() {
    this.isActive = true;
    if (!this.viewContainer) {
      this.viewContainer = document.getElementById('videopoker-game-view');
    }
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }
    this.resetRound(true);
    this.updateBetDisplay();
    this.updatePaytableDisplay();
    this.setMessage('POSTAVITE OPKLADU I PRITISNITE PODELI');
  }

  unmount() {
    this.isActive = false;
    this.clearAllTimers();
    this.stopGambleFlasher();
    if (!this.viewContainer) {
      this.viewContainer = document.getElementById('videopoker-game-view');
    }
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
    this.hideGambleModal();
  }

  forceExit() {
    this.unmount();
  }

  schedule(fn, delay) {
    const tid = setTimeout(() => {
      if (!this.isActive) return;
      fn();
    }, delay);
    this.activeTimers.push(tid);
    return tid;
  }

  clearAllTimers() {
    this.activeTimers.forEach(tid => clearTimeout(tid));
    this.activeTimers = [];
  }

  /* ==========================================================================
     Main Action Handler (Spin Button integration)
     ========================================================================== */
  handleMainAction() {
    if (this.gameState === 'betting') {
      this.startDeal();
    } else if (this.gameState === 'hold_phase') {
      this.drawRemainingCards();
    } else if (this.gameState === 'round_over') {
      if (this.lastWinAmount > 0) {
        this.collectWin();
      } else {
        this.resetRound();
        this.startDeal();
      }
    }
  }

  /* ==========================================================================
     Round Flow: Deal -> Hold -> Draw -> Payout
     ========================================================================== */
  startDeal() {
    // If coming from a previous round, win result or lose result, safely reset and collect
    if (this.gameState === 'round_over' || this.gameState === 'win_result' || this.gameState === 'lose_result') {
      if (this.lastWinAmount > 0) {
        if (this.wallet && typeof this.wallet.addWin === 'function') {
          this.wallet.addWin(this.lastWinAmount);
        }
        this.lastWinAmount = 0;
      }
      this.resetRound();
    }

    if (this.gameState !== 'betting') return;

    // Check balance
    if (this.wallet && typeof this.wallet.bet === 'function') {
      const ok = this.wallet.bet(this.currentBet);
      if (!ok) {
        this.setMessage('NEDOVOLJNO SREDSTAVA NA RAČUNU!');
        this.playErrorSound();
        return;
      }
    }

    this.gameState = 'dealing';
    this.lastWinAmount = 0;
    this.currentWinningHand = null;
    this.clearPaytableHighlight();
    this.heldIndices = [false, false, false, false, false];
    this.updateHoldBadges();
    this.initDeck();

    this.setMessage('DELJENJE KARATA...');
    this.hand = [];

    // Deal 5 cards with staggered sound & flip animation
    for (let i = 0; i < 5; i++) {
      this.hand.push(this.drawCardFromDeck());
    }

    this.renderInitialCards();
    this.playShuffleSound();

    this.schedule(() => {
      this.gameState = 'hold_phase';
      this.applySmartHold();
      this.updateControlsForPhase('hold_phase');
      this.setMessage('IZABERITE KARTE ZA ZADRŽAVANJE (HOLD) PA PRITISNITE IZVUCI');
    }, 600);
  }

  toggleHold(index) {
    if (this.gameState !== 'hold_phase') return;
    if (index < 0 || index >= 5) return;

    this.heldIndices[index] = !this.heldIndices[index];
    this.updateHoldBadges();
    this.playHoldSound();

    // Visual card lift on hold
    const cardEl = this.cardContainers[index];
    if (cardEl) {
      if (this.heldIndices[index]) {
        cardEl.classList.add('is-held');
      } else {
        cardEl.classList.remove('is-held');
      }
    }
  }

  applySmartHold() {
    // Evaluate initial 5-card hand
    const evalResult = this.evaluateHand(this.hand);
    if (evalResult.handId) {
      // Made hand: auto-hold cards involved
      evalResult.heldIndices.forEach(idx => {
        this.heldIndices[idx] = true;
      });
      this.highlightPaytableRow(evalResult.handId);
    } else {
      // Look for 4 to a Royal, Straight Flush, or 4 to a Flush
      const suitsCount = {};
      this.hand.forEach((c, idx) => {
        suitsCount[c.suit] = suitsCount[c.suit] || [];
        suitsCount[c.suit].push(idx);
      });
      for (const s in suitsCount) {
        if (suitsCount[s].length === 4) {
          suitsCount[s].forEach(idx => { this.heldIndices[idx] = true; });
          break;
        }
      }
      // Or hold any high cards (J, Q, K, A)
      if (!this.heldIndices.some(h => h)) {
        this.hand.forEach((c, idx) => {
          if (c.val >= 11) this.heldIndices[idx] = true;
        });
      }
    }

    this.updateHoldBadges();
    for (let i = 0; i < 5; i++) {
      const cardEl = this.cardContainers[i];
      if (cardEl) {
        if (this.heldIndices[i]) cardEl.classList.add('is-held');
        else cardEl.classList.remove('is-held');
      }
    }
  }

  drawRemainingCards() {
    if (this.gameState !== 'hold_phase') return;

    this.gameState = 'drawing';
    this.setMessage('IZVLAČENJE NOVIH KARATA...');
    this.updateControlsForPhase('drawing');

    // Replace unheld cards
    for (let i = 0; i < 5; i++) {
      if (!this.heldIndices[i]) {
        this.hand[i] = this.drawCardFromDeck();
      }
    }

    this.playCardDealSound();
    this.renderDrawnCards();

    this.schedule(() => {
      this.evaluateFinalResult();
    }, 500);
  }

  evaluateFinalResult() {
    const result = this.evaluateHand(this.hand);

    if (result.handId) {
      this.gameState = 'win_result';
      this.currentWinningHand = result;
      this.lastWinAmount = this.currentBet * result.multiplier;
      this.highlightPaytableRow(result.handId);
      this.setMessage(`DOBITAK: ${result.name} • +${this.lastWinAmount} ZLT!`);
      this.playWinSound();

      // Show Gamble / Collect buttons
      this.updateControlsForPhase('win_result');
    } else {
      this.lastWinAmount = 0;
      this.currentWinningHand = null;
      this.gameState = 'betting';
      this.setMessage('NEMA DOBITKA. PROBAJTE PONOVO!');
      this.updateControlsForPhase('betting');
    }
  }

  collectWin() {
    if (this.lastWinAmount <= 0) {
      this.resetRound();
      return;
    }

    const won = this.lastWinAmount;
    if (this.wallet && typeof this.wallet.addWin === 'function') {
      this.wallet.addWin(won);
    }
    this.lastWinAmount = 0;
    this.setMessage(`ISPLAĆENO +${won} ZLT!`);
    this.playCollectSound();
    this.resetRound();
  }

  resetRound(showCardBacks = false) {
    this.gameState = 'betting';
    this.heldIndices = [false, false, false, false, false];
    this.updateHoldBadges();
    this.clearPaytableHighlight();
    for (let i = 0; i < 5; i++) {
      if (this.cardContainers[i]) {
        this.cardContainers[i].classList.remove('is-held', 'is-winning', 'card-just-drawn');
        if (showCardBacks) {
          this.cardContainers[i].innerHTML = this.buildCardBackHTML();
        }
      }
    }
    this.updateControlsForPhase('betting');
  }

  /* ==========================================================================
     Hand Evaluation Engine (Jacks or Better)
     ========================================================================== */
  evaluateHand(cards) {
    if (!cards || cards.length !== 5) return { handId: null, name: null, multiplier: 0, heldIndices: [] };

    const sorted = [...cards].map((c, i) => ({ ...c, originalIndex: i })).sort((a, b) => a.val - b.val);
    const vals = sorted.map(c => c.val);
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);

    // Check Straight (including Ace-low straight A-2-3-4-5)
    let isStraight = false;
    let isAceLowStraight = false;
    if (
      vals[4] - vals[3] === 1 &&
      vals[3] - vals[2] === 1 &&
      vals[2] - vals[1] === 1 &&
      vals[1] - vals[0] === 1
    ) {
      isStraight = true;
    } else if (
      vals[0] === 2 && vals[1] === 3 && vals[2] === 4 && vals[3] === 5 && vals[4] === 14
    ) {
      isStraight = true;
      isAceLowStraight = true;
    }

    // Rank Counts
    const counts = {};
    cards.forEach((c, idx) => {
      counts[c.val] = counts[c.val] || [];
      counts[c.val].push(idx);
    });
    const countEntries = Object.entries(counts).sort((a, b) => b[1].length - a[1].length);

    // 1. Royal Flush: Flush + Straight 10-J-Q-K-A
    if (isFlush && isStraight && vals[0] === 10 && vals[4] === 14) {
      return { handId: 'royal_flush', name: 'ROYAL FLUSH', multiplier: 800, heldIndices: [0, 1, 2, 3, 4] };
    }

    // 2. Straight Flush
    if (isFlush && isStraight) {
      return { handId: 'straight_flush', name: 'STRAIGHT FLUSH', multiplier: 50, heldIndices: [0, 1, 2, 3, 4] };
    }

    // 3. Four of a Kind (Poker)
    if (countEntries[0][1].length === 4) {
      return { handId: 'four_of_a_kind', name: 'POKER (4 OF A KIND)', multiplier: 25, heldIndices: countEntries[0][1] };
    }

    // 4. Full House
    if (countEntries[0][1].length === 3 && countEntries[1][1].length === 2) {
      return { handId: 'full_house', name: 'FULL HOUSE (FUL)', multiplier: 9, heldIndices: [0, 1, 2, 3, 4] };
    }

    // 5. Flush
    if (isFlush) {
      return { handId: 'flush', name: 'FLUSH (BOJA)', multiplier: 6, heldIndices: [0, 1, 2, 3, 4] };
    }

    // 6. Straight
    if (isStraight) {
      return { handId: 'straight', name: 'STRAIGHT (KENTA)', multiplier: 4, heldIndices: [0, 1, 2, 3, 4] };
    }

    // 7. Three of a Kind (Triling)
    if (countEntries[0][1].length === 3) {
      return { handId: 'three_of_a_kind', name: 'TRILING (3 OF A KIND)', multiplier: 3, heldIndices: countEntries[0][1] };
    }

    // 8. Two Pair
    if (countEntries[0][1].length === 2 && countEntries[1][1].length === 2) {
      return { handId: 'two_pair', name: 'DVA PARA', multiplier: 2, heldIndices: [...countEntries[0][1], ...countEntries[1][1]] };
    }

    // 9. Jacks or Better (Pair of J, Q, K, A)
    if (countEntries[0][1].length === 2 && parseInt(countEntries[0][0], 10) >= 11) {
      return { handId: 'jacks_or_better', name: 'JACKS OR BETTER (J+)', multiplier: 1, heldIndices: countEntries[0][1] };
    }

    return { handId: null, name: null, multiplier: 0, heldIndices: [] };
  }

  /* ==========================================================================
     Gamble (Crveno / Crno) Mode
     ========================================================================== */
  openGamble() {
    if (this.lastWinAmount <= 0) return;

    this.gameState = 'gamble_phase';
    this.gamblePool = this.lastWinAmount;
    this.gambleStreak = 0;

    const modal = document.getElementById('vp-gamble-modal');
    if (modal) modal.style.display = 'flex';

    this.updateGambleUI();
    this.startGambleFlasher();
    this.playGambleOpenSound();
  }

  startGambleFlasher() {
    this.gambleFlashing = true;
    const flasherEl = document.getElementById('vp-gamble-flash-card');
    if (!flasherEl) return;

    let isRed = false;
    this.gambleFlashTimer = setInterval(() => {
      isRed = !isRed;
      flasherEl.className = isRed ? 'vp-flash-card red-flash' : 'vp-flash-card black-flash';
      flasherEl.innerHTML = isRed ? '♥️' : '♠️';
    }, 120);
  }

  stopGambleFlasher() {
    this.gambleFlashing = false;
    if (this.gambleFlashTimer) {
      clearInterval(this.gambleFlashTimer);
      this.gambleFlashTimer = null;
    }
  }

  chooseGambleColor(chosenColor) {
    if (this.gameState !== 'gamble_phase' || !this.gambleFlashing) return;

    this.stopGambleFlasher();

    // Draw random card
    const randomSuit = VP_SUITS[Math.floor(Math.random() * VP_SUITS.length)];
    const randomRank = VP_RANKS[Math.floor(Math.random() * VP_RANKS.length)];
    const drawnColor = randomSuit.color;

    // Display drawn card
    const flasherEl = document.getElementById('vp-gamble-flash-card');
    if (flasherEl) {
      flasherEl.className = `vp-flash-card final-reveal ${drawnColor}`;
      flasherEl.innerHTML = `<span>${randomRank.rank}</span><span>${randomSuit.symbol}</span>`;
    }

    // Update history
    this.gambleHistory.unshift(randomSuit.name);
    if (this.gambleHistory.length > 5) this.gambleHistory.pop();
    this.updateGambleHistoryUI();

    const isWin = drawnColor === chosenColor;

    this.schedule(() => {
      if (isWin) {
        this.gamblePool *= 2;
        this.gambleStreak++;
        this.lastWinAmount = this.gamblePool;
        this.playWinSound();

        const msgEl = document.getElementById('vp-gamble-msg');
        if (msgEl) {
          msgEl.textContent = `POGODAK! NOVI DOBITAK: ${this.gamblePool} ZLT!`;
          msgEl.className = 'vp-gamble-status win';
        }

        if (this.gambleStreak >= this.gambleMaxStreak) {
          // Auto collect on max streak
          this.schedule(() => {
            this.collectGambleWin();
          }, 1200);
        } else {
          // Allow another gamble or collect
          this.schedule(() => {
            this.startGambleFlasher();
            this.updateGambleUI();
          }, 800);
        }
      } else {
        // Loss
        this.gamblePool = 0;
        this.lastWinAmount = 0;
        this.playErrorSound();

        const msgEl = document.getElementById('vp-gamble-msg');
        if (msgEl) {
          msgEl.textContent = 'PROMAŠAJ! VIŠE SREĆE DRUGI PUT.';
          msgEl.className = 'vp-gamble-status lose';
        }

        this.schedule(() => {
          this.hideGambleModal();
          this.resetRound();
        }, 1400);
      }
    }, 450);
  }

  collectGambleWin() {
    this.stopGambleFlasher();
    if (this.gamblePool > 0) {
      if (this.wallet && typeof this.wallet.addWin === 'function') {
        this.wallet.addWin(this.gamblePool);
      }
      this.playCollectSound();
    }
    this.hideGambleModal();
    this.resetRound();
  }

  hideGambleModal() {
    this.stopGambleFlasher();
    const modal = document.getElementById('vp-gamble-modal');
    if (modal) modal.style.display = 'none';
  }

  updateGambleUI() {
    const curWinEl = document.getElementById('vp-gamble-current-win');
    const dblWinEl = document.getElementById('vp-gamble-double-win');
    const streakEl = document.getElementById('vp-gamble-streak');

    if (curWinEl) curWinEl.textContent = `${this.gamblePool} ZLT`;
    if (dblWinEl) dblWinEl.textContent = `${this.gamblePool * 2} ZLT`;
    if (streakEl) streakEl.textContent = `${this.gambleStreak}/${this.gambleMaxStreak}`;

    const msgEl = document.getElementById('vp-gamble-msg');
    if (msgEl) {
      msgEl.textContent = 'IZABERITE CRVENU ILI CRNU';
      msgEl.className = 'vp-gamble-status';
    }

    this.updateGambleHistoryUI();
  }

  updateGambleHistoryUI() {
    const historyWrap = document.getElementById('vp-gamble-history-strip');
    if (!historyWrap) return;

    historyWrap.innerHTML = '';
    this.gambleHistory.forEach(suitName => {
      const item = document.createElement('div');
      const isRed = suitName === 'hearts' || suitName === 'diamonds';
      item.className = `vp-history-chip ${isRed ? 'red' : 'black'}`;
      item.textContent = isRed ? '♦' : '♠';
      historyWrap.appendChild(item);
    });
  }

  /* ==========================================================================
     DOM Rendering & Card UI
     ========================================================================== */
  initDOM() {
    // Paytable rows
    VP_PAYTABLE.forEach(pt => {
      const el = document.getElementById(`vp-row-${pt.id}`);
      if (el) this.paytableRows[pt.id] = el;
    });

    // 5 Card slots
    for (let i = 0; i < 5; i++) {
      const cardEl = document.getElementById(`vp-card-${i}`);
      const holdEl = document.getElementById(`vp-hold-${i}`);
      if (cardEl) {
        this.cardContainers.push(cardEl);
        cardEl.addEventListener('click', () => this.toggleHold(i));
      }
      if (holdEl) {
        this.holdBadges.push(holdEl);
        holdEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleHold(i);
        });
      }
    }

    // Bet Stepper & Quick Bet Buttons
    const btnMinus = document.getElementById('vp-bet-minus');
    const btnPlus = document.getElementById('vp-bet-plus');
    const btnMax = document.getElementById('vp-bet-max');

    if (btnMinus) btnMinus.addEventListener('click', () => this.adjustBet(-10));
    if (btnPlus) btnPlus.addEventListener('click', () => this.adjustBet(10));
    if (btnMax) btnMax.addEventListener('click', () => this.setBet(this.maxBet));

    // Phase Action Buttons
    const btnDeal = document.getElementById('btn-vp-deal');
    const btnDraw = document.getElementById('btn-vp-draw');
    const btnGamble = document.getElementById('btn-vp-gamble');
    const btnCollect = document.getElementById('btn-vp-collect');

    if (btnDeal) btnDeal.addEventListener('click', () => this.startDeal());
    if (btnDraw) btnDraw.addEventListener('click', () => this.drawRemainingCards());
    if (btnGamble) btnGamble.addEventListener('click', () => this.openGamble());
    if (btnCollect) btnCollect.addEventListener('click', () => this.collectWin());

    // Gamble Modal Buttons
    const btnGambleRed = document.getElementById('btn-vp-gamble-red');
    const btnGambleBlack = document.getElementById('btn-vp-gamble-black');
    const btnGambleCollect = document.getElementById('btn-vp-gamble-collect');

    if (btnGambleRed) btnGambleRed.addEventListener('click', () => this.chooseGambleColor('red'));
    if (btnGambleBlack) btnGambleBlack.addEventListener('click', () => this.chooseGambleColor('black'));
    if (btnGambleCollect) btnGambleCollect.addEventListener('click', () => this.collectGambleWin());
  }

  adjustBet(delta) {
    if (this.gameState === 'win_result') {
      this.collectWin();
    } else if (this.gameState === 'round_over' || this.gameState === 'lose_result') {
      this.resetRound();
    }
    if (this.gameState !== 'betting') return;
    this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, this.currentBet + delta));
    this.updateBetDisplay();
    this.updatePaytableDisplay();
    this.playChipSound();
  }

  setBet(amt) {
    if (this.gameState === 'win_result') {
      this.collectWin();
    } else if (this.gameState === 'round_over' || this.gameState === 'lose_result') {
      this.resetRound();
    }
    if (this.gameState !== 'betting') return;
    this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, amt));
    this.updateBetDisplay();
    this.updatePaytableDisplay();
    this.playChipSound();
  }

  updateBetDisplay() {
    const betValEl = document.getElementById('vp-bet-val');
    if (betValEl) betValEl.textContent = this.currentBet;
  }

  updatePaytableDisplay() {
    VP_PAYTABLE.forEach(pt => {
      const payoutValEl = document.getElementById(`vp-payout-${pt.id}`);
      if (payoutValEl) {
        payoutValEl.textContent = (this.currentBet * pt.mult).toLocaleString();
      }
    });
  }

  highlightPaytableRow(handId) {
    this.clearPaytableHighlight();
    const rowEl = this.paytableRows[handId];
    if (rowEl) {
      rowEl.classList.add('is-winning-row');
    }
  }

  clearPaytableHighlight() {
    Object.values(this.paytableRows).forEach(row => {
      if (row) row.classList.remove('is-winning-row');
    });
  }

  updateHoldBadges() {
    for (let i = 0; i < 5; i++) {
      const badge = this.holdBadges[i];
      if (badge) {
        if (this.heldIndices[i]) {
          badge.classList.add('active');
          badge.textContent = 'ZADRŽANO';
        } else {
          badge.classList.remove('active');
          badge.textContent = 'ZADRŽI';
        }
      }
    }
  }

  renderInitialCards() {
    for (let i = 0; i < 5; i++) {
      const container = this.cardContainers[i];
      if (container && this.hand[i]) {
        container.innerHTML = this.buildCardHTML(this.hand[i]);
        container.classList.remove('is-held', 'is-winning');
        container.classList.add('card-just-drawn');
        setTimeout(() => container.classList.remove('card-just-drawn'), 450);
      }
    }
  }

  buildCardBackHTML() {
    return `
      <div class="vp-card-back">
        <div class="vp-card-back-pattern">
          <img src="assets/symbols/logo-flower.svg" alt="GrandSlot" class="vp-card-back-flower">
        </div>
      </div>
    `;
  }

  renderDrawnCards() {
    for (let i = 0; i < 5; i++) {
      const container = this.cardContainers[i];
      if (container && this.hand[i]) {
        if (!this.heldIndices[i]) {
          // Re-render card with flip animation
          container.innerHTML = this.buildCardHTML(this.hand[i]);
          container.classList.add('card-just-drawn');
          setTimeout(() => container.classList.remove('card-just-drawn'), 400);
        }
      }
    }
  }

  buildCardHTML(card) {
    const isRed = card.color === 'red';
    return `
      <div class="vp-card-inner ${isRed ? 'red-card' : 'black-card'}">
        <div class="vp-card-corner top-left">
          <span class="vp-corner-rank">${card.rank}</span>
          <span class="vp-corner-suit">${card.symbol}</span>
        </div>
        <div class="vp-card-center-symbol">
          ${card.symbol}
        </div>
        <div class="vp-card-corner bottom-right">
          <span class="vp-corner-rank">${card.rank}</span>
          <span class="vp-corner-suit">${card.symbol}</span>
        </div>
      </div>
    `;
  }

  updateControlsForPhase(phase) {
    const dealWrap = document.getElementById('vp-ctrls-deal');
    const holdWrap = document.getElementById('vp-ctrls-hold');
    const winWrap = document.getElementById('vp-ctrls-win');

    if (dealWrap) dealWrap.style.display = phase === 'betting' || phase === 'lose_result' ? 'flex' : 'none';
    if (holdWrap) holdWrap.style.display = phase === 'hold_phase' ? 'flex' : 'none';
    if (winWrap) winWrap.style.display = phase === 'win_result' ? 'flex' : 'none';
  }

  setMessage(msg) {
    const msgEl = document.getElementById('vp-status-text');
    if (msgEl) {
      msgEl.textContent = msg;
    }
  }

  /* ==========================================================================
     Acoustic Web Audio Synthesizer
     ========================================================================== */
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playChipSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  playCardDealSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  playHoldSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  playWinSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
    });
  }

  playCollectSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.15);
    });
  }

  playErrorSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  playGambleOpenSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  playShuffleSound() {
    this.playCardDealSound();
  }
}

// Global Export
if (typeof window !== 'undefined') {
  window.RoyalVideoPokerGame = RoyalVideoPokerGame;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RoyalVideoPokerGame, VP_PAYTABLE, VP_SUITS, VP_RANKS };
}
