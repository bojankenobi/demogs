/**
 * Classic 1-Line Slot Symbols and Paytable
 */
const CLASSIC_SYMBOLS = [
  { id: 'flower', name: 'Zlatni Cvet', svg: 'assets/symbols/logo-flower.svg', weight: 4, payout3: 100, payout2: 10 },
  { id: 'wheel', name: 'Točak Sreće', svg: 'assets/symbols/wheel-scatter.svg', weight: 3, payout3: 50, payout2: 5, isWheelScatter: true },
  { id: 'crown', name: 'Zlatna Kruna', svg: 'assets/symbols/crown.svg', weight: 5, payout3: 75, payout2: 8 },
  { id: 'bar', name: 'BAR', svg: 'assets/symbols/bar.svg', weight: 6, payout3: 40, payout2: 5 },
  { id: 'horseshoe', name: 'Srećna Potkovica', svg: 'assets/symbols/horseshoe.svg', weight: 8, payout3: 30, payout2: 4 },
  { id: 'seven', name: 'Zlatna 7', svg: 'assets/symbols/seven.svg', weight: 9, payout3: 25, payout2: 3 },
  { id: 'bell', name: 'Zvono', svg: 'assets/symbols/bell.svg', weight: 12, payout3: 15, payout2: 2 },
  { id: 'coin', name: 'Zlatnik', svg: 'assets/symbols/coin.svg', weight: 15, payout3: 10, payout2: 1.5 },
  { id: 'diamond', name: 'Dijamant', svg: 'assets/symbols/diamond.svg', weight: 10, payout3: 20, payout2: 2 }
];

window.CLASSIC_SYMBOLS = CLASSIC_SYMBOLS;
