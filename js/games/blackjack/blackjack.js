/**
 * Grand Royal Blackjack (21 Royale) - Official Brand Edition
 * Features:
 * - Luxury Dark Slate & Emerald Velvet Felt Table with GrandSlot Brand Crest
 * - Custom Playing Cards with GrandSlot Golden Flower Emblem & Typography on Card Back
 * - 6-Deck Shoe with Real-Time Penetration & Automatic Reshuffle
 * - Casino Las Vegas Strip Rules: Dealer stands on 17, Blackjack pays 3:2
 * - Complete Action Deck: Hit, Stand, Double Down, Split, Insurance
 * - Additive Chip Stacking (10, 20, 50, 100, 500, 2X, Clear)
 * - Dealer Peek on 10 and Ace with Proper Natural Blackjack Protection
 * - 3D Card Dealing, Smooth Flipping & Hole Card Reveal Animations
 * - Real-Time Dynamic Hand Score Badges (Soft/Hard Totals)
 * - Acoustic Card Slide & Chip Sound Effects via Web Audio API
 * - Integrated with Central Wallet, Lobby, and Player Tracker
 */

const BJ_SUITS = [
  { name: 'spades', symbol: '♠', color: 'black' },
  { name: 'hearts', symbol: '♥', color: 'red' },
  { name: 'diamonds', symbol: '♦', color: 'red' },
  { name: 'clubs', symbol: '♣', color: 'black' }
];

const BJ_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

class RoyalBlackjackGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.gameState = 'betting'; // 'betting', 'dealing', 'player_turn', 'dealer_turn', 'round_over'

    this.currentBet = 20;
    this.lastBet = 20;

    // Shoe: 6 Decks = 312 cards
    this.shoe = [];
    this.initShoe();

    // Hands
    this.dealerCards = [];
    this.dealerHoleCardRevealed = false;

    // Player can have 1 or 2 hands (if Split)
    this.playerHands = [
      { cards: [], bet: 20, isBust: false, isStand: false, isBlackjack: false, isDouble: false, isFromSplit: false, result: null }
    ];
    this.activeHandIndex = 0;

    // Insurance
    this.insuranceBet = 0;
    this.hasInsurance = false;

    // Web Audio Synthesizer & Timers
    this.audioCtx = null;
    this.activeTimers = [];

    // DOM Elements
    this.viewContainer = document.getElementById('blackjack-game-view');
    this.dealerCardsEl = document.getElementById('bj-dealer-cards');
    this.dealerScoreEl = document.getElementById('bj-dealer-score');

    this.playerHandsWrap = document.getElementById('bj-player-hands-wrap');
    this.playerHandEls = [
      document.getElementById('bj-player-hand-0'),
      document.getElementById('bj-player-hand-1')
    ];
    this.playerCardsEls = [
      document.getElementById('bj-player-cards-0'),
      document.getElementById('bj-player-cards-1')
    ];
    this.playerScoreEls = [
      document.getElementById('bj-player-score-0'),
      document.getElementById('bj-player-score-1')
    ];
    this.handBetBadges = [
      document.getElementById('bj-hand-0-bet-badge'),
      document.getElementById('bj-hand-1-bet-badge')
    ];
    this.handBetVals = [
      document.getElementById('bj-hand-0-bet-val'),
      document.getElementById('bj-hand-1-bet-val')
    ];

    this.centerMsgText = document.getElementById('bj-msg-text');

    // Controls
    this.bettingControls = document.getElementById('bj-betting-controls');
    this.actionControls = document.getElementById('bj-action-controls');
    this.roundOverControls = document.getElementById('bj-round-over-controls');

    this.betValEl = document.getElementById('bj-bet-val');
    this.btnMinus = document.getElementById('bj-bet-minus');
    this.btnPlus = document.getElementById('bj-bet-plus');
    this.chipBtns = document.querySelectorAll('.bj-chip-btn');
    this.btnChipDouble = document.getElementById('bj-chip-double');
    this.btnChipClear = document.getElementById('bj-chip-clear');

    this.btnDeal = document.getElementById('btn-bj-deal');
    this.btnHit = document.getElementById('btn-bj-hit');
    this.btnStand = document.getElementById('btn-bj-stand');
    this.btnDouble = document.getElementById('btn-bj-double');
    this.btnSplit = document.getElementById('btn-bj-split');

    this.btnRebet = document.getElementById('btn-bj-rebet');
    this.btnNewRound = document.getElementById('btn-bj-new-round');

    // Insurance Dialog
    this.insuranceOverlay = document.getElementById('bj-insurance-overlay');
    this.insCostEl = document.getElementById('bj-ins-cost');
    this.btnInsYes = document.getElementById('btn-bj-ins-yes');
    this.btnInsNo = document.getElementById('btn-bj-ins-no');

    this.initDOM();
  }

  /* ==========================================================================
     Shoe & Card Deck Engine (6 Decks)
     ========================================================================== */
  initShoe() {
    this.shoe = [];
    const deckCount = 6;
    for (let d = 0; d < deckCount; d++) {
      for (const suit of BJ_SUITS) {
        for (const rank of BJ_RANKS) {
          this.shoe.push({
            suit: suit.name,
            symbol: suit.symbol,
            color: suit.color,
            rank: rank,
            id: `c_${d}_${suit.name}_${rank}_${Math.random().toString(36).substr(2, 4)}`
          });
        }
      }
    }
    this.shuffleShoe();
  }

  shuffleShoe() {
    // Fisher-Yates shuffle
    for (let i = this.shoe.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shoe[i], this.shoe[j]] = [this.shoe[j], this.shoe[i]];
    }
    this.playShuffleSound();
  }

  drawCard() {
    // Reshuffle if penetration drops below 25% (less than 75 cards remaining)
    if (this.shoe.length < 75) {
      this.initShoe();
      if (this.centerMsgText) {
        this.centerMsgText.textContent = 'NOVI ŠPIL JE PROMEŠAN • 6 ŠPILOVA';
      }
    }
    return this.shoe.pop();
  }

  /* ==========================================================================
     Hand Evaluation: Soft & Hard Totals
     ========================================================================== */
  calculateHandScore(cards) {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
      if (card.rank === 'A') {
        aces++;
        total += 11;
      } else if (['K', 'Q', 'J'].includes(card.rank)) {
        total += 10;
      } else {
        total += parseInt(card.rank, 10);
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    const isSoft = aces > 0 && total <= 21;
    const isBust = total > 21;
    const isBlackjack = cards.length === 2 && total === 21;

    return { total, isSoft, isBust, isBlackjack };
  }

  /* ==========================================================================
     Game Lifecycle: Mount / Unmount / ForceExit
     ========================================================================== */
  mount() {
    this.isActive = true;
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }
    this.resetTable();
    this.setPhase('betting');
    this.updateBetDisplay();
    this.setMessage('POSTAVITE OPKLADU I PRITISNITE PODELI KARTE');
  }

  unmount() {
    this.isActive = false;
    this.clearAllTimers();
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
    this.hideInsuranceModal();
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

  forceExit() {
    this.unmount();
  }

  handleMainAction() {
    if (this.gameState === 'betting') {
      this.startDeal();
    } else if (this.gameState === 'player_turn') {
      this.hit();
    } else if (this.gameState === 'round_over') {
      this.rebet();
    }
  }

  /* ==========================================================================
     DOM & Event Listeners
     ========================================================================== */
  initDOM() {
    if (this.btnMinus) {
      this.btnMinus.addEventListener('click', () => {
        this.adjustBet(-10);
        this.playChipSound();
      });
    }

    if (this.btnPlus) {
      this.btnPlus.addEventListener('click', () => {
        this.adjustBet(10);
        this.playChipSound();
      });
    }

    // Additive Chip Stacking
    if (this.chipBtns) {
      this.chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const amt = parseInt(btn.getAttribute('data-amt'), 10);
          if (!isNaN(amt)) {
            // Additive stacking up to max 2000
            this.currentBet = Math.min(2000, this.currentBet + amt);
            this.updateBetDisplay();
            this.playChipSound();
          }
        });
      });
    }

    if (this.btnChipDouble) {
      this.btnChipDouble.addEventListener('click', () => {
        this.currentBet = Math.min(2000, this.currentBet * 2);
        this.updateBetDisplay();
        this.playChipSound();
      });
    }

    if (this.btnChipClear) {
      this.btnChipClear.addEventListener('click', () => {
        this.currentBet = 10;
        this.updateBetDisplay();
        this.playChipSound();
      });
    }

    if (this.btnDeal) {
      this.btnDeal.addEventListener('click', () => this.startDeal());
    }

    if (this.btnHit) {
      this.btnHit.addEventListener('click', () => this.hit());
    }

    if (this.btnStand) {
      this.btnStand.addEventListener('click', () => this.stand());
    }

    if (this.btnDouble) {
      this.btnDouble.addEventListener('click', () => this.doubleDown());
    }

    if (this.btnSplit) {
      this.btnSplit.addEventListener('click', () => this.split());
    }

    if (this.btnRebet) {
      this.btnRebet.addEventListener('click', () => this.rebet());
    }

    if (this.btnNewRound) {
      this.btnNewRound.addEventListener('click', () => this.newRound());
    }

    if (this.btnInsYes) {
      this.btnInsYes.addEventListener('click', () => this.acceptInsurance());
    }

    if (this.btnInsNo) {
      this.btnInsNo.addEventListener('click', () => this.declineInsurance());
    }
  }

  adjustBet(delta) {
    const minBet = 10;
    const maxBet = 2000;
    this.currentBet = Math.max(minBet, Math.min(maxBet, this.currentBet + delta));
    this.updateBetDisplay();
  }

  updateBetDisplay() {
    if (this.betValEl) {
      this.betValEl.textContent = this.currentBet.toLocaleString();
    }
  }

  setMessage(msg, type = 'normal') {
    if (!this.centerMsgText) return;
    this.centerMsgText.innerHTML = msg;
    this.centerMsgText.className = 'bj-msg-text ' + (type !== 'normal' ? 'bj-msg-' + type : '');
  }

  setPhase(phase) {
    this.gameState = phase;

    if (this.bettingControls) {
      this.bettingControls.style.display = phase === 'betting' ? 'flex' : 'none';
    }
    if (this.actionControls) {
      this.actionControls.style.display = phase === 'player_turn' ? 'flex' : 'none';
    }
    if (this.roundOverControls) {
      this.roundOverControls.style.display = phase === 'round_over' ? 'flex' : 'none';
    }
  }

  /* ==========================================================================
     Round Flow: Dealing, Turns & Payouts
     ========================================================================== */
  resetTable() {
    this.clearAllTimers();
    this.dealerCards = [];
    this.dealerHoleCardRevealed = false;
    this.playerHands = [
      { cards: [], bet: this.currentBet, isBust: false, isStand: false, isBlackjack: false, isDouble: false, isFromSplit: false, result: null }
    ];
    this.activeHandIndex = 0;
    this.hasInsurance = false;
    this.insuranceBet = 0;

    if (this.dealerCardsEl) this.dealerCardsEl.innerHTML = '';
    if (this.dealerScoreEl) {
      this.dealerScoreEl.style.display = 'none';
      this.dealerScoreEl.textContent = '0';
    }

    if (this.playerCardsEls[0]) this.playerCardsEls[0].innerHTML = '';
    if (this.playerCardsEls[1]) this.playerCardsEls[1].innerHTML = '';

    if (this.playerScoreEls[0]) this.playerScoreEls[0].style.display = 'none';
    if (this.playerScoreEls[1]) this.playerScoreEls[1].style.display = 'none';

    if (this.handBetBadges[0]) this.handBetBadges[0].style.display = 'none';
    if (this.handBetBadges[1]) this.handBetBadges[1].style.display = 'none';

    if (this.playerHandEls[1]) this.playerHandEls[1].style.display = 'none';
    if (this.playerHandEls[0]) {
      this.playerHandEls[0].classList.add('active');
      this.playerHandEls[0].classList.remove('inactive');
    }

    this.hideInsuranceModal();
  }

  startDeal() {
    if (!this.wallet || this.wallet.balance < this.currentBet) {
      this.setMessage('NEDOVOLJNO KREDITA ZA OPKLADU!', 'error');
      if (window.slotAudio) window.slotAudio.playClick();
      return;
    }

    // Deduct bet
    let success = false;
    if (typeof this.wallet.deductBet === 'function') {
      success = this.wallet.deductBet(this.currentBet);
    } else if (this.wallet.balance >= this.currentBet) {
      this.wallet.balance -= this.currentBet;
      if (typeof this.wallet.setLastWin === 'function') this.wallet.setLastWin(0);
      this.wallet.updateUI();
      success = true;
    }

    if (!success) {
      this.setMessage('NEDOVOLJNO KREDITA ZA OPKLADU!', 'error');
      return;
    }

    this.lastBet = this.currentBet;
    this.resetTable();
    this.setPhase('dealing');
    this.setMessage('DELJENJE KARATA...');

    // Show hand bet badge
    if (this.handBetBadges[0] && this.handBetVals[0]) {
      this.handBetVals[0].textContent = this.currentBet.toLocaleString();
      this.handBetBadges[0].style.display = 'inline-flex';
    }

    // Deal sequence: Player 1 -> Dealer 1 -> Player 2 -> Dealer Hole
    this.schedule(() => {
      this.dealCardToPlayer(0);
      this.playCardDealSound();
    }, 100);

    this.schedule(() => {
      this.dealCardToDealer(false);
      this.playCardDealSound();
    }, 450);

    this.schedule(() => {
      this.dealCardToPlayer(0);
      this.playCardDealSound();
    }, 800);

    this.schedule(() => {
      this.dealCardToDealer(true); // Hole card face down with GrandSlot brand back
      this.playCardDealSound();
    }, 1150);

    this.schedule(() => {
      this.checkInitialDealState();
    }, 1500);
  }

  dealCardToPlayer(handIndex) {
    const card = this.drawCard();
    this.playerHands[handIndex].cards.push(card);
    this.renderCard(card, this.playerCardsEls[handIndex], false);
    this.updatePlayerScore(handIndex);
  }

  dealCardToDealer(isHole = false) {
    const card = this.drawCard();
    card.isHole = isHole;
    this.dealerCards.push(card);
    this.renderCard(card, this.dealerCardsEl, isHole);
    this.updateDealerScore();
  }

  /* ==========================================================================
     Card Rendering: Authentic GrandSlot Brand on Card Back
     ========================================================================== */
  renderCard(card, containerEl, isHole = false) {
    if (!containerEl) return;

    const cardEl = document.createElement('div');
    cardEl.className = `bj-card ${card.color} ${isHole ? 'is-hole' : ''}`;
    cardEl.setAttribute('data-card-id', card.id);

    // Front Face
    let centerGlyph = card.symbol;
    if (card.rank === 'K') centerGlyph = '♚';
    else if (card.rank === 'Q') centerGlyph = '♛';
    else if (card.rank === 'J') centerGlyph = '⚔️';

    cardEl.innerHTML = `
      <div class="bj-card-inner">
        <div class="bj-card-front">
          <div class="bj-card-corner top-left">
            <span class="bj-card-rank">${card.rank}</span>
            <span class="bj-card-suit-mini">${card.symbol}</span>
          </div>
          <div class="bj-card-center">
            <span class="bj-card-emblem">${centerGlyph}</span>
          </div>
          <div class="bj-card-corner bottom-right">
            <span class="bj-card-rank">${card.rank}</span>
            <span class="bj-card-suit-mini">${card.symbol}</span>
          </div>
          <div class="bj-card-foil"></div>
        </div>
        <div class="bj-card-back">
          <div class="bj-card-back-pattern">
            <div class="bj-card-back-brand-wrap">
              <img src="assets/symbols/logo-flower.svg" alt="GrandSlot Emblem" class="bj-card-back-flower">
              <img src="assets/logo.svg" alt="GrandSlot Logo" class="bj-card-back-logo-img">
              <span class="bj-card-back-title">GRAND SLOT</span>
            </div>
          </div>
        </div>
      </div>
    `;

    containerEl.appendChild(cardEl);
  }

  updatePlayerScore(handIndex) {
    const hand = this.playerHands[handIndex];
    if (!hand) return;

    const score = this.calculateHandScore(hand.cards);
    const scoreEl = this.playerScoreEls[handIndex];

    if (scoreEl) {
      scoreEl.style.display = 'inline-block';
      if (score.isBlackjack && !hand.isFromSplit) {
        scoreEl.innerHTML = `<span style="color:#fbbf24;font-weight:900;">BJ 21</span>`;
      } else if (score.isSoft && score.total < 21) {
        scoreEl.textContent = `${score.total - 10}/${score.total}`;
      } else {
        scoreEl.textContent = `${score.total}`;
      }
    }
  }

  updateDealerScore() {
    if (!this.dealerScoreEl) return;

    // If hole card is still face down, show only upcard value
    if (!this.dealerHoleCardRevealed && this.dealerCards.length >= 2) {
      const upcard = this.dealerCards[0];
      const upcardScore = this.calculateHandScore([upcard]);
      this.dealerScoreEl.style.display = 'inline-block';
      this.dealerScoreEl.textContent = `${upcardScore.total}`;
    } else {
      const score = this.calculateHandScore(this.dealerCards);
      this.dealerScoreEl.style.display = 'inline-block';
      if (score.isBlackjack) {
        this.dealerScoreEl.innerHTML = `<span style="color:#fbbf24;font-weight:900;">BJ 21</span>`;
      } else {
        this.dealerScoreEl.textContent = `${score.total}`;
      }
    }
  }

  checkInitialDealState() {
    const playerHand = this.playerHands[0];
    const playerScore = this.calculateHandScore(playerHand.cards);
    const dealerUpcard = this.dealerCards[0];

    // 1. Check for Insurance offer if dealer shows Ace
    if (dealerUpcard.rank === 'A' && !playerScore.isBlackjack) {
      this.promptInsurance();
      return;
    }

    // 2. Natural Blackjack Check for Player
    if (playerScore.isBlackjack) {
      playerHand.isBlackjack = true;
      this.revealDealerHoleCard();
      const dealerScore = this.calculateHandScore(this.dealerCards);

      if (dealerScore.isBlackjack) {
        // Both natural Blackjack -> Push
        this.resolveRound();
      } else {
        // Player Natural Blackjack wins 3:2
        this.resolveRound();
      }
      return;
    }

    // 3. Dealer Peek on 10 or Ace
    if (['10', 'J', 'Q', 'K'].includes(dealerUpcard.rank)) {
      const dealerScore = this.calculateHandScore(this.dealerCards);
      if (dealerScore.isBlackjack) {
        // Dealer has Blackjack immediately -> reveal and end round
        this.revealDealerHoleCard();
        this.setMessage('DILER IMA BLACKJACK! GUBITAK.', 'error');
        this.schedule(() => {
          this.resolveRound();
        }, 1000);
        return;
      }
    }

    // 4. Standard Player Turn Begins
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    this.setPhase('player_turn');
    this.activeHandIndex = 0;
    this.updateActiveHandHighlight();
    this.updateActionButtons();
    this.setMessage('IZABERITE AKCIJU: VUCI (HIT), STANI (STAND), DUPLIRAJ ILI PODELI');
  }

  updateActiveHandHighlight() {
    this.playerHandEls.forEach((el, idx) => {
      if (el) {
        const isActive = (idx === this.activeHandIndex && this.playerHands.length > 1);
        el.classList.toggle('active', isActive || this.playerHands.length === 1);
        el.classList.toggle('inactive', !isActive && this.playerHands.length > 1);
      }
    });
  }

  /* ==========================================================================
     Action Buttons State Machine (Always Safe & Re-enabled)
     ========================================================================== */
  updateActionButtons() {
    const hand = this.playerHands[this.activeHandIndex];
    if (!hand) return;

    const canAfford = this.wallet && this.wallet.balance >= hand.bet;

    // Hit & Stand: ALWAYS available during player turn
    if (this.btnHit) {
      this.btnHit.disabled = false;
      this.btnHit.style.opacity = '1';
    }
    if (this.btnStand) {
      this.btnStand.disabled = false;
      this.btnStand.style.opacity = '1';
    }

    // Double Down: available only on 2 initial cards of hand
    const canDouble = hand.cards.length === 2 && canAfford && !hand.isDouble;
    if (this.btnDouble) {
      this.btnDouble.disabled = !canDouble;
      this.btnDouble.style.opacity = canDouble ? '1' : '0.4';
    }

    // Split: available only on 2 initial cards of same rank/value
    const canSplit = this.playerHands.length === 1 &&
      hand.cards.length === 2 &&
      canAfford &&
      (hand.cards[0].rank === hand.cards[1].rank ||
       (['10', 'J', 'Q', 'K'].includes(hand.cards[0].rank) && ['10', 'J', 'Q', 'K'].includes(hand.cards[1].rank)));

    if (this.btnSplit) {
      this.btnSplit.disabled = !canSplit;
      this.btnSplit.style.opacity = canSplit ? '1' : '0.4';
    }
  }

  disableActionButtons() {
    if (this.btnHit) {
      this.btnHit.disabled = true;
      this.btnHit.style.opacity = '0.4';
    }
    if (this.btnStand) {
      this.btnStand.disabled = true;
      this.btnStand.style.opacity = '0.4';
    }
    if (this.btnDouble) {
      this.btnDouble.disabled = true;
      this.btnDouble.style.opacity = '0.4';
    }
    if (this.btnSplit) {
      this.btnSplit.disabled = true;
      this.btnSplit.style.opacity = '0.4';
    }
  }

  /* ==========================================================================
     Player Actions: Hit, Stand, Double, Split, Insurance
     ========================================================================== */
  hit() {
    if (this.gameState !== 'player_turn') return;

    this.playCardDealSound();
    this.dealCardToPlayer(this.activeHandIndex);

    const hand = this.playerHands[this.activeHandIndex];
    const score = this.calculateHandScore(hand.cards);

    if (score.isBust) {
      hand.isBust = true;
      this.playBustSound();
      this.setMessage(`RUKA PREBAČENA (${score.total})! GUBITAK.`, 'error');

      // Temporarily disable actions while transitioning
      this.disableActionButtons();

      this.schedule(() => {
        this.advanceToNextHand();
      }, 900);
    } else if (score.total === 21) {
      // Automatic stand on 21
      this.stand();
    } else {
      this.updateActionButtons();
    }
  }

  stand() {
    if (this.gameState !== 'player_turn') return;

    const hand = this.playerHands[this.activeHandIndex];
    if (hand) hand.isStand = true;

    this.playClickSound();
    this.advanceToNextHand();
  }

  doubleDown() {
    if (this.gameState !== 'player_turn') return;

    const hand = this.playerHands[this.activeHandIndex];
    if (!hand || hand.cards.length !== 2) return;

    // Deduct additional bet
    let success = false;
    if (typeof this.wallet.deductBet === 'function') {
      success = this.wallet.deductBet(hand.bet);
    } else if (this.wallet.balance >= hand.bet) {
      this.wallet.balance -= hand.bet;
      this.wallet.updateUI();
      success = true;
    }

    if (!success) {
      this.setMessage('NEDOVOLJNO KREDITA ZA DUPLIRANJE!', 'error');
      return;
    }

    hand.bet *= 2;
    hand.isDouble = true;

    // Update hand bet display
    if (this.handBetVals[this.activeHandIndex]) {
      this.handBetVals[this.activeHandIndex].textContent = hand.bet.toLocaleString();
    }

    this.playChipSound();
    this.playCardDealSound();

    // Double Down deals exactly 1 card then forces stand
    this.dealCardToPlayer(this.activeHandIndex);

    const score = this.calculateHandScore(hand.cards);
    if (score.isBust) {
      hand.isBust = true;
      this.playBustSound();
      this.setMessage(`DUPLIRANO I PREBAČENO (${score.total})!`, 'error');
    } else {
      hand.isStand = true;
    }

    this.disableActionButtons();

    this.schedule(() => {
      this.advanceToNextHand();
    }, 1000);
  }

  split() {
    if (this.gameState !== 'player_turn' || this.playerHands.length > 1) return;

    const mainHand = this.playerHands[0];
    if (!mainHand || mainHand.cards.length !== 2) return;

    // Deduct additional bet for split hand
    let success = false;
    if (typeof this.wallet.deductBet === 'function') {
      success = this.wallet.deductBet(mainHand.bet);
    } else if (this.wallet.balance >= mainHand.bet) {
      this.wallet.balance -= mainHand.bet;
      this.wallet.updateUI();
      success = true;
    }

    if (!success) {
      this.setMessage('NEDOVOLJNO KREDITA ZA PODELU (SPLIT)!', 'error');
      return;
    }

    this.playChipSound();
    this.disableActionButtons(); // Disable during split animation

    const isSplitAces = mainHand.cards[0].rank === 'A';

    // Create Hand 2
    const splitCard = mainHand.cards.pop();
    mainHand.isFromSplit = true;

    this.playerHands.push({
      cards: [splitCard],
      bet: mainHand.bet,
      isBust: false,
      isStand: false,
      isBlackjack: false,
      isDouble: false,
      isFromSplit: true,
      result: null
    });

    // Show Hand 2 in DOM
    if (this.playerHandEls[1]) this.playerHandEls[1].style.display = 'flex';
    if (this.handBetBadges[1] && this.handBetVals[1]) {
      this.handBetVals[1].textContent = mainHand.bet.toLocaleString();
      this.handBetBadges[1].style.display = 'inline-flex';
    }

    // Refresh Hand 1 and render Hand 2
    if (this.playerCardsEls[0]) this.playerCardsEls[0].innerHTML = '';
    if (this.playerCardsEls[1]) this.playerCardsEls[1].innerHTML = '';

    this.renderCard(mainHand.cards[0], this.playerCardsEls[0], false);
    this.renderCard(splitCard, this.playerCardsEls[1], false);
    this.updatePlayerScore(0);
    this.updatePlayerScore(1);

    // Deal 1 new card to Hand 1, then 1 new card to Hand 2
    this.schedule(() => {
      this.dealCardToPlayer(0);
      this.playCardDealSound();
    }, 300);

    this.schedule(() => {
      this.dealCardToPlayer(1);
      this.playCardDealSound();

      if (isSplitAces) {
        // Split Aces: exactly 1 card to each, then dealer plays
        this.playerHands[0].isStand = true;
        this.playerHands[1].isStand = true;
        this.setMessage('PODELJENI KECOVI: Dodeljena po jedna karta. Diler igra...');
        this.schedule(() => {
          this.startDealerTurn();
        }, 900);
      } else {
        this.activeHandIndex = 0;
        this.updateActiveHandHighlight();
        this.updateActionButtons();

        const h0Score = this.calculateHandScore(this.playerHands[0].cards);
        if (h0Score.total === 21) {
          this.playerHands[0].isStand = true;
          this.setMessage('PRVA RUKA JE 21! Prelazak na drugu ruku...');
          this.schedule(() => {
            this.advanceToNextHand();
          }, 800);
        } else {
          this.setMessage('RUKA JE PODELJENA (SPLIT). IGRATE PRVU RUKU.');
        }
      }
    }, 700);
  }

  advanceToNextHand() {
    if (this.activeHandIndex < this.playerHands.length - 1) {
      this.activeHandIndex++;
      this.updateActiveHandHighlight();
      this.updateActionButtons();

      const h1Score = this.calculateHandScore(this.playerHands[this.activeHandIndex].cards);
      if (h1Score.total === 21) {
        this.playerHands[this.activeHandIndex].isStand = true;
        this.setMessage('DRUGA RUKA JE 21! Diler igra...');
        this.schedule(() => {
          this.startDealerTurn();
        }, 800);
      } else {
        this.setMessage('IGRANJE DRUGE (SPLIT) RUKE: VUCI ILI STANI');
      }
    } else {
      // All player hands resolved -> Dealer Turn
      this.startDealerTurn();
    }
  }

  /* ==========================================================================
     Dealer AI & Turn
     ========================================================================== */
  startDealerTurn() {
    this.setPhase('dealer_turn');

    // If all player hands busted, dealer does not need to draw
    const allBusted = this.playerHands.every(h => h.isBust);

    // Reveal Hole Card
    this.revealDealerHoleCard();

    if (allBusted) {
      this.schedule(() => {
        this.resolveRound();
      }, 700);
      return;
    }

    this.setMessage('DILER IGRA...');
    this.stepDealerAI();
  }

  revealDealerHoleCard() {
    this.dealerHoleCardRevealed = true;
    const holeCardEl = this.dealerCardsEl.querySelector('.bj-card.is-hole');
    if (holeCardEl) {
      holeCardEl.classList.remove('is-hole');
      holeCardEl.classList.add('revealed');
      this.playCardFlipSound();
    }
    this.updateDealerScore();
  }

  stepDealerAI() {
    const dealerScore = this.calculateHandScore(this.dealerCards);

    // Las Vegas Strip Rule: Dealer must draw to 16, stands on all 17s
    if (dealerScore.total < 17) {
      this.schedule(() => {
        this.dealCardToDealer(false);
        this.playCardDealSound();
        this.stepDealerAI();
      }, 650);
    } else {
      this.schedule(() => {
        this.resolveRound();
      }, 700);
    }
  }

  /* ==========================================================================
     Round Resolution & Payouts
     ========================================================================== */
  resolveRound() {
    this.setPhase('round_over');

    const dealerScore = this.calculateHandScore(this.dealerCards);
    const dealerBust = dealerScore.isBust;
    const dealerBJ = dealerScore.isBlackjack;

    let totalRoundWin = 0;
    let roundSummary = [];

    // Evaluate each player hand
    this.playerHands.forEach((hand, idx) => {
      const playerScore = this.calculateHandScore(hand.cards);
      let outcome = 'lose'; // 'win', 'lose', 'push', 'bj'
      let handWin = 0;

      if (hand.isBust) {
        outcome = 'lose';
        handWin = 0;
      } else if (hand.isBlackjack && !hand.isFromSplit) {
        // Natural 3:2 Blackjack
        if (dealerBJ) {
          outcome = 'push';
          handWin = hand.bet; // return bet
        } else {
          outcome = 'bj';
          handWin = Math.round(hand.bet * 2.5); // 3:2 payout (bet + 1.5 * bet)
        }
      } else if (dealerBJ) {
        outcome = 'lose';
        handWin = 0;
      } else if (dealerBust) {
        outcome = 'win';
        handWin = hand.bet * 2; // 1:1 payout
      } else if (playerScore.total > dealerScore.total) {
        outcome = 'win';
        handWin = hand.bet * 2;
      } else if (playerScore.total === dealerScore.total) {
        outcome = 'push';
        handWin = hand.bet;
      } else {
        outcome = 'lose';
        handWin = 0;
      }

      hand.result = outcome;
      totalRoundWin += handWin;

      // Status text for this hand
      const handLabel = this.playerHands.length > 1 ? `Ruka ${idx + 1}` : 'Igrač';
      if (outcome === 'bj') {
        roundSummary.push(`${handLabel}: 🎉 BLACKJACK (+${handWin - hand.bet} ZLT)!`);
      } else if (outcome === 'win') {
        roundSummary.push(`${handLabel}: POBEDA (+${handWin - hand.bet} ZLT)!`);
      } else if (outcome === 'push') {
        roundSummary.push(`${handLabel}: NEREŠENO (Povraćaj ${hand.bet} ZLT)`);
      } else {
        roundSummary.push(`${handLabel}: Gubitak (-${hand.bet} ZLT)`);
      }
    });

    // Credit Winnings
    if (this.wallet && totalRoundWin > 0) {
      this.wallet.addWin(totalRoundWin);
    }

    const totalBet = this.playerHands.reduce((acc, h) => acc + h.bet, 0);
    if (window.slotApp && window.slotApp.playerTracker) {
      window.slotApp.playerTracker.recordSpin('blackjack', totalBet, totalRoundWin);
    }

    // Play celebration audio
    const hasBJ = this.playerHands.some(h => h.result === 'bj');
    const hasWin = this.playerHands.some(h => h.result === 'win' || h.result === 'bj');
    const hasPush = this.playerHands.some(h => h.result === 'push');

    if (hasBJ) {
      if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
      if (window.particleEngine) window.particleEngine.spawnCelebration(true);
    } else if (hasWin) {
      if (window.slotAudio && window.slotAudio.playWin) window.slotAudio.playWin();
    } else if (hasPush) {
      if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    }

    // Set Final Result Message
    const netProfit = totalRoundWin - totalBet;
    if (netProfit > 0) {
      this.setMessage(`<span style="color:#4ade80;font-weight:900;">${roundSummary.join(' • ')} • UKUPNO: +${netProfit.toLocaleString()} ZLT</span>`, 'win');
    } else if (netProfit === 0 && totalRoundWin > 0) {
      this.setMessage(`<span style="color:#94a3b8;">${roundSummary.join(' • ')}</span>`, 'push');
    } else {
      this.setMessage(`<span style="color:#f87171;">${roundSummary.join(' • ')}</span>`, 'lose');
    }
  }

  /* ==========================================================================
     Insurance Flow
     ========================================================================== */
  promptInsurance() {
    this.insuranceBet = Math.floor(this.currentBet / 2);
    if (this.insCostEl) this.insCostEl.textContent = this.insuranceBet.toLocaleString();
    if (this.insuranceOverlay) this.insuranceOverlay.style.display = 'flex';
    this.playClickSound();
  }

  hideInsuranceModal() {
    if (this.insuranceOverlay) this.insuranceOverlay.style.display = 'none';
  }

  acceptInsurance() {
    this.hideInsuranceModal();
    if (this.wallet && this.wallet.balance >= this.insuranceBet) {
      let success = false;
      if (typeof this.wallet.deductBet === 'function') {
        success = this.wallet.deductBet(this.insuranceBet);
      } else if (this.wallet.balance >= this.insuranceBet) {
        this.wallet.balance -= this.insuranceBet;
        this.wallet.updateUI();
        success = true;
      }
      if (success) {
        this.hasInsurance = true;
        this.playChipSound();
        this.setMessage(`OSIGURANJE AKTIVIRANO (${this.insuranceBet} ZLT). PROVERA DILERA...`);
      }
    }
    this.evaluateDealerPeek();
  }

  declineInsurance() {
    this.hideInsuranceModal();
    this.hasInsurance = false;
    this.evaluateDealerPeek();
  }

  evaluateDealerPeek() {
    const dealerScore = this.calculateHandScore(this.dealerCards);

    if (dealerScore.isBlackjack) {
      // Dealer has BJ!
      this.revealDealerHoleCard();
      if (this.hasInsurance) {
        // Insurance pays 2:1 (return stake + 2x = 3x)
        const insWin = this.insuranceBet * 3;
        if (this.wallet) this.wallet.addWin(insWin);
        this.setMessage(`DILER IMA BLACKJACK! OSIGURANJE ISPLAĆENO (+${insWin} ZLT).`, 'win');
      } else {
        this.setMessage('DILER IMA BLACKJACK! GUBITAK.', 'error');
      }
      this.schedule(() => {
        this.resolveRound();
      }, 1200);
    } else {
      if (this.hasInsurance) {
        this.setMessage('DILER NEMA BLACKJACK. Osiguranje propada. Nastavak igre...');
      }
      this.schedule(() => {
        this.startPlayerTurn();
      }, 800);
    }
  }

  /* ==========================================================================
     Rebet & New Round
     ========================================================================== */
  rebet() {
    this.currentBet = this.lastBet;
    this.startDeal();
  }

  newRound() {
    this.resetTable();
    this.setPhase('betting');
    this.updateBetDisplay();
    this.setMessage('POSTAVITE OPKLADU I PRITISNITE PODELI KARTE');
  }

  /* ==========================================================================
     Audio Synthesis (Card Deals, Shuffles & Chips)
     ========================================================================== */
  ensureAudio() {
    try {
      if (!this.audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) this.audioCtx = new AudioClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {}
  }

  playCardDealSound() {
    try {
      this.ensureAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {}
  }

  playCardFlipSound() {
    try {
      this.ensureAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(520, this.audioCtx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.06);
    } catch (e) {}
  }

  playChipSound() {
    try {
      this.ensureAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch (e) {}
  }

  playShuffleSound() {
    try {
      this.ensureAudio();
      if (!this.audioCtx) return;

      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          this.playCardDealSound();
        }, i * 60);
      }
    } catch (e) {}
  }

  playBustSound() {
    try {
      this.ensureAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.2);
    } catch (e) {}
  }

  playClickSound() {
    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }
  }
}

window.RoyalBlackjackGame = RoyalBlackjackGame;
