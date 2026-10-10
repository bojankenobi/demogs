/**
 * Core Platform - Wallet & Bet Manager
 * Centralized credit, bet, and payout ledger across all slot games.
 */
class CasinoWallet {
  constructor(initialRsdBalance = 1000, initialBetCredits = 20) {
    // Denomination settings: 0.2, 0.5, 1, 2, 4 RSD per credit
    this.denominations = [0.2, 0.5, 1, 2, 4];
    this.activeDenom = 1; // Default: 1 RSD = 1 Credit

    // Try loading saved denomination
    try {
      const savedDenom = parseFloat(localStorage.getItem('igt_denomination') || localStorage.getItem('maxbet_denomination'));
      if (savedDenom && this.denominations.includes(savedDenom)) {
        this.activeDenom = savedDenom;
      }
    } catch (e) {}

    // Load saved RSD balance if exists, else initial 1000 RSD
    this.rsdBalance = initialRsdBalance;
    try {
      const savedBal = parseFloat(localStorage.getItem('igt_rsd_balance') || localStorage.getItem('maxbet_rsd_balance'));
      if (!isNaN(savedBal) && savedBal >= 0) {
        this.rsdBalance = savedBal;
      }
    } catch (e) {}

    this.bet = initialBetCredits; // Bet in credits
    this.minBet = 5;
    this.maxBet = 100;
    this.lastWinCredits = 0;
    this.lastWinRsd = 0;
    this.freeSpins = 0;
    this.happyHourMultiplier = 1;
    this.isGoldenBet = false;

    this.initDOM();
    this.updateUI();
  }

  get currentSpinCostCredits() {
    return this.isGoldenBet ? Math.round(this.bet * 1.25) : this.bet;
  }

  toggleGoldenBet() {
    this.isGoldenBet = !this.isGoldenBet;
    if (window.slotAudio) window.slotAudio.playClick();
    this.updateUI();
    return this.isGoldenBet;
  }

  initDOM() {
    this.balanceEl = document.getElementById('val-balance');
    this.betEl = document.getElementById('val-bet');
    this.winEl = document.getElementById('val-win');
    this.denomValEl = document.getElementById('hud-denom-val');
    this.denomSubEl = document.getElementById('hud-denom-sub');
    this.balanceRsdEl = document.getElementById('hud-balance-rsd');
    this.betRsdEl = document.getElementById('hud-bet-rsd');
  }

  // Dynamic Credits balance calculated from real RSD and active denomination
  get balance() {
    return Math.floor(this.rsdBalance / this.activeDenom);
  }

  set balance(credits) {
    this.rsdBalance = Math.round(credits * this.activeDenom);
    this.saveState();
  }

  get lastWin() {
    return this.lastWinCredits;
  }

  set lastWin(credits) {
    this.lastWinCredits = credits;
    this.lastWinRsd = +(credits * this.activeDenom).toFixed(2);
  }

  saveState() {
    try {
      localStorage.setItem('igt_rsd_balance', this.rsdBalance.toString());
      localStorage.setItem('igt_denomination', this.activeDenom.toString());
    } catch (e) {}
  }

  setDenomination(val) {
    const num = parseFloat(val);
    if (this.denominations.includes(num)) {
      this.activeDenom = num;
      this.saveState();
      if (window.slotAudio) window.slotAudio.playClick();
      this.updateUI();
    }
  }

  cycleDenomination() {
    const currentIndex = this.denominations.indexOf(this.activeDenom);
    const nextIndex = (currentIndex + 1) % this.denominations.length;
    this.setDenomination(this.denominations[nextIndex]);
  }

  getRsdAmount(credits) {
    return +(credits * this.activeDenom).toFixed(2);
  }

  canAffordSpin() {
    return this.freeSpins > 0 || this.balance >= this.currentSpinCostCredits;
  }

  deductSpinBet() {
    if (this.freeSpins > 0) {
      this.freeSpins--;
      return { isFree: true, remainingFree: this.freeSpins, betAmount: this.bet, isGoldenBet: this.isGoldenBet };
    }
    const costCredits = this.currentSpinCostCredits;
    const betInRsd = +(costCredits * this.activeDenom).toFixed(2);
    if (this.rsdBalance >= betInRsd) {
      this.rsdBalance = +(this.rsdBalance - betInRsd).toFixed(2);
      this.lastWinCredits = 0;
      this.lastWinRsd = 0;
      this.saveState();
      this.updateUI();
      return { isFree: false, remainingFree: 0, betAmount: this.bet, costCredits, isGoldenBet: this.isGoldenBet };
    }
    return null;
  }

  addWin(creditsAmount) {
    if (creditsAmount > 0) {
      const winInRsd = +(creditsAmount * this.activeDenom).toFixed(2);
      this.rsdBalance = +(this.rsdBalance + winInRsd).toFixed(2);
      this.lastWinCredits = creditsAmount;
      this.lastWinRsd = winInRsd;
      this.saveState();
      this.updateUI();
    }
  }

  creditWin(creditsAmount) {
    this.addWin(creditsAmount);
  }

  deductLoss(creditsAmount) {
    if (creditsAmount > 0) {
      const lossInRsd = +(creditsAmount * this.activeDenom).toFixed(2);
      this.rsdBalance = Math.max(0, +(this.rsdBalance - lossInRsd).toFixed(2));
      this.lastWinCredits = 0;
      this.lastWinRsd = 0;
      this.saveState();
      this.updateUI();
    }
  }

  setLastWin(creditsAmount) {
    this.lastWinCredits = creditsAmount;
    this.lastWinRsd = +(creditsAmount * this.activeDenom).toFixed(2);
    this.updateUI();
  }

  // Fictional RSD Deposit - Pure fiat addition that automatically recalculates credits
  addFictionalRsd(rsdAmount = 1000) {
    const num = Math.max(0, parseFloat(rsdAmount) || 0);
    if (num > 0) {
      this.rsdBalance = +(this.rsdBalance + num).toFixed(2);
      this.saveState();
      this.updateUI();
      if (window.slotAudio) window.slotAudio.playCoinDrop();
      return Math.floor(num / this.activeDenom);
    }
    return 0;
  }

  addCredits(credits = 500) {
    // Backwards compatibility: add equivalent in RSD
    const rsdEq = +(credits * this.activeDenom).toFixed(2);
    this.addFictionalRsd(rsdEq);
  }

  changeBet(delta) {
    const newBet = Math.max(this.minBet, Math.min(this.maxBet, this.bet + delta));
    if (newBet !== this.bet) {
      this.bet = newBet;
      if (window.slotAudio) window.slotAudio.playClick();
      this.updateUI();
    }
  }

  setMaxBet() {
    if (this.bet !== this.maxBet) {
      this.bet = this.maxBet;
      if (window.slotAudio) window.slotAudio.playClick();
      this.updateUI();
    }
  }

  addFreeSpins(count) {
    this.freeSpins += count;
  }

  updateUI() {
    if (!this.balanceEl) this.initDOM();

    const currentCredits = this.balance;
    const betRsd = +(this.bet * this.activeDenom).toFixed(2);
    const winCredits = this.lastWinCredits;

    if (this.balanceEl) this.balanceEl.textContent = currentCredits.toLocaleString();
    if (this.betEl) {
      this.betEl.textContent = this.isGoldenBet 
        ? `${this.currentSpinCostCredits} (${this.bet})` 
        : this.bet.toLocaleString();
    }
    if (this.winEl) this.winEl.textContent = winCredits.toLocaleString();

    const actualBetRsd = +(this.currentSpinCostCredits * this.activeDenom).toFixed(2);
    if (this.balanceRsdEl) {
      this.balanceRsdEl.textContent = `≈ ${this.rsdBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RSD`;
    }
    if (this.betRsdEl) {
      this.betRsdEl.textContent = `≈ ${actualBetRsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RSD`;
    }

    if (this.denomValEl) {
      this.denomValEl.textContent = `${this.activeDenom} RSD`;
    }
    if (this.denomSubEl) {
      this.denomSubEl.textContent = `1 KR = ${this.activeDenom} RSD`;
    }

    // Golden Bet button sync
    const goldenBtn = document.getElementById('btn-golden-bet');
    if (goldenBtn) {
      goldenBtn.classList.toggle('active', this.isGoldenBet);
      const st = goldenBtn.querySelector('.gb-status');
      if (st) st.textContent = this.isGoldenBet ? 'ON' : 'OFF';
    }

    // Update active state on any denomination quick buttons
    document.querySelectorAll('.denom-pill-btn').forEach(btn => {
      const dVal = parseFloat(btn.getAttribute('data-denom'));
      btn.classList.toggle('active', dVal === this.activeDenom);
    });
  }
}

window.CasinoWallet = CasinoWallet;
