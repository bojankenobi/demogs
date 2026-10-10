/**
 * IGT - Math & Volatility Manager
 * Configures 4 distinct mathematical profiles:
 * 1. Casino Standard (~96.0% RTP, ~25% Hit Rate) - Authentic Vegas casino balance
 * 2. Low Volatility (~97.0% RTP, ~40% Hit Rate) - Frequent smaller wins, lower risk
 * 3. High Volatility (~94.5% RTP, ~16% Hit Rate) - High tension, only 3-of-a-kind pays with massive 1.5x boosted multipliers
 * 4. Demo / Promo Mode (~100% Hit Rate) - Guaranteed frequent wins and fast bonus charging for client presentations
 */
class SlotMathManager {
  constructor() {
    this.STORAGE_KEY = 'igt_math_volatility_config_v2';

    this.PRESETS = {
      standard: {
        id: 'standard',
        name: 'Casino Standard',
        shortName: 'CASINO STD',
        desc: 'Autentična kazino matematika. Realan hit rate (~25%), uravnoteženi dobici i zasluženi bonusi.',
        targetRtp: 96.0,
        hitRateTarget: 0.25,
        allowTwoSymbolPay: ['coin'], // Only coin gives small consolation on 2
        payout3Multiplier: 1.0,
        meterTurnoverRequired: { cards: 450, mines: 600, wheel: 850 }, // in RSD
        minesHouseEdge: 0.04,
        forceWin: false,
        weights: {
          flower: 3,
          crown: 4,
          bar: 6,
          horseshoe: 8,
          seven: 9,
          bell: 12,
          coin: 16,
          diamond: 10,
          wheel: 3
        }
      },
      low: {
        id: 'low',
        name: 'Niska Volatilnost (Low)',
        shortName: 'LOW VOLATILITY',
        desc: 'Česti manji dobici (~40% hit rate), umeren rizik i duže trajanje kredita. Opuštena sesija.',
        targetRtp: 97.0,
        hitRateTarget: 0.40,
        allowTwoSymbolPay: ['coin', 'bell', 'seven'], // Frequent 2-symbol returns
        payout3Multiplier: 0.85,
        meterTurnoverRequired: { cards: 350, mines: 500, wheel: 700 },
        minesHouseEdge: 0.025,
        forceWin: false,
        weights: {
          flower: 5,
          crown: 7,
          bar: 8,
          horseshoe: 11,
          seven: 14,
          bell: 18,
          coin: 22,
          diamond: 14,
          wheel: 4
        }
      },
      high: {
        id: 'high',
        name: 'Visoka Volatilnost (High)',
        shortName: 'HIGH VOLATILITY',
        desc: 'Visok rizik i tenzija. Ređi dobici (~16% hit rate), isključivo 3 ista simbola plaćaju uz +50% jače isplate!',
        targetRtp: 94.5,
        hitRateTarget: 0.16,
        allowTwoSymbolPay: [], // No 2-symbol payouts! Only 3 of a kind!
        payout3Multiplier: 1.5, // 50% larger payouts on 3-of-a-kind!
        meterTurnoverRequired: { cards: 650, mines: 850, wheel: 1200 },
        minesHouseEdge: 0.06,
        forceWin: false,
        weights: {
          flower: 2,
          crown: 3,
          bar: 5,
          horseshoe: 7,
          seven: 8,
          bell: 12,
          coin: 24,
          diamond: 6,
          wheel: 2
        }
      },
      demo: {
        id: 'demo',
        name: 'Demo Prezentacija (100% Hit)',
        shortName: 'DEMO 100% HIT',
        desc: 'Specijalni prezentacioni režim za prezentacije klijentima. Svaki spin donosi dobitke i munjevito puni bonuse!',
        targetRtp: 160.0,
        hitRateTarget: 0.98,
        allowTwoSymbolPay: ['coin', 'bell', 'seven', 'bar', 'horseshoe', 'crown', 'flower', 'wheel', 'diamond'],
        payout3Multiplier: 1.25,
        meterTurnoverRequired: { cards: 70, mines: 90, wheel: 130 }, // Ultra-fast charging for presentations!
        minesHouseEdge: 0.01,
        forceWin: true,
        weights: {
          flower: 8,
          crown: 10,
          bar: 12,
          horseshoe: 14,
          seven: 16,
          bell: 18,
          coin: 20,
          diamond: 16,
          wheel: 8
        }
      }
    };

    this.activePreset = 'standard';
    this.loadConfig();
    this.applyToGames();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem('igt_math_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activePreset && this.PRESETS[parsed.activePreset]) {
          this.activePreset = parsed.activePreset;
        }
      }
    } catch (e) {
      console.warn('Could not load math config, defaulting to standard:', e);
    }
  }

  saveConfig() {
    try {
      const data = {
        activePreset: this.activePreset
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save math config:', e);
    }
  }

  getActiveProfile() {
    return this.PRESETS[this.activePreset] || this.PRESETS.standard;
  }

  setPreset(presetId) {
    if (!this.PRESETS[presetId]) return;
    this.activePreset = presetId;
    this.saveConfig();
    this.applyToGames();
    this.updateHUD();

    if (window.slotApp && window.slotApp.showMessage) {
      const p = this.getActiveProfile();
      let localizedName = p.name;
      if (window.i18n) {
        if (this.activePreset === 'standard') localizedName = window.i18n.t('volatilityStandardTitle');
        else if (this.activePreset === 'low') localizedName = window.i18n.t('volatilityLowTitle');
        else if (this.activePreset === 'high') localizedName = window.i18n.t('volatilityHighTitle');
        else if (this.activePreset === 'demo') localizedName = window.i18n.t('volatilityDemoTitle');
      }
      const msg = window.i18n 
        ? window.i18n.t('mathPresetActivated', { name: localizedName.toUpperCase() })
        : `⚡ MATEMATIČKI REŽIM: ${p.name.toUpperCase()}`;
      window.slotApp.showMessage(msg, 'jackpot');
    }
  }

  applyToGames() {
    const profile = this.getActiveProfile();
    const weights = profile.weights;

    // 1. Update CLASSIC_SYMBOLS
    if (window.CLASSIC_SYMBOLS) {
      window.CLASSIC_SYMBOLS.forEach(sym => {
        if (weights[sym.id] !== undefined) {
          sym.weight = weights[sym.id];
        }
      });
    }

    // 2. Update ROYAL_SYMBOLS
    if (window.ROYAL_SYMBOLS) {
      window.ROYAL_SYMBOLS.forEach(sym => {
        if (weights[sym.id] !== undefined) {
          sym.weight = weights[sym.id];
        }
      });
    }

    // 3. Update Mines House Edge
    if (window.slotApp && window.slotApp.minesGame) {
      window.slotApp.minesGame.houseEdge = profile.minesHouseEdge;
    }

    this.updateHUD();
  }

  updateHUD() {
    const profile = this.getActiveProfile();
    const activeId = this.activePreset;

    const lbl = document.getElementById('hud-volatility-name');
    if (lbl) {
      lbl.textContent = profile.shortName;
    }

    const subLbl = document.getElementById('hud-volatility-sub');
    if (subLbl) {
      subLbl.textContent = (activeId === 'standard' ? 'STD' : (activeId === 'low' ? 'LOW' : (activeId === 'high' ? 'HIGH' : '100%')));
    }

    // Highlight active card in volatility modal if open
    document.querySelectorAll('.volatility-option-card').forEach(card => {
      const pid = card.getAttribute('data-preset');
      card.classList.toggle('active', pid === this.activePreset);
    });
  }

  /**
   * High-Speed Monte Carlo Simulation
   */
  runSimulation(gameType = 'royal3x3', totalSpins = 50000) {
    const symbols = (gameType === 'classic') ? window.CLASSIC_SYMBOLS : window.ROYAL_SYMBOLS;
    const profile = this.getActiveProfile();
    const weights = profile.weights;

    const symList = symbols.map(s => ({
      id: s.id,
      name: s.name,
      weight: weights[s.id] !== undefined ? weights[s.id] : s.weight,
      payout3: s.payout3,
      payout2: s.payout2
    }));

    const totalWeight = symList.reduce((sum, s) => sum + s.weight, 0);

    const getRandomSym = () => {
      let r = Math.random() * totalWeight;
      for (let i = 0; i < symList.length; i++) {
        if (r < symList[i].weight) return symList[i];
        r -= symList[i].weight;
      }
      return symList[symList.length - 1];
    };

    let totalBet = 0;
    let totalWon = 0;
    let hits = 0;
    let maxWinMult = 0;
    const symbolHits = {};
    symList.forEach(s => { symbolHits[s.id] = { count: 0, won: 0 }; });

    const bet = 100;

    for (let spin = 0; spin < totalSpins; spin++) {
      totalBet += bet;
      let spinWin = 0;

      if (gameType === 'classic') {
        const s1 = getRandomSym();
        const s2 = getRandomSym();
        const s3 = getRandomSym();

        let winMult = 0;
        let winSymId = null;

        if (s1.id === s2.id && s2.id === s3.id) {
          winMult = Math.round(s1.payout3 * profile.payout3Multiplier);
          winSymId = s1.id;
        } else if (s1.id === s2.id && profile.allowTwoSymbolPay.includes(s1.id)) {
          winMult = s1.payout2;
          winSymId = s1.id;
        }

        if (winMult > 0) {
          spinWin = bet * winMult;
          symbolHits[winSymId].count++;
          symbolHits[winSymId].won += spinWin;
        }
      } else {
        const lineBet = bet / 5;
        const m = [
          [getRandomSym(), getRandomSym(), getRandomSym()],
          [getRandomSym(), getRandomSym(), getRandomSym()],
          [getRandomSym(), getRandomSym(), getRandomSym()]
        ];

        const lines = [
          [m[0][0], m[1][0], m[2][0]],
          [m[0][1], m[1][1], m[2][1]],
          [m[0][2], m[1][2], m[2][2]],
          [m[0][0], m[1][1], m[2][2]],
          [m[0][2], m[1][1], m[2][0]]
        ];

        let totalLineMult = 0;
        lines.forEach(l => {
          const s0 = l[0], s1 = l[1], s2 = l[2];
          let lMult = 0;
          let wSym = null;
          if (s0.id === s1.id && s1.id === s2.id) {
            lMult = Math.round(s0.payout3 * profile.payout3Multiplier);
            wSym = s0.id;
          } else if (s0.id === s1.id && profile.allowTwoSymbolPay.includes(s0.id)) {
            lMult = s0.payout2;
            wSym = s0.id;
          }

          if (lMult > 0) {
            totalLineMult += lMult;
            const lWin = lineBet * lMult;
            symbolHits[wSym].count++;
            symbolHits[wSym].won += lWin;
          }
        });

        spinWin = lineBet * totalLineMult;
      }

      if (spinWin > 0) {
        hits++;
        totalWon += spinWin;
        const currentMult = spinWin / bet;
        if (currentMult > maxWinMult) maxWinMult = currentMult;
      }
    }

    const rtp = ((totalWon / totalBet) * 100).toFixed(2);
    const hitRate = ((hits / totalSpins) * 100).toFixed(2);

    return {
      gameType,
      spins: totalSpins,
      totalBet,
      totalWon,
      rtp: parseFloat(rtp),
      hitRate: parseFloat(hitRate),
      maxWinMult: parseFloat(maxWinMult.toFixed(1)),
      symbolHits
    };
  }
}

window.SlotMathManager = SlotMathManager;
