/**
 * Grand Royal Casino Hold'em (Table Poker with Multi-Seat Live Feel)
 * Official GrandSlot Salon Edition
 * 
 * Features:
 * - Authentic 52-card shoe with Fisher-Yates shuffle
 * - Multi-seat VIP Casino Felt: Seat 1 (AI Companion), Seat 2 (Player/You), Seat 3 (AI Companion)
 * - Community Board: Flop (3 cards), Turn (1 card), River (1 card)
 * - 7-Card Best Poker Hand Evaluator (finds highest scoring 5 of 7 cards)
 * - Las Vegas Casino Hold'em Rules:
 *   - Ante Bet & Deal
 *   - Flop Reveal & Decision (Call 2x Ante or Fold)
 *   - Turn + River Deal & Dealer Reveal
 *   - Dealer Qualification Rule (Pair of 4s or better)
 *   - Ante Bonus Paytable (up to 100:1 for Royal Flush)
 * - Web Audio API acoustic card deals, chips, and victory chords
 * - Full integration with Central Wallet, Daily Missions and Lobby switcher
 */

const CH_SUITS = [
  { name: 'spades', symbol: '♠', color: 'black' },
  { name: 'hearts', symbol: '♥', color: 'red' },
  { name: 'diamonds', symbol: '♦', color: 'red' },
  { name: 'clubs', symbol: '♣', color: 'black' }
];

const CH_RANKS = [
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

class RoyalCasinoHoldemGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.gameState = 'betting'; // 'betting', 'dealing', 'flop_decision', 'showdown', 'round_over'

    this.currentBet = 20; // Ante bet
    this.minBet = 10;
    this.maxBet = 2000;

    // Deck
    this.deck = [];

    // Hands
    this.dealerCards = [];
    this.communityCards = [];

    // 3 Seats: 0: Guest 1 (Marko V.), 1: Player (You), 2: Guest 2 (Stefan K.)
    this.seats = [
      { name: 'Marko V.', isPlayer: false, cards: [], ante: 20, callBet: 0, isFolded: false, handResult: null },
      { name: 'TI (Igrač)', isPlayer: true, cards: [], ante: 20, callBet: 0, isFolded: false, handResult: null },
      { name: 'Stefan K.', isPlayer: false, cards: [], ante: 20, callBet: 0, isFolded: false, handResult: null }
    ];

    // Win Evaluation
    this.lastWinAmount = 0;
    this.dealerHandResult = null;
    this.dealerQualifies = false;

    // Audio & Timers
    this.audioCtx = null;
    this.activeTimers = [];

    // DOM Elements
    this.viewContainer = typeof document !== 'undefined' ? document.getElementById('casino-holdem-game-view') : null;
    if (typeof document !== 'undefined') {
      this.initDOM();
    }
  }

  /* ==========================================================================
     Deck Engine & Shuffling
     ========================================================================== */
  initDeck() {
    this.deck = [];
    for (const suit of CH_SUITS) {
      for (const r of CH_RANKS) {
        this.deck.push({
          suit: suit.name,
          symbol: suit.symbol,
          color: suit.color,
          rank: r.rank,
          val: r.val,
          id: `ch_${suit.name}_${r.rank}_${Math.random().toString(36).substr(2, 4)}`
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

  drawCard() {
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
      this.viewContainer = document.getElementById('casino-holdem-game-view');
    }
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }
    this.resetRound();
    this.updateBetDisplay();
    this.setMessage('POSTAVITE ANTE OPKLADU I PRITISNITE PODELI KARTE');
  }

  unmount() {
    this.isActive = false;
    this.clearAllTimers();
    if (!this.viewContainer) {
      this.viewContainer = document.getElementById('casino-holdem-game-view');
    }
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
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

  handleMainAction() {
    if (this.gameState === 'betting') {
      this.startDeal();
    } else if (this.gameState === 'flop_decision') {
      this.callHand();
    } else if (this.gameState === 'round_over') {
      this.rebet();
    }
  }

  /* ==========================================================================
     Game Flow: Deal -> Flop -> Call/Fold -> Turn+River -> Showdown
     ========================================================================== */
  startDeal() {
    if (this.gameState !== 'betting') return;

    // Check balance for Ante
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
    this.initDeck();
    this.communityCards = [];
    this.clearCardDisplays();

    // Setup seats
    this.seats[0].ante = Math.max(10, Math.round(this.currentBet * 0.8 / 10) * 10);
    this.seats[1].ante = this.currentBet;
    this.seats[2].ante = Math.max(10, Math.round(this.currentBet * 1.2 / 10) * 10);

    this.seats.forEach(s => {
      s.cards = [this.drawCard(), this.drawCard()];
      s.callBet = 0;
      s.isFolded = false;
      s.handResult = null;
    });

    // Dealer 2 cards (face down)
    this.dealerCards = [this.drawCard(), this.drawCard()];
    this.dealerHandResult = null;

    // 3 Community cards (Flop)
    this.communityCards = [this.drawCard(), this.drawCard(), this.drawCard()];

    this.setMessage('DELJENJE KARATA & FLOP...');
    this.playCardDealSound();
    this.renderHoleCards();
    this.renderCommunityCards(3);

    this.schedule(() => {
      this.gameState = 'flop_decision';
      // Evaluate player's current 5 cards (2 hole + 3 flop)
      const current5 = this.evaluate5CardHand([...this.seats[1].cards, ...this.communityCards]);
      this.updatePlayerHandBadge(current5.name);

      // AI companions make their decision
      this.evaluateAIDecisions();

      this.updateControlsForPhase('flop_decision');
      this.setMessage('FLOP JE NA TABLI. PRATITE (CALL = 2× ANTE) ILI ODUSTANITE (FOLD)');
    }, 700);
  }

  callHand() {
    if (this.gameState !== 'flop_decision') return;

    const callCost = this.currentBet * 2;
    // Check balance for Call bet
    if (this.wallet && typeof this.wallet.bet === 'function') {
      const ok = this.wallet.bet(callCost);
      if (!ok) {
        this.setMessage('NEDOVOLJNO SREDSTAVA ZA CALL!');
        this.playErrorSound();
        return;
      }
    }

    this.seats[1].callBet = callCost;
    this.updateSeatBetBadges();
    this.playChipSound();

    this.revealTurnRiverAndShowdown();
  }

  foldHand() {
    if (this.gameState !== 'flop_decision') return;

    this.seats[1].isFolded = true;
    this.gameState = 'round_over';
    this.lastWinAmount = 0;
    this.updateSeatBetBadges();
    this.setMessage('ODUSTALI STE (FOLD). ANTE JE IZGUBLJEN.');
    this.playErrorSound();

    // Show dealer cards anyway for satisfaction
    this.revealDealerCards();
    this.updateControlsForPhase('round_over');
  }

  revealTurnRiverAndShowdown() {
    this.gameState = 'showdown';
    this.setMessage('DELJENJE TURN I RIVER KARATA...');

    // Deal Turn (4th card) and River (5th card)
    this.communityCards.push(this.drawCard(), this.drawCard());
    this.renderCommunityCards(5);
    this.playCardDealSound();

    this.schedule(() => {
      this.revealDealerCards();
      this.resolveShowdown();
    }, 800);
  }

  revealDealerCards() {
    const dealerContainer = document.getElementById('ch-dealer-cards');
    if (dealerContainer) {
      dealerContainer.innerHTML = `
        ${this.buildCardHTML(this.dealerCards[0])}
        ${this.buildCardHTML(this.dealerCards[1])}
      `;
    }
  }

  resolveShowdown() {
    // 1. Evaluate Player best 5 of 7
    const playerAll7 = [...this.seats[1].cards, ...this.communityCards];
    const playerBest = this.evaluateBest7CardHand(playerAll7);
    this.seats[1].handResult = playerBest;
    this.updatePlayerHandBadge(playerBest.name);

    // 2. Evaluate Dealer best 5 of 7
    const dealerAll7 = [...this.dealerCards, ...this.communityCards];
    const dealerBest = this.evaluateBest7CardHand(dealerAll7);
    this.dealerHandResult = dealerBest;

    // Check Dealer Qualification: Pair of 4s or higher
    // rankCategory >= 1 && (rankCategory > 1 || pairRank >= 4)
    const qualifies = dealerBest.rankCategory > 1 || (dealerBest.rankCategory === 1 && dealerBest.highPairVal >= 4);
    this.dealerQualifies = qualifies;

    const dealerScoreEl = document.getElementById('ch-dealer-score');
    if (dealerScoreEl) {
      dealerScoreEl.style.display = 'inline-block';
      dealerScoreEl.textContent = `${dealerBest.name} ${qualifies ? '' : '(NE KVALIFIKUJE SE)'}`;
      dealerScoreEl.className = qualifies ? 'bj-score-badge' : 'bj-score-badge dealer-no-qualify';
    }

    // 3. Evaluate AI Companions
    for (let i of [0, 2]) {
      if (!this.seats[i].isFolded) {
        const ai7 = [...this.seats[i].cards, ...this.communityCards];
        this.seats[i].handResult = this.evaluateBest7CardHand(ai7);
      }
    }
    this.updateAIHandBadges();

    // 4. Compare Player vs Dealer
    const comparison = this.compareHands(playerBest, dealerBest);
    this.gameState = 'round_over';

    if (comparison > 0) {
      // Player Wins!
      let anteMult = 1;
      if (playerBest.rankCategory === 9) anteMult = 100; // Royal Flush
      else if (playerBest.rankCategory === 8) anteMult = 20; // Straight Flush
      else if (playerBest.rankCategory === 7) anteMult = 10; // 4 of a Kind
      else if (playerBest.rankCategory === 6) anteMult = 3;  // Full House
      else if (playerBest.rankCategory === 5) anteMult = 2;  // Flush

      const anteWin = this.seats[1].ante * (anteMult + 1); // returns ante + win
      const callWin = qualifies ? this.seats[1].callBet * 2 : this.seats[1].callBet; // 1:1 if qualified, push if not

      this.lastWinAmount = anteWin + callWin;

      if (this.wallet && typeof this.wallet.addWin === 'function') {
        this.wallet.addWin(this.lastWinAmount);
      }

      const qualMsg = qualifies ? 'DILER SE KVALIFIKOVAO.' : 'DILER SE NIJE KVALIFIKOVAO (Call vraćen)!';
      this.setMessage(`POBEDA! ${playerBest.name} pobeđuje ${dealerBest.name}! +${this.lastWinAmount} ZLT! (${qualMsg})`);
      this.playWinSound();
    } else if (comparison === 0) {
      // Push: return Ante + Call
      this.lastWinAmount = this.seats[1].ante + this.seats[1].callBet;
      if (this.wallet && typeof this.wallet.addWin === 'function') {
        this.wallet.addWin(this.lastWinAmount);
      }
      this.setMessage(`NEREŠENO (PUSH)! Oba imaju ${playerBest.name}. Ulozi vraćeni (+${this.lastWinAmount} ZLT).`);
      this.playChipSound();
    } else {
      // Dealer Wins
      this.lastWinAmount = 0;
      this.setMessage(`DILER POBEĐUJE SA ${dealerBest.name}. VIŠE SREĆE DRUGI PUT!`);
      this.playErrorSound();
    }

    this.updateControlsForPhase('round_over');
  }

  evaluateAIDecisions() {
    // Companion AI logic on flop
    for (let i of [0, 2]) {
      const flop5 = [...this.seats[i].cards, ...this.communityCards];
      const evalFlop = this.evaluate5CardHand(flop5);
      // AI calls 85% of time unless completely dry
      const shouldCall = evalFlop.rankCategory >= 1 || Math.random() < 0.75;
      if (shouldCall) {
        this.seats[i].callBet = this.seats[i].ante * 2;
        this.seats[i].isFolded = false;
      } else {
        this.seats[i].isFolded = true;
      }
    }
    this.updateSeatBetBadges();
  }

  rebet() {
    this.resetRound();
    this.startDeal();
  }

  resetRound() {
    this.gameState = 'betting';
    this.lastWinAmount = 0;
    this.dealerHandResult = null;
    this.seats.forEach(s => {
      s.cards = [];
      s.callBet = 0;
      s.isFolded = false;
      s.handResult = null;
    });
    this.clearCardDisplays();
    this.updateSeatBetBadges();
    this.updateControlsForPhase('betting');
    this.setMessage('POSTAVITE ANTE OPKLADU I PRITISNITE PODELI KARTE');
  }

  /* ==========================================================================
     Poker Hand Evaluation Logic (5-card and 7-card best)
     ========================================================================== */
  evaluateBest7CardHand(cards7) {
    if (!cards7 || cards7.length < 5) {
      return { rankCategory: 0, score: 0, name: 'Visoka Karta', values: [] };
    }

    let bestHand = null;
    // 21 combinations of 5 cards from 7
    const combos = this.getCombinations(cards7, 5);
    combos.forEach(c5 => {
      const evaluated = this.evaluate5CardHand(c5);
      if (!bestHand || this.compareHands(evaluated, bestHand) > 0) {
        bestHand = evaluated;
      }
    });

    return bestHand;
  }

  evaluate5CardHand(cards5) {
    const sorted = [...cards5].sort((a, b) => b.val - a.val);
    const vals = sorted.map(c => c.val);
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);

    // Straight
    let isStraight = false;
    let highStraightVal = vals[0];
    if (
      vals[0] - vals[1] === 1 &&
      vals[1] - vals[2] === 1 &&
      vals[2] - vals[3] === 1 &&
      vals[3] - vals[4] === 1
    ) {
      isStraight = true;
    } else if (
      vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2
    ) {
      isStraight = true;
      highStraightVal = 5; // Ace low
    }

    // Counts
    const counts = {};
    vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const countPairs = Object.entries(counts).map(([v, count]) => ({ val: parseInt(v, 10), count })).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.val - a.val;
    });

    // 1. Royal Flush
    if (isFlush && isStraight && highStraightVal === 14 && vals[4] === 10) {
      return { rankCategory: 9, score: 9000000, name: 'Royal Flush', values: vals };
    }

    // 2. Straight Flush
    if (isFlush && isStraight) {
      return { rankCategory: 8, score: 8000000 + highStraightVal, name: 'Straight Flush', values: vals };
    }

    // 3. Four of a Kind
    if (countPairs[0].count === 4) {
      return { rankCategory: 7, score: 7000000 + countPairs[0].val * 100 + countPairs[1].val, name: `Poker (${this.rankName(countPairs[0].val)})`, values: vals };
    }

    // 4. Full House
    if (countPairs[0].count === 3 && countPairs[1].count === 2) {
      return { rankCategory: 6, score: 6000000 + countPairs[0].val * 100 + countPairs[1].val, name: `Full House (${this.rankName(countPairs[0].val)} i ${this.rankName(countPairs[1].val)})`, values: vals };
    }

    // 5. Flush
    if (isFlush) {
      const score = 5000000 + vals[0] * 10000 + vals[1] * 1000 + vals[2] * 100 + vals[3] * 10 + vals[4];
      return { rankCategory: 5, score, name: 'Boja (Flush)', values: vals };
    }

    // 6. Straight
    if (isStraight) {
      return { rankCategory: 4, score: 4000000 + highStraightVal, name: `Kenta (${this.rankName(highStraightVal)})`, values: vals };
    }

    // 7. Three of a Kind
    if (countPairs[0].count === 3) {
      return { rankCategory: 3, score: 3000000 + countPairs[0].val * 100, name: `Triling (${this.rankName(countPairs[0].val)})`, values: vals };
    }

    // 8. Two Pair
    if (countPairs[0].count === 2 && countPairs[1].count === 2) {
      return { rankCategory: 2, score: 2000000 + countPairs[0].val * 100 + countPairs[1].val, highPairVal: countPairs[0].val, name: `Dva Para (${this.rankName(countPairs[0].val)} i ${this.rankName(countPairs[1].val)})`, values: vals };
    }

    // 9. One Pair
    if (countPairs[0].count === 2) {
      return { rankCategory: 1, score: 1000000 + countPairs[0].val * 100, highPairVal: countPairs[0].val, name: `Par (${this.rankName(countPairs[0].val)})`, values: vals };
    }

    // 10. High Card
    return { rankCategory: 0, score: vals[0] * 1000 + vals[1] * 100, name: `Visoka (${this.rankName(vals[0])})`, values: vals };
  }

  compareHands(handA, handB) {
    if (!handA || !handB) return 0;
    if (handA.rankCategory !== handB.rankCategory) {
      return handA.rankCategory - handB.rankCategory;
    }
    return handA.score - handB.score;
  }

  getCombinations(arr, k) {
    const results = [];
    function helper(start, combo) {
      if (combo.length === k) {
        results.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    }
    helper(0, []);
    return results;
  }

  rankName(val) {
    if (val === 14) return 'As';
    if (val === 13) return 'Kralj';
    if (val === 12) return 'Dama';
    if (val === 11) return 'Žandar';
    return String(val);
  }

  /* ==========================================================================
     DOM Rendering & Table Management
     ========================================================================== */
  initDOM() {
    // Controls: Stepper
    const btnMinus = document.getElementById('ch-bet-minus');
    const btnPlus = document.getElementById('ch-bet-plus');
    if (btnMinus) btnMinus.addEventListener('click', () => this.adjustBet(-10));
    if (btnPlus) btnPlus.addEventListener('click', () => this.adjustBet(10));

    // Chip buttons
    const chips = document.querySelectorAll('.ch-chip-btn');
    chips.forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.getAttribute('data-amt'), 10);
        if (!isNaN(amt)) {
          this.currentBet = Math.min(this.maxBet, this.currentBet + amt);
          this.updateBetDisplay();
          this.playChipSound();
        }
      });
    });

    const btnDouble = document.getElementById('ch-chip-double');
    const btnClear = document.getElementById('ch-chip-clear');
    if (btnDouble) btnDouble.addEventListener('click', () => {
      this.currentBet = Math.min(this.maxBet, this.currentBet * 2);
      this.updateBetDisplay();
      this.playChipSound();
    });
    if (btnClear) btnClear.addEventListener('click', () => {
      this.currentBet = 10;
      this.updateBetDisplay();
      this.playChipSound();
    });

    // Action Buttons
    const btnDeal = document.getElementById('btn-ch-deal');
    const btnCall = document.getElementById('btn-ch-call');
    const btnFold = document.getElementById('btn-ch-fold');
    const btnRebet = document.getElementById('btn-ch-rebet');
    const btnNewRound = document.getElementById('btn-ch-new-round');

    if (btnDeal) btnDeal.addEventListener('click', () => this.startDeal());
    if (btnCall) btnCall.addEventListener('click', () => this.callHand());
    if (btnFold) btnFold.addEventListener('click', () => this.foldHand());
    if (btnRebet) btnRebet.addEventListener('click', () => this.rebet());
    if (btnNewRound) btnNewRound.addEventListener('click', () => this.resetRound());
  }

  adjustBet(delta) {
    if (this.gameState !== 'betting') return;
    this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, this.currentBet + delta));
    this.updateBetDisplay();
    this.playChipSound();
  }

  updateBetDisplay() {
    const valEl = document.getElementById('ch-bet-val');
    if (valEl) valEl.textContent = this.currentBet;
    this.updateSeatBetBadges();
  }

  updateSeatBetBadges() {
    // Update player and guest bet badges
    for (let i = 0; i < 3; i++) {
      const anteEl = document.getElementById(`ch-seat-${i}-ante-val`);
      const callEl = document.getElementById(`ch-seat-${i}-call-val`);
      const callWrap = document.getElementById(`ch-seat-${i}-call-badge`);
      const seatWrap = document.getElementById(`ch-seat-${i}`);

      if (anteEl) anteEl.textContent = this.seats[i].ante;
      if (callEl) callEl.textContent = this.seats[i].callBet;
      if (callWrap) {
        callWrap.style.display = this.seats[i].callBet > 0 ? 'inline-flex' : 'none';
      }
      if (seatWrap) {
        if (this.seats[i].isFolded) {
          seatWrap.classList.add('is-folded');
        } else {
          seatWrap.classList.remove('is-folded');
        }
      }
    }
  }

  renderHoleCards() {
    // Render Dealer Face Down Cards
    const dealerContainer = document.getElementById('ch-dealer-cards');
    if (dealerContainer) {
      dealerContainer.innerHTML = `
        <div class="ch-card ch-card-back"><div class="ch-card-pattern">🂠</div></div>
        <div class="ch-card ch-card-back"><div class="ch-card-pattern">🂠</div></div>
      `;
    }

    // Render 3 Seats Hole Cards
    for (let i = 0; i < 3; i++) {
      const container = document.getElementById(`ch-seat-${i}-cards`);
      if (container && this.seats[i].cards.length === 2) {
        if (i === 1) {
          // Player's face-up cards
          container.innerHTML = `
            ${this.buildCardHTML(this.seats[i].cards[0])}
            ${this.buildCardHTML(this.seats[i].cards[1])}
          `;
        } else {
          // AI Companions face-down cards
          container.innerHTML = `
            <div class="ch-card ch-card-back ch-card-small"><div class="ch-card-pattern">🂠</div></div>
            <div class="ch-card ch-card-back ch-card-small"><div class="ch-card-pattern">🂠</div></div>
          `;
        }
      }
    }
  }

  renderCommunityCards(count) {
    const container = document.getElementById('ch-community-cards');
    if (!container) return;

    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < count && this.communityCards[i]) {
        html += this.buildCardHTML(this.communityCards[i]);
      } else {
        html += '<div class="ch-card-placeholder"></div>';
      }
    }
    container.innerHTML = html;
  }

  buildCardHTML(card) {
    const isRed = card.color === 'red';
    return `
      <div class="ch-card ${isRed ? 'red-card' : 'black-card'}">
        <div class="ch-card-corner top-left">
          <span class="ch-corner-rank">${card.rank}</span>
          <span class="ch-corner-suit">${card.symbol}</span>
        </div>
        <div class="ch-card-center-symbol">${card.symbol}</div>
        <div class="ch-card-corner bottom-right">
          <span class="ch-corner-rank">${card.rank}</span>
          <span class="ch-corner-suit">${card.symbol}</span>
        </div>
      </div>
    `;
  }

  clearCardDisplays() {
    const dealerContainer = document.getElementById('ch-dealer-cards');
    const communityContainer = document.getElementById('ch-community-cards');
    if (dealerContainer) dealerContainer.innerHTML = '';
    if (communityContainer) {
      communityContainer.innerHTML = `
        <div class="ch-card-placeholder"></div>
        <div class="ch-card-placeholder"></div>
        <div class="ch-card-placeholder"></div>
        <div class="ch-card-placeholder"></div>
        <div class="ch-card-placeholder"></div>
      `;
    }

    const dealerScore = document.getElementById('ch-dealer-score');
    if (dealerScore) dealerScore.style.display = 'none';

    for (let i = 0; i < 3; i++) {
      const container = document.getElementById(`ch-seat-${i}-cards`);
      if (container) container.innerHTML = '';
      const badge = document.getElementById(`ch-seat-${i}-hand-badge`);
      if (badge) badge.style.display = 'none';
    }
  }

  updatePlayerHandBadge(text) {
    const badge = document.getElementById('ch-seat-1-hand-badge');
    if (badge) {
      badge.style.display = 'inline-block';
      badge.textContent = text;
    }
  }

  updateAIHandBadges() {
    for (let i of [0, 2]) {
      const badge = document.getElementById(`ch-seat-${i}-hand-badge`);
      if (badge) {
        if (this.seats[i].isFolded) {
          badge.style.display = 'inline-block';
          badge.textContent = 'FOLD';
          badge.className = 'ch-seat-hand-badge folded';
        } else if (this.seats[i].handResult) {
          badge.style.display = 'inline-block';
          badge.textContent = this.seats[i].handResult.name;
          badge.className = 'ch-seat-hand-badge';
        }
      }
    }
  }

  updateControlsForPhase(phase) {
    const dealCtrl = document.getElementById('ch-ctrls-deal');
    const decisionCtrl = document.getElementById('ch-ctrls-decision');
    const roundOverCtrl = document.getElementById('ch-ctrls-round-over');

    if (dealCtrl) dealCtrl.style.display = phase === 'betting' ? 'flex' : 'none';
    if (decisionCtrl) decisionCtrl.style.display = phase === 'flop_decision' ? 'flex' : 'none';
    if (roundOverCtrl) roundOverCtrl.style.display = phase === 'round_over' ? 'flex' : 'none';
  }

  setMessage(msg) {
    const msgEl = document.getElementById('ch-msg-text');
    if (msgEl) {
      msgEl.textContent = msg;
    }
  }

  /* ==========================================================================
     Acoustic Audio
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

  playCardDealSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  playChipSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  playWinSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
    });
  }

  playErrorSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }
}

// Global Export
if (typeof window !== 'undefined') {
  window.RoyalCasinoHoldemGame = RoyalCasinoHoldemGame;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RoyalCasinoHoldemGame, CH_SUITS, CH_RANKS };
}
