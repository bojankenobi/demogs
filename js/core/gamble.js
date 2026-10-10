/**
 * Red / Black Card Gamble (Duplanje) Engine
 */
class CardGambleGame {
  constructor(wallet, onGambleFinished) {
    this.wallet = wallet;
    this.onGambleFinished = onGambleFinished;
    this.gambleAmount = 0;
    this.gambleHistory = ['red', 'black', 'red'];
    this.isGambling = false;

    this.gambleBtn = document.getElementById('gamble-btn');
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

    this.initEvents();
  }

  initEvents() {
    if (this.gambleBtn) {
      this.gambleBtn.addEventListener('click', () => this.openModal());
    }
    if (this.closeGambleBtn) {
      this.closeGambleBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.gambleTakeBtn) {
      this.gambleTakeBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.gambleRedBtn) {
      this.gambleRedBtn.addEventListener('click', () => this.makeChoice('red'));
    }
    if (this.gambleBlackBtn) {
      this.gambleBlackBtn.addEventListener('click', () => this.makeChoice('black'));
    }
  }

  showTrigger(amount) {
    this.gambleAmount = amount;
    // Only illuminate button if Cards meter is unlocked
    const isUnlocked = (window.slotApp && window.slotApp.meters && window.slotApp.meters.isCardsUnlocked());
    if (this.gambleBtn) {
      if (isUnlocked) {
        this.gambleBtn.classList.remove('is-dimmed');
        this.gambleBtn.classList.add('gamble-highlight-pulse', 'frenzy-unlocked');
      } else {
        this.gambleBtn.classList.add('is-dimmed');
        this.gambleBtn.classList.remove('gamble-highlight-pulse', 'frenzy-unlocked');
      }
    }
  }

  hideTrigger() {
    if (this.gambleBtn) {
      const isUnlocked = (window.slotApp && window.slotApp.meters && window.slotApp.meters.isCardsUnlocked());
      if (!isUnlocked) {
        this.gambleBtn.classList.remove('gamble-highlight-pulse', 'frenzy-unlocked');
        this.gambleBtn.classList.add('is-dimmed');
      }
    }
  }

  openModal() {
    // STRICT RULE: Cards/Duplanje can ONLY be played when Cards meter is filled (active frenzy)!
    const isUnlocked = (window.slotApp && window.slotApp.meters && window.slotApp.meters.isCardsUnlocked());
    if (!isUnlocked) {
      if (window.slotApp) {
        window.slotApp.showMessage(
          window.i18n ? window.i18n.t('meterCardsLocked') : '💎 PUNITE KARTE SPINOVIMA DA OTKLJUČATE!',
          'warning'
        );
      }
      if (window.slotAudio && window.slotAudio.playClick) {
        window.slotAudio.playClick();
      }
      return;
    }
    if (this.gambleAmount <= 0) {
      if (this.wallet.lastWin > 0) {
        this.gambleAmount = this.wallet.lastWin;
        // Don't deduct from balance here because lastWin is already part of balance or winnings
      } else {
        const betStake = Math.min(this.wallet.bet, this.wallet.balance > 0 ? this.wallet.balance : 0);
        if (betStake <= 0) {
          if (window.slotApp) window.slotApp.showMessage(window.i18n ? window.i18n.t('notEnoughCredits') : 'NEMATE DOVOLJNO KREDITA!', 'warning');
          return;
        }
        this.wallet.balance -= betStake;
        this.gambleAmount = betStake;
        this.fromBet = true;
        this.wallet.updateUI();
      }
    } else {
      this.fromBet = false;
    }

    this.isGambling = true;
    if (window.slotAudio) window.slotAudio.playClick();
    this.updateUI();
    this.renderHistory();

    if (this.flipCardInner) {
      this.flipCardInner.classList.remove('is-flipped');
      this.flipCardInner.classList.add('shuffling');
    }
    if (this.gambleModal) this.gambleModal.classList.add('active');
  }

  closeModal() {
    this.isGambling = false;
    this.fromBet = false;
    this.hideTrigger();
    if (this.gambleModal) this.gambleModal.classList.remove('active');
    this.wallet.updateUI();
    if (this.onGambleFinished) this.onGambleFinished(this.gambleAmount);
  }

  updateUI() {
    if (this.gambleCurrentEl) this.gambleCurrentEl.textContent = this.gambleAmount.toLocaleString();
    if (this.gambleNextEl) this.gambleNextEl.textContent = (this.gambleAmount * 2).toLocaleString();
  }

  renderHistory() {
    if (!this.gambleHistoryEl) return;
    this.gambleHistoryEl.innerHTML = this.gambleHistory.slice(-5).map(color => {
      const suit = color === 'red' ? '♥' : '♠';
      return `<div class="history-card-mini ${color}">${suit}</div>`;
    }).join('');
  }

  makeChoice(chosenColor) {
    if (!this.isGambling || this.gambleAmount <= 0) return;

    if (window.slotAudio) window.slotAudio.playCardFlip();
    if (this.gambleRedBtn) this.gambleRedBtn.disabled = true;
    if (this.gambleBlackBtn) this.gambleBlackBtn.disabled = true;
    if (this.gambleTakeBtn) this.gambleTakeBtn.disabled = true;

    const isRed = Math.random() < 0.5;
    const cardColor = isRed ? 'red' : 'black';
    const suits = isRed ? ['♥', '♦'] : ['♠', '♣'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const ranks = ['A', 'K', 'Q', 'J', '10'];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];

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
      this.renderHistory();

      if (chosenColor === cardColor) {
        const winDelta = this.gambleAmount;
        this.gambleAmount *= 2;
        this.wallet.balance += winDelta;
        this.wallet.setLastWin(this.gambleAmount);
        this.updateUI();

        if (window.slotAudio) window.slotAudio.playGambleWin();
        if (window.particleEngine) window.particleEngine.spawnCelebration(false);
        if (window.slotApp) {
          window.slotApp.showMessage(window.i18n ? window.i18n.t('gambleWon', { amount: this.gambleAmount }) : `🎉 DUPLIRANO: ${this.gambleAmount}!`, 'jackpot');
        }

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
        const lostAmount = this.gambleAmount;
        // If it came from a spin win, deduct the win from balance since it was previously added to balance
        if (!this.fromBet) {
          if (typeof this.wallet.deductLoss === 'function') {
            this.wallet.deductLoss(lostAmount);
          } else {
            this.wallet.balance = Math.max(0, this.wallet.balance - lostAmount);
            this.wallet.setLastWin(0);
            this.wallet.updateUI();
          }
        } else {
          this.wallet.setLastWin(0);
          this.wallet.updateUI();
        }
        this.gambleAmount = 0;
        this.updateUI();

        if (window.slotAudio) window.slotAudio.playGambleLose();
        if (window.slotApp) {
          window.slotApp.showMessage(`❌ POGREŠAN IZBOR! IZGUBLJENO: ${lostAmount} KREDITA!`, 'normal');
        }

        setTimeout(() => {
          this.closeModal();
          if (this.gambleRedBtn) this.gambleRedBtn.disabled = false;
          if (this.gambleBlackBtn) this.gambleBlackBtn.disabled = false;
          if (this.gambleTakeBtn) this.gambleTakeBtn.disabled = false;
        }, 1200);
      }
    }, 600);
  }
}

window.CardGambleGame = CardGambleGame;
