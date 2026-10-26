/**
 * Core Platform - Progressive Jackpots Engine
 * Silver, Gold & Grand/Diamond pools accumulating with every spin across all games.
 * Features realistic decimal rolls, smooth slow rolling animations, and user-specified thresholds:
 * - Silver: Seed 50.00, Active >= 80.00, Max Drop 100.00
 * - Gold: Seed 200.00, Active >= 250.00, Max Drop 400.00
 * - Grand/Diamond: Seed 500.00, Active >= 600.00, Max Drop 900.00
 */
class CasinoJackpots {
  constructor(wallet) {
    this.wallet = wallet;

    // Seeds and trigger boundaries
    this.config = {
      silver: { seed: 50.00, activeMin: 80.00, maxCeil: 100.00 },
      gold: { seed: 200.00, activeMin: 250.00, maxCeil: 400.00 },
      diamond: { seed: 500.00, activeMin: 600.00, maxCeil: 900.00 }
    };

    // Actual target values
    this.jackpotSilver = 52.40;
    this.jackpotGold = 205.60;
    this.jackpotDiamond = 512.25;

    // Current animated visual display values (for slow, smooth decimal rolling)
    this.displaySilver = this.jackpotSilver;
    this.displayGold = this.jackpotGold;
    this.displayDiamond = this.jackpotDiamond;

    // DOM Elements - Header
    this.jpSilverEl = document.getElementById('val-jp-silver');
    this.jpGoldEl = document.getElementById('val-jp-gold');
    this.jpDiamondEl = document.getElementById('val-jp-diamond');

    // DOM Elements - Lobby
    this.lobbySilverEl = document.getElementById('egt-lobby-jp-silver');
    this.lobbyGoldEl = document.getElementById('egt-lobby-jp-gold');
    this.lobbyDiamondEl = document.getElementById('egt-lobby-jp-diamond');

    // DOM Pods for active pulse styling
    this.podSilver = document.querySelector('.jackpot-pod.jp-silver');
    this.podGold = document.querySelector('.jackpot-pod.jp-gold');
    this.podDiamond = document.querySelector('.jackpot-pod.jp-diamond');

    this.render();
    this.startAmbientTicker();
    this.startRollingAnimationLoop();
  }

  // Backward compatibility getter for telemetry/admin bridge
  get pots() {
    return {
      silver: { current: this.jackpotSilver || 80 },
      gold: { current: this.jackpotGold || 250 },
      diamond: { current: this.jackpotDiamond || 600 }
    };
  }

  // Format decimal values: e.g. 84.35 -> "<span class='jp-int'>84</span><span class='jp-dot'>.</span><span class='jp-cents'>35</span>"
  formatDisplay(val) {
    const fixed = Math.max(0, val).toFixed(2);
    const [intPart, centsPart] = fixed.split('.');
    return `<span class="jp-int">${intPart}</span><span class="jp-dot">.</span><span class="jp-cents">${centsPart}</span>`;
  }

  formatPlain(val) {
    return Math.max(0, val).toFixed(2);
  }

  // Continuous animation loop that smoothly rolls display numbers towards target values
  startRollingAnimationLoop() {
    const step = () => {
      let changed = false;

      // Silver rolls fastest
      const diffSilver = this.jackpotSilver - this.displaySilver;
      if (Math.abs(diffSilver) > 0.005) {
        this.displaySilver += diffSilver * 0.08 + (diffSilver > 0 ? 0.005 : -0.005);
        if ((diffSilver > 0 && this.displaySilver > this.jackpotSilver) ||
            (diffSilver < 0 && this.displaySilver < this.jackpotSilver)) {
          this.displaySilver = this.jackpotSilver;
        }
        changed = true;
      } else {
        this.displaySilver = this.jackpotSilver;
      }

      // Gold rolls medium/slower
      const diffGold = this.jackpotGold - this.displayGold;
      if (Math.abs(diffGold) > 0.005) {
        this.displayGold += diffGold * 0.05 + (diffGold > 0 ? 0.003 : -0.003);
        if ((diffGold > 0 && this.displayGold > this.jackpotGold) ||
            (diffGold < 0 && this.displayGold < this.jackpotGold)) {
          this.displayGold = this.jackpotGold;
        }
        changed = true;
      } else {
        this.displayGold = this.jackpotGold;
      }

      // Grand/Diamond rolls slowest
      const diffDiamond = this.jackpotDiamond - this.displayDiamond;
      if (Math.abs(diffDiamond) > 0.005) {
        this.displayDiamond += diffDiamond * 0.03 + (diffDiamond > 0 ? 0.002 : -0.002);
        if ((diffDiamond > 0 && this.displayDiamond > this.jackpotDiamond) ||
            (diffDiamond < 0 && this.displayDiamond < this.jackpotDiamond)) {
          this.displayDiamond = this.jackpotDiamond;
        }
        changed = true;
      } else {
        this.displayDiamond = this.jackpotDiamond;
      }

      if (changed) {
        this.render();
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  startAmbientTicker() {
    setInterval(() => {
      // Periodic subtle fractional background filling
      const silverInc = (Math.random() * 0.04 + 0.01);
      const goldInc = (Math.random() < 0.5 ? (Math.random() * 0.03 + 0.01) : 0);
      const diamondInc = (Math.random() < 0.25 ? (Math.random() * 0.02 + 0.005) : 0);

      this.incrementValues(silverInc, goldInc, diamondInc);
    }, 2500);
  }

  incrementOnSpin(bet) {
    // Bet-based fractional increments:
    // Silver fills fastest, Gold slower, Diamond slowest
    const betFactor = Math.max(1, (bet || 20) / 20);
    const silverInc = (0.06 * betFactor) + (Math.random() * 0.05);
    const goldInc = (0.025 * betFactor) + (Math.random() * 0.02);
    const diamondInc = (0.008 * betFactor) + (Math.random() * 0.01);

    this.incrementValues(silverInc, goldInc, diamondInc);

    // Subtle highlight bump
    [this.jpSilverEl, this.jpGoldEl, this.jpDiamondEl].forEach(el => {
      if (el) {
        el.classList.add('bump-val');
        setTimeout(() => el.classList.remove('bump-val'), 220);
      }
    });
  }

  incrementValues(silverInc, goldInc, diamondInc) {
    // Cap at ceilings until triggered
    this.jackpotSilver = Math.min(this.config.silver.maxCeil, this.jackpotSilver + silverInc);
    this.jackpotGold = Math.min(this.config.gold.maxCeil, this.jackpotGold + goldInc);
    this.jackpotDiamond = Math.min(this.config.diamond.maxCeil, this.jackpotDiamond + diamondInc);

    this.updateActivePodStates();
  }

  updateActivePodStates() {
    const isSilverActive = this.jackpotSilver >= this.config.silver.activeMin;
    const isGoldActive = this.jackpotGold >= this.config.gold.activeMin;
    const isDiamondActive = this.jackpotDiamond >= this.config.diamond.activeMin;

    if (this.podSilver) this.podSilver.classList.toggle('is-active-pulse', isSilverActive);
    if (this.podGold) this.podGold.classList.toggle('is-active-pulse', isGoldActive);
    if (this.podDiamond) this.podDiamond.classList.toggle('is-active-pulse', isDiamondActive);
  }

  render() {
    const silverHtml = this.formatDisplay(this.displaySilver);
    const goldHtml = this.formatDisplay(this.displayGold);
    const diamondHtml = this.formatDisplay(this.displayDiamond);

    if (this.jpSilverEl) this.jpSilverEl.innerHTML = silverHtml;
    if (this.jpGoldEl) this.jpGoldEl.innerHTML = goldHtml;
    if (this.jpDiamondEl) this.jpDiamondEl.innerHTML = diamondHtml;

    // Lobby sync
    if (this.lobbySilverEl) this.lobbySilverEl.innerHTML = silverHtml;
    if (this.lobbyGoldEl) this.lobbyGoldEl.innerHTML = goldHtml;
    if (this.lobbyDiamondEl) this.lobbyDiamondEl.innerHTML = diamondHtml;

    this.updateActivePodStates();
  }

  /**
   * Check if any jackpot triggers on spin:
   * - Silver: Active > 80.00, Max 100.00
   * - Gold: Active > 250.00, Max 400.00
   * - Grand/Diamond: Active > 600.00, Max 900.00
   */
  checkMysteryJackpot(onWinCallback) {
    // 1. Mandatory ceiling checks (must drop if reached ceiling)
    if (this.jackpotDiamond >= this.config.diamond.maxCeil) {
      this.awardJackpot('diamond', onWinCallback);
      return true;
    }
    if (this.jackpotGold >= this.config.gold.maxCeil) {
      this.awardJackpot('gold', onWinCallback);
      return true;
    }
    if (this.jackpotSilver >= this.config.silver.maxCeil) {
      this.awardJackpot('silver', onWinCallback);
      return true;
    }

    // 2. Probabilistic trigger when in active range
    // Grand/Diamond (600 - 900)
    if (this.jackpotDiamond >= this.config.diamond.activeMin) {
      const progress = (this.jackpotDiamond - this.config.diamond.activeMin) / (this.config.diamond.maxCeil - this.config.diamond.activeMin);
      const prob = 0.002 + (progress * 0.015);
      if (Math.random() < prob) {
        this.awardJackpot('diamond', onWinCallback);
        return true;
      }
    }

    // Gold (250 - 400)
    if (this.jackpotGold >= this.config.gold.activeMin) {
      const progress = (this.jackpotGold - this.config.gold.activeMin) / (this.config.gold.maxCeil - this.config.gold.activeMin);
      const prob = 0.006 + (progress * 0.035);
      if (Math.random() < prob) {
        this.awardJackpot('gold', onWinCallback);
        return true;
      }
    }

    // Silver (80 - 100)
    if (this.jackpotSilver >= this.config.silver.activeMin) {
      const progress = (this.jackpotSilver - this.config.silver.activeMin) / (this.config.silver.maxCeil - this.config.silver.activeMin);
      const prob = 0.018 + (progress * 0.06);
      if (Math.random() < prob) {
        this.awardJackpot('silver', onWinCallback);
        return true;
      }
    }

    return false;
  }

  awardJackpot(tier, onWinCallback) {
    let prize = 0;
    let badgeClass = '';
    let msgKey = '';

    if (tier === 'diamond' || tier === 'grand') {
      prize = parseFloat(this.jackpotDiamond.toFixed(2));
      this.jackpotDiamond = this.config.diamond.seed;
      this.displayDiamond = this.config.diamond.seed;
      badgeClass = '.jp-diamond';
      msgKey = 'jackpotWonDiamond';
    } else if (tier === 'gold') {
      prize = parseFloat(this.jackpotGold.toFixed(2));
      this.jackpotGold = this.config.gold.seed;
      this.displayGold = this.config.gold.seed;
      badgeClass = '.jp-gold';
      msgKey = 'jackpotWonGold';
    } else {
      prize = parseFloat(this.jackpotSilver.toFixed(2));
      this.jackpotSilver = this.config.silver.seed;
      this.displaySilver = this.config.silver.seed;
      badgeClass = '.jp-silver';
      msgKey = 'jackpotWonSilver';
    }

    if (this.wallet) {
      this.wallet.addWin(prize);
    }
    this.render();

    const pod = document.querySelector(badgeClass);
    if (pod) {
      pod.classList.add('jp-hit-pulse');
      setTimeout(() => pod.classList.remove('jp-hit-pulse'), 5000);
    }

    if (window.slotAudio) window.slotAudio.playJackpot();
    if (window.particleEngine) window.particleEngine.spawnCelebration(true);

    if (onWinCallback) {
      onWinCallback(tier, prize, msgKey);
    }
  }

  claimTier(tier) {
    let prize = 0;
    let badgeClass = '';
    let msgKey = '';

    if (tier === 'diamond' || tier === 'grand') {
      prize = parseFloat(this.jackpotDiamond.toFixed(2));
      this.jackpotDiamond = this.config.diamond.seed;
      this.displayDiamond = this.config.diamond.seed;
      badgeClass = '.jp-diamond';
      msgKey = 'jackpotWonDiamond';
    } else if (tier === 'gold') {
      prize = parseFloat(this.jackpotGold.toFixed(2));
      this.jackpotGold = this.config.gold.seed;
      this.displayGold = this.config.gold.seed;
      badgeClass = '.jp-gold';
      msgKey = 'jackpotWonGold';
    } else {
      prize = parseFloat(this.jackpotSilver.toFixed(2));
      this.jackpotSilver = this.config.silver.seed;
      this.displaySilver = this.config.silver.seed;
      badgeClass = '.jp-silver';
      msgKey = 'jackpotWonSilver';
    }

    if (this.wallet) {
      this.wallet.addWin(prize);
    }
    this.render();

    const pod = document.querySelector(badgeClass);
    if (pod) {
      pod.classList.add('jp-hit-pulse');
      setTimeout(() => pod.classList.remove('jp-hit-pulse'), 5000);
    }

    if (window.slotAudio && window.slotAudio.playJackpot) window.slotAudio.playJackpot();
    if (window.particleEngine) window.particleEngine.spawnCelebration(true);

    const denom = (this.wallet && this.wallet.activeDenom) ? this.wallet.activeDenom : 1;
    const creditsWon = Math.round(prize / denom);
    return { tier, prize, creditsWon };
  }
}

window.CasinoJackpots = CasinoJackpots;
