/**
 * Royal 3x3 Slot Symbols and 5 Fixed Paylines
 */
const ROYAL_SYMBOLS = [
  { id: 'flower', name: 'IGT Simbol', svg: 'assets/symbols/logo-flower.svg', weight: 4, payout3: 100, payout2: 10 },
  { id: 'wheel', name: 'Točak Sreće', svg: 'assets/symbols/wheel-scatter.svg', weight: 3, payout3: 50, payout2: 5, isWheelScatter: true },
  { id: 'crown', name: 'Zlatna Kruna', svg: 'assets/symbols/crown.svg', weight: 5, payout3: 75, payout2: 8 },
  { id: 'bar', name: 'BAR', svg: 'assets/symbols/bar.svg', weight: 6, payout3: 40, payout2: 5 },
  { id: 'horseshoe', name: 'Srećna Potkovica', svg: 'assets/symbols/horseshoe.svg', weight: 8, payout3: 30, payout2: 4 },
  { id: 'seven', name: 'Zlatna 7', svg: 'assets/symbols/seven.svg', weight: 9, payout3: 25, payout2: 3 },
  { id: 'bell', name: 'Zvono', svg: 'assets/symbols/bell.svg', weight: 12, payout3: 15, payout2: 2 },
  { id: 'coin', name: 'Zlatnik', svg: 'assets/symbols/coin.svg', weight: 15, payout3: 10, payout2: 1.5 },
  { id: 'diamond', name: 'Dijamant', svg: 'assets/symbols/diamond.svg', weight: 10, payout3: 20, payout2: 2 }
];

const ROYAL_PAYLINES = [
  { id: 1, name: 'Linija 1 (Vrh)', rows: [0, 0, 0] },
  { id: 2, name: 'Linija 2 (Sredina)', rows: [1, 1, 1] },
  { id: 3, name: 'Linija 3 (Dno)', rows: [2, 2, 2] },
  { id: 4, name: 'Linija 4 (Dijagonala \)', rows: [0, 1, 2] },
  { id: 5, name: 'Linija 5 (Dijagonala /)', rows: [2, 1, 0] }
];

window.ROYAL_SYMBOLS = ROYAL_SYMBOLS;
window.ROYAL_PAYLINES = ROYAL_PAYLINES;
