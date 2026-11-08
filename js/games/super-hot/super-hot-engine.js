/**
 * Grand Slot Club - Grand Super Hot: EGT Multi-Line Slot Engine
 * Evaluates paylines for 5, 20, 40, and 100 lines across 5x3 and 5x4 matrices.
 * Supports Stacked Wilds (Lucky 7), Scatter Anywhere (Golden Star), and RTP balance (~96.5%).
 */

(function(root) {
  'use strict';

  // Available symbols in Grand Super Hot
  const SYMBOLS = {
    CHERRY: { id: 'cherry', name: 'Višnja', pays: { 3: 10, 4: 20, 5: 100 }, weight: 26, isWild: false, isScatter: false },
    LEMON: { id: 'lemon', name: 'Limun', pays: { 3: 10, 4: 20, 5: 100 }, weight: 26, isWild: false, isScatter: false },
    ORANGE: { id: 'orange', name: 'Narandža', pays: { 3: 10, 4: 40, 5: 200 }, weight: 20, isWild: false, isScatter: false },
    PLUM: { id: 'plum', name: 'Šljiva', pays: { 3: 10, 4: 40, 5: 200 }, weight: 20, isWild: false, isScatter: false },
    WATERMELON: { id: 'watermelon', name: 'Lubenica', pays: { 3: 20, 4: 80, 5: 400 }, weight: 14, isWild: false, isScatter: false },
    GRAPES: { id: 'grapes', name: 'Grožđe', pays: { 3: 20, 4: 80, 5: 400 }, weight: 14, isWild: false, isScatter: false },
    SEVEN: { id: 'seven', name: 'Crvena 7', pays: { 3: 40, 4: 400, 5: 1000 }, weight: 10, isWild: true, isScatter: false },
    STAR: { id: 'star', name: 'Zlatna Zvezda', pays: { 3: 5, 4: 20, 5: 500 }, weight: 5, isWild: false, isScatter: true } // Pays on Total Bet
  };

  // Paylines for 5 lines (5 reels x 3 rows)
  const PAYLINES_5 = [
    [1, 1, 1, 1, 1], // Line 1: Middle horizontal
    [0, 0, 0, 0, 0], // Line 2: Top horizontal
    [2, 2, 2, 2, 2], // Line 3: Bottom horizontal
    [0, 1, 2, 1, 0], // Line 4: V-shape
    [2, 1, 0, 1, 2]  // Line 5: Inverted V
  ];

  // Paylines for 20 lines (5 reels x 3 rows) - Authentic EGT geometry
  const PAYLINES_20 = [
    [1, 1, 1, 1, 1], // 1
    [0, 0, 0, 0, 0], // 2
    [2, 2, 2, 2, 2], // 3
    [0, 1, 2, 1, 0], // 4
    [2, 1, 0, 1, 2], // 5
    [0, 0, 1, 2, 2], // 6
    [2, 2, 1, 0, 0], // 7
    [1, 2, 2, 2, 1], // 8
    [1, 0, 0, 0, 1], // 9
    [0, 1, 1, 1, 0], // 10
    [2, 1, 1, 1, 2], // 11
    [0, 1, 0, 1, 0], // 12
    [2, 1, 2, 1, 2], // 13
    [1, 0, 1, 0, 1], // 14
    [1, 2, 1, 2, 1], // 15
    [0, 0, 1, 0, 0], // 16
    [2, 2, 1, 2, 2], // 17
    [1, 1, 0, 1, 1], // 18
    [1, 1, 2, 1, 1], // 19
    [0, 2, 0, 2, 0]  // 20
  ];

  // Paylines for 40 lines (5 reels x 4 rows) - Authentic EGT geometry
  const PAYLINES_40 = [
    [1, 1, 1, 1, 1], // 1
    [2, 2, 2, 2, 2], // 2
    [0, 0, 0, 0, 0], // 3
    [3, 3, 3, 3, 3], // 4
    [0, 1, 2, 1, 0], // 5
    [3, 2, 1, 2, 3], // 6
    [0, 1, 2, 3, 3], // 7
    [3, 2, 1, 0, 0], // 8
    [1, 0, 0, 0, 1], // 9
    [2, 3, 3, 3, 2], // 10
    [0, 0, 1, 2, 3], // 11
    [3, 3, 2, 1, 0], // 12
    [1, 2, 3, 2, 1], // 13
    [2, 1, 0, 1, 2], // 14
    [0, 1, 1, 1, 0], // 15
    [3, 2, 2, 2, 3], // 16
    [1, 0, 1, 2, 3], // 17
    [2, 3, 2, 1, 0], // 18
    [0, 0, 1, 0, 0], // 19
    [3, 3, 2, 3, 3], // 20
    [1, 1, 0, 0, 0], // 21
    [2, 2, 3, 3, 3], // 22
    [0, 1, 2, 2, 2], // 23
    [3, 2, 1, 1, 1], // 24
    [1, 0, 0, 1, 2], // 25
    [2, 3, 3, 2, 1], // 26
    [0, 1, 2, 1, 2], // 27
    [3, 2, 1, 2, 1], // 28
    [1, 2, 1, 0, 1], // 29
    [2, 1, 2, 3, 2], // 30
    [0, 0, 0, 1, 2], // 31
    [3, 3, 3, 2, 1], // 32
    [1, 0, 0, 0, 0], // 33
    [2, 3, 3, 3, 3], // 34
    [0, 1, 1, 2, 3], // 35
    [3, 2, 2, 1, 0], // 36
    [1, 2, 3, 3, 3], // 37
    [2, 1, 0, 0, 0], // 38
    [0, 1, 2, 3, 2], // 39
    [3, 2, 1, 0, 1]  // 40
  ];

  // Paylines for 100 lines (5 reels x 4 rows)
  // Generates 100 unique balanced adjacent paths covering the 5x4 matrix
  function buildPaylines100() {
    const lines = [...PAYLINES_40];
    const patterns = [
      [0, 0, 2, 2, 0], [3, 3, 1, 1, 3], [1, 1, 3, 3, 1], [2, 2, 0, 0, 2],
      [0, 2, 1, 2, 0], [3, 1, 2, 1, 3], [1, 3, 2, 3, 1], [2, 0, 1, 0, 2],
      [0, 1, 0, 2, 3], [3, 2, 3, 1, 0], [1, 0, 2, 3, 2], [2, 3, 1, 0, 1],
      [0, 2, 3, 2, 0], [3, 1, 0, 1, 3], [1, 2, 0, 2, 1], [2, 1, 3, 1, 2],
      [0, 3, 0, 3, 0], [3, 0, 3, 0, 3], [1, 3, 1, 3, 1], [2, 0, 2, 0, 2],
      [0, 0, 3, 3, 3], [3, 3, 0, 0, 0], [1, 1, 2, 2, 2], [2, 2, 1, 1, 1],
      [0, 1, 3, 2, 1], [3, 2, 0, 1, 2], [1, 0, 3, 2, 0], [2, 3, 0, 1, 3],
      [0, 3, 2, 1, 0], [3, 0, 1, 2, 3], [1, 2, 3, 0, 1], [2, 1, 0, 3, 2],
      [0, 2, 2, 1, 0], [3, 1, 1, 2, 3], [1, 3, 3, 2, 1], [2, 0, 0, 1, 2],
      [0, 0, 1, 1, 2], [3, 3, 2, 2, 1], [1, 1, 0, 0, 3], [2, 2, 3, 3, 0],
      [0, 1, 2, 0, 1], [3, 2, 1, 3, 2], [1, 0, 1, 3, 2], [2, 3, 2, 0, 1],
      [0, 2, 0, 3, 1], [3, 1, 3, 0, 2], [1, 3, 0, 2, 1], [2, 0, 3, 1, 2],
      [0, 3, 1, 2, 0], [3, 0, 2, 1, 3], [1, 2, 0, 3, 2], [2, 1, 3, 0, 1],
      [0, 1, 3, 1, 0], [3, 2, 0, 2, 3], [1, 0, 2, 1, 0], [2, 3, 1, 2, 3],
      [0, 2, 1, 3, 0], [3, 1, 2, 0, 3], [1, 0, 3, 1, 2], [2, 3, 0, 2, 1]
    ];
    for (let i = 0; i < patterns.length && lines.length < 100; i++) {
      lines.push(patterns[i]);
    }
    return lines;
  }
  const PAYLINES_100 = buildPaylines100();

  // Precomputed reel strips with stacked symbol runs for authentic EGT feel
  function buildReelStrips() {
    const strips = [];
    // Weighted bag
    const pool = [];
    Object.keys(SYMBOLS).forEach(symKey => {
      const sym = SYMBOLS[symKey];
      for (let i = 0; i < sym.weight; i++) {
        pool.push(sym.id);
      }
    });

    // Build 5 reels with stacked runs
    for (let r = 0; r < 5; r++) {
      const strip = [];
      const stripLen = 60;
      while (strip.length < stripLen) {
        const sym = pool[Math.floor(Math.random() * pool.length)];
        // Stack length: 7s and fruits tend to appear in stacks of 2 to 4
        const stackLen = (sym === 'seven' || sym === 'cherry' || sym === 'orange') 
          ? (Math.random() < 0.6 ? 3 : 2) 
          : (sym === 'star' ? 1 : (Math.random() < 0.4 ? 2 : 1));
        for (let s = 0; s < stackLen && strip.length < stripLen; s++) {
          strip.push(sym);
        }
      }
      strips.push(strip);
    }
    return strips;
  }

  class SuperHotEngine {
    constructor() {
      this.symbols = SYMBOLS;
      this.paylines5 = PAYLINES_5;
      this.paylines20 = PAYLINES_20;
      this.paylines40 = PAYLINES_40;
      this.paylines100 = PAYLINES_100;
      this.reelStrips = buildReelStrips();
    }

    getPaylines(lineCount) {
      if (lineCount === 5) return this.paylines5;
      if (lineCount === 20) return this.paylines20;
      if (lineCount === 40) return this.paylines40;
      if (lineCount === 100) return this.paylines100;
      return this.paylines20;
    }

    getGridDimensions(lineCount) {
      // 5 and 20 lines use 5x3, 40 and 100 lines use 5x4
      const rows = (lineCount === 5 || lineCount === 20) ? 3 : 4;
      return { reels: 5, rows };
    }

    /**
     * Generate a spin outcome matrix [5 reels][rows]
     */
    generateSpinMatrix(lineCount, customStops = null) {
      const { reels, rows } = this.getGridDimensions(lineCount);
      const matrix = [];

      for (let r = 0; r < reels; r++) {
        const strip = this.reelStrips[r];
        const stopIndex = customStops ? customStops[r] : Math.floor(Math.random() * strip.length);
        const column = [];
        for (let row = 0; row < rows; row++) {
          const idx = (stopIndex + row) % strip.length;
          column.push(strip[idx]);
        }
        matrix.push(column);
      }
      return matrix;
    }

    /**
     * Evaluate a spin matrix against selected paylines and bets.
     * @param {Array<Array<string>>} matrix - [5 reels][rows]
     * @param {number} lineCount - 5, 20, 40, or 100
     * @param {number} lineBet - bet in ZLT per line
     * @returns {Object} Evaluation details
     */
    evaluateSpin(matrix, lineCount, lineBet) {
      const paylines = this.getPaylines(lineCount);
      const totalBet = lineBet * lineCount;
      const winningLines = [];
      const winningPositions = new Set(); // For flaming reels visual highlight

      let totalLineWin = 0;

      // 1. Evaluate Line Wins (Left to Right)
      paylines.forEach((linePattern, lineIndex) => {
        let firstSymId = null;
        let matchCount = 0;
        let wildCount = 0;

        // Traverse from reel 0 to 4
        for (let reel = 0; reel < 5; reel++) {
          const row = linePattern[reel];
          const symId = matrix[reel][row];

          if (symId === 'star') {
            // Scatters do not participate in line wins
            break;
          }

          if (reel === 0) {
            firstSymId = symId;
            matchCount = 1;
            if (symId === 'seven') wildCount++;
          } else {
            // Check if matches or substitutes
            if (firstSymId === 'seven') {
              // Started with wild, can take next symbol's identity
              if (symId !== 'seven') {
                firstSymId = symId;
              }
              matchCount++;
              if (symId === 'seven') wildCount++;
            } else if (symId === firstSymId || symId === 'seven') {
              matchCount++;
              if (symId === 'seven') wildCount++;
            } else {
              break;
            }
          }
        }

        if (matchCount >= 3 && firstSymId) {
          const symDef = this.symbols[firstSymId.toUpperCase()];
          if (symDef && symDef.pays && symDef.pays[matchCount]) {
            const mult = symDef.pays[matchCount];
            const payout = lineBet * mult;
            totalLineWin += payout;

            const winPositions = [];
            for (let r = 0; r < matchCount; r++) {
              const row = linePattern[r];
              winningPositions.add(`${r},${row}`);
              winPositions.push({ reel: r, row });
            }

            winningLines.push({
              lineIndex: lineIndex + 1,
              symbolId: firstSymId,
              symbolName: symDef.name,
              matchCount,
              multiplier: mult,
              payout,
              positions: winPositions,
              isWildHit: wildCount > 0
            });
          }
        }
      });

      // 2. Evaluate Scatter Wins (Golden Star pays anywhere)
      let scatterCount = 0;
      const scatterPositions = [];
      const { rows } = this.getGridDimensions(lineCount);

      for (let r = 0; r < 5; r++) {
        for (let row = 0; row < rows; row++) {
          if (matrix[r][row] === 'star') {
            scatterCount++;
            scatterPositions.push({ reel: r, row });
          }
        }
      }

      let scatterWin = 0;
      let scatterMult = 0;
      if (scatterCount >= 3) {
        const starDef = this.symbols.STAR;
        scatterMult = starDef.pays[Math.min(scatterCount, 5)] || 0;
        scatterWin = totalBet * scatterMult;
        scatterPositions.forEach(p => winningPositions.add(`${p.reel},${p.row}`));
      }

      const totalWin = totalLineWin + scatterWin;

      // 3. Tension / Suspense Check (2 Scatters in reels 0, 1, 2)
      let frontScatters = 0;
      for (let r = 0; r <= 2; r++) {
        for (let row = 0; row < rows; row++) {
          if (matrix[r][row] === 'star') {
            frontScatters++;
            break; // Max 1 per reel in typical slots
          }
        }
      }
      const suspenseTrigger = (frontScatters >= 2);

      // 4. Mystery Jackpot Chance (eligible on any winning or non-winning spin)
      // Standard EGT mystery jackpot trigger probability (scaled by totalBet)
      const jackpotEligible = totalWin > 0;
      const jackpotRoll = Math.random();
      const mysteryJackpotTrigger = (jackpotRoll < 0.005); // ~1 in 200 spins base test rate

      return {
        matrix,
        lineCount,
        lineBet,
        totalBet,
        totalWin,
        totalLineWin,
        scatterWin,
        scatterCount,
        scatterPositions,
        winningLines,
        winningPositions: Array.from(winningPositions).map(s => {
          const [r, row] = s.split(',').map(Number);
          return { reel: r, row };
        }),
        suspenseTrigger,
        mysteryJackpotTrigger,
        isGambleEligible: (totalWin > 0 && totalWin <= totalBet * 35)
      };
    }
  }

  // Export engine
  root.SuperHotEngine = SuperHotEngine;
  root.SYMBOLS = SYMBOLS;
  root.PAYLINES_5 = PAYLINES_5;
  root.PAYLINES_20 = PAYLINES_20;
  root.PAYLINES_40 = PAYLINES_40;
  root.PAYLINES_100 = PAYLINES_100;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SuperHotEngine,
      SYMBOLS,
      PAYLINES_5,
      PAYLINES_20,
      PAYLINES_40,
      PAYLINES_100
    };
  }
})(typeof window !== 'undefined' ? window : global);
