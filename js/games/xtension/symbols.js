/**
 * Grand Xtension Link - Symbols & Paylines
 * 5 Reels, 3 to 8 Rows, 25 Paylines
 */
const XTENSION_SYMBOLS = [
  { id: 'flower', name: 'Zlatni Cvet', svg: 'assets/symbols/logo-flower.svg', weight: 4, payout5: 200, payout4: 50, payout3: 15, isWild: true },
  { id: 'crown', name: 'Zlatna Kruna', svg: 'assets/symbols/crown.svg', weight: 5, payout5: 100, payout4: 30, payout3: 10 },
  { id: 'seven', name: 'Zlatna 7', svg: 'assets/symbols/seven.svg', weight: 7, payout5: 60, payout4: 20, payout3: 8 },
  { id: 'bar', name: 'BAR', svg: 'assets/symbols/bar.svg', weight: 8, payout5: 40, payout4: 15, payout3: 5 },
  { id: 'horseshoe', name: 'Srećna Potkovica', svg: 'assets/symbols/horseshoe.svg', weight: 10, payout5: 30, payout4: 10, payout3: 4 },
  { id: 'bell', name: 'Zvono', svg: 'assets/symbols/bell.svg', weight: 12, payout5: 20, payout4: 8, payout3: 3 },
  { id: 'coin', name: 'Link Sfera', svg: 'assets/symbols/coin.svg', weight: 14, isLink: true, payout5: 10, payout4: 5, payout3: 2 }
];

// 25 Fixed Paylines across 5x3 reels (row indices: 0 = top, 1 = center, 2 = bottom)
const XTENSION_PAYLINES = [
  { id: 1, name: 'Linija 1 (Sredina)', rows: [1, 1, 1, 1, 1] },
  { id: 2, name: 'Linija 2 (Vrh)', rows: [0, 0, 0, 0, 0] },
  { id: 3, name: 'Linija 3 (Dno)', rows: [2, 2, 2, 2, 2] },
  { id: 4, name: 'Linija 4 (V)', rows: [0, 1, 2, 1, 0] },
  { id: 5, name: 'Linija 5 (Obrnuto V)', rows: [2, 1, 0, 1, 2] },
  { id: 6, name: 'Linija 6', rows: [0, 0, 1, 0, 0] },
  { id: 7, name: 'Linija 7', rows: [2, 2, 1, 2, 2] },
  { id: 8, name: 'Linija 8', rows: [1, 2, 2, 2, 1] },
  { id: 9, name: 'Linija 9', rows: [1, 0, 0, 0, 1] },
  { id: 10, name: 'Linija 10', rows: [0, 1, 0, 1, 0] },
  { id: 11, name: 'Linija 11', rows: [2, 1, 2, 1, 2] },
  { id: 12, name: 'Linija 12', rows: [1, 0, 1, 0, 1] },
  { id: 13, name: 'Linija 13', rows: [1, 2, 1, 2, 1] },
  { id: 14, name: 'Linija 14', rows: [0, 1, 1, 1, 0] },
  { id: 15, name: 'Linija 15', rows: [2, 1, 1, 1, 2] },
  { id: 16, name: 'Linija 16', rows: [0, 0, 1, 2, 2] },
  { id: 17, name: 'Linija 17', rows: [2, 2, 1, 0, 0] },
  { id: 18, name: 'Linija 18', rows: [1, 0, 2, 0, 1] },
  { id: 19, name: 'Linija 19', rows: [1, 2, 0, 2, 1] },
  { id: 20, name: 'Linija 20', rows: [0, 2, 0, 2, 0] },
  { id: 21, name: 'Linija 21', rows: [2, 0, 2, 0, 2] },
  { id: 22, name: 'Linija 22', rows: [0, 2, 2, 2, 0] },
  { id: 23, name: 'Linija 23', rows: [2, 0, 0, 0, 2] },
  { id: 24, name: 'Linija 24', rows: [0, 1, 2, 2, 2] },
  { id: 25, name: 'Linija 25', rows: [2, 1, 0, 0, 0] }
];

window.XTENSION_SYMBOLS = XTENSION_SYMBOLS;
window.XTENSION_PAYLINES = XTENSION_PAYLINES;
