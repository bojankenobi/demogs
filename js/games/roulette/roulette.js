/**
 * Grand Slot Club - European Royal Roulette (Evropski Rulet)
 * 
 * Single-Zero European Roulette Engine
 * Features:
 * - 37 Pockets (0 green, 1-36 alternating red/black)
 * - Canvas 60FPS Wheel Rotation & Decelerating Ball Physics
 * - Full European Table Layout: Straight-up (35:1), Red/Black, Even/Odd, 1-18/19-36 (1:1), Dozens & Columns (2:1)
 * - Interactive Chip Placement with Stacking & Re-bet / 2X / Clear Controls
 * - Winning Number History Strip
 * - Integrated with Wallet & Player Tracker
 */

// European Roulette Wheel Number Sequence
const ROULETTE_WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

if (typeof window !== 'undefined') {
  window.ROULETTE_WHEEL_NUMBERS = ROULETTE_WHEEL_NUMBERS;
  window.RED_NUMBERS = RED_NUMBERS;
}

class RoyalRouletteGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.isSpinning = false;
    this.selectedChip = 20; // 10, 20, 50, 100, 500
    this.bets = {}; // spotId -> amount
    this.lastBets = {};
    this.history = [32, 15, 0, 19, 4, 21, 2];

    // Physics Animation
    this.wheelAngle = 0;
    this.ballAngle = 0;
    this.wheelSpeed = 0;
    this.ballSpeed = 0;
    this.animFrameId = null;

    this.viewContainer = document.getElementById('roulette-game-view');
    this.canvasEl = document.getElementById('roulette-wheel-canvas');
    this.ctx = this.canvasEl ? this.canvasEl.getContext('2d') : null;

    this.bindEvents();
  }

  getNumberColor(num) {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  }

  bindEvents() {
    // Chip Selector
    const chips = document.querySelectorAll('.roulette-chip-opt');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.isSpinning) return;
        chips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedChip = Number(chip.getAttribute('data-value')) || 20;
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      });
    });

    // Control Buttons
    const btnSpin = document.getElementById('btn-roulette-spin');
    if (btnSpin) {
      btnSpin.addEventListener('click', () => this.spin());
    }

    const btnClear = document.getElementById('btn-roulette-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.clearBets());
    }

    const btnDouble = document.getElementById('btn-roulette-double');
    if (btnDouble) {
      btnDouble.addEventListener('click', () => this.doubleBets());
    }

    const btnRebet = document.getElementById('btn-roulette-rebet');
    if (btnRebet) {
      btnRebet.addEventListener('click', () => this.rebet());
    }

    // Table Spot Betting
    this.bindTableSpots();
  }

  bindTableSpots() {
    const spots = document.querySelectorAll('.roulette-bet-spot');
    spots.forEach(spot => {
      spot.addEventListener('click', () => {
        if (this.isSpinning) return;
        const spotId = spot.getAttribute('data-spot');
        if (spotId) this.placeBet(spotId, spot);
      });
    });
  }

  placeBet(spotId, spotElement) {
    if (!this.wallet) return;

    if (this.wallet.balance < this.selectedChip) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Nemate dovoljno ZLT kredita za ovaj čip!', 'normal');
      }
      return;
    }

    // Deduct chip
    this.wallet.balance -= this.selectedChip;
    this.wallet.updateUI();

    this.bets[spotId] = (this.bets[spotId] || 0) + this.selectedChip;

    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();

    this.renderChipOnSpot(spotId, spotElement);
    this.updateTotalBetDisplay();
  }

  renderChipOnSpot(spotId, spotElement) {
    let chipEl = spotElement.querySelector('.table-chip-marker');
    if (!chipEl) {
      chipEl = document.createElement('div');
      chipEl.className = 'table-chip-marker';
      spotElement.appendChild(chipEl);
    }
    chipEl.textContent = this.bets[spotId] >= 1000 ? `${(this.bets[spotId]/1000).toFixed(1)}k` : this.bets[spotId];
  }

  clearBets() {
    if (this.isSpinning) return;
    const totalBet = Object.values(this.bets).reduce((a, b) => a + b, 0);
    if (totalBet > 0 && this.wallet) {
      this.wallet.balance += totalBet;
      this.wallet.updateUI();
    }
    this.bets = {};
    document.querySelectorAll('.table-chip-marker').forEach(m => m.remove());
    this.updateTotalBetDisplay();
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  doubleBets() {
    if (this.isSpinning) return;
    const totalBet = Object.values(this.bets).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return;

    if (this.wallet.balance < totalBet) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Nemate dovoljno kredita za dupliranje!', 'normal');
      }
      return;
    }

    this.wallet.balance -= totalBet;
    this.wallet.updateUI();

    Object.keys(this.bets).forEach(spotId => {
      this.bets[spotId] *= 2;
      const spot = document.querySelector(`.roulette-bet-spot[data-spot="${spotId}"]`);
      if (spot) this.renderChipOnSpot(spotId, spot);
    });

    this.updateTotalBetDisplay();
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  rebet() {
    if (this.isSpinning) return;
    if (Object.keys(this.lastBets).length === 0) return;

    this.clearBets();
    const needed = Object.values(this.lastBets).reduce((a, b) => a + b, 0);
    if (this.wallet.balance < needed) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Nemate dovoljno kredita za ponavljanje uloga!', 'normal');
      }
      return;
    }

    this.wallet.balance -= needed;
    this.wallet.updateUI();

    this.bets = { ...this.lastBets };
    Object.keys(this.bets).forEach(spotId => {
      const spot = document.querySelector(`.roulette-bet-spot[data-spot="${spotId}"]`);
      if (spot) this.renderChipOnSpot(spotId, spot);
    });

    this.updateTotalBetDisplay();
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  updateTotalBetDisplay() {
    const total = Object.values(this.bets).reduce((a, b) => a + b, 0);
    const betEl = document.getElementById('roulette-total-bet');
    if (betEl) betEl.textContent = `${total} ZLT`;
  }

  mount() {
    this.isActive = true;
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }
    this.renderHistory();
    this.drawWheel(0, 0);
  }

  unmount() {
    this.isActive = false;
    this.isSpinning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
  }

  forceExit() {
    this.isSpinning = false;
  }

  renderHistory() {
    const historyList = document.getElementById('roulette-history-list');
    if (!historyList) return;

    historyList.innerHTML = this.history.slice(0, 10).map(num => {
      const col = this.getNumberColor(num);
      return `<span class="roulette-hist-pill pill-${col}">${num}</span>`;
    }).join('');
  }

  drawWheel(wheelAngle, ballAngle) {
    if (!this.canvasEl) {
      this.canvasEl = document.getElementById('roulette-wheel-canvas');
      if (this.canvasEl) this.ctx = this.canvasEl.getContext('2d');
    }
    if (!this.ctx || !this.canvasEl) return;

    const ctx = this.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2 - 10;

    ctx.clearRect(0, 0, w, h);

    // Outer Mahogany Rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#2c1208';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();

    // Golden Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
    ctx.fillStyle = '#110702';
    ctx.fill();
    ctx.strokeStyle = '#aa771c';
    ctx.stroke();

    // Pockets
    const pocketCount = 37;
    const step = (Math.PI * 2) / pocketCount;
    const innerRadius = radius - 45;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wheelAngle);

    for (let i = 0; i < pocketCount; i++) {
      const angle = i * step;
      const num = ROULETTE_WHEEL_NUMBERS[i];
      const color = this.getNumberColor(num);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 10, angle, angle + step);
      ctx.closePath();

      if (color === 'green') ctx.fillStyle = '#059669';
      else if (color === 'red') ctx.fillStyle = '#dc2626';
      else ctx.fillStyle = '#1e1b18';
      ctx.fill();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number Label
      ctx.save();
      ctx.rotate(angle + step / 2);
      ctx.translate(radius - 24, 0);
      ctx.rotate(Math.PI / 2);
      ctx.font = 'bold 9px Cinzel, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), 0, 0);
      ctx.restore();
    }

    // Inner Brass Cone & Turret
    const turretGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, innerRadius);
    turretGrad.addColorStop(0, '#ffe066');
    turretGrad.addColorStop(0.5, '#d4af37');
    turretGrad.addColorStop(1, '#8b6508');
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = turretGrad;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.restore();

    // Draw Ivory Ball
    if (this.isSpinning) {
      const ballRadius = radius - 20;
      const bx = cx + Math.cos(ballAngle) * ballRadius;
      const by = cy + Math.sin(ballAngle) * ballRadius;

      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  spin() {
    if (this.isSpinning) return;

    const totalBet = Object.values(this.bets).reduce((a, b) => a + b, 0);
    if (totalBet === 0) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Postavite uloge na rulet stolu pre okretanja!', 'normal');
      }
      return;
    }

    this.isSpinning = true;
    this.lastBets = { ...this.bets };

    const btnSpin = document.getElementById('btn-roulette-spin');
    if (btnSpin) btnSpin.disabled = true;

    // Pick random winning number (0-36)
    const winningNumber = Math.floor(Math.random() * 37);

    // Physics parameters
    let startTime = performance.now();
    const duration = 4000; // 4 seconds spin
    let wheelVelocity = 0.08;
    let ballVelocity = -0.16;

    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Decelerate
      const easeOut = 1 - Math.pow(progress, 2.5);
      this.wheelAngle += wheelVelocity * easeOut;
      this.ballAngle += ballVelocity * easeOut;

      this.drawWheel(this.wheelAngle, this.ballAngle);

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.drawWheel(this.wheelAngle, this.ballAngle);
        this.finishSpin(winningNumber);
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  finishSpin(winNum) {
    const btnSpin = document.getElementById('btn-roulette-spin');
    if (btnSpin) btnSpin.disabled = false;

    this.history.unshift(winNum);
    this.renderHistory();

    const winColor = this.getNumberColor(winNum);

    // Calculate Payouts
    let totalWin = 0;
    const isRed = winColor === 'red';
    const isBlack = winColor === 'black';
    const isEven = (winNum !== 0 && winNum % 2 === 0);
    const isOdd = (winNum !== 0 && winNum % 2 !== 0);
    const isLow = (winNum >= 1 && winNum <= 18);
    const isHigh = (winNum >= 19 && winNum <= 36);

    const is1stDozen = (winNum >= 1 && winNum <= 12);
    const is2ndDozen = (winNum >= 13 && winNum <= 24);
    const is3rdDozen = (winNum >= 25 && winNum <= 36);

    const colRemainder = winNum > 0 ? (winNum % 3) : -1;
    const isCol1 = colRemainder === 1;
    const isCol2 = colRemainder === 2;
    const isCol3 = colRemainder === 0;

    Object.entries(this.bets).forEach(([spotId, amount]) => {
      // Straight-up number
      if (spotId === `num_${winNum}`) totalWin += amount * 36;
      else if (spotId === 'color_red' && isRed) totalWin += amount * 2;
      else if (spotId === 'color_black' && isBlack) totalWin += amount * 2;
      else if (spotId === 'even' && isEven) totalWin += amount * 2;
      else if (spotId === 'odd' && isOdd) totalWin += amount * 2;
      else if (spotId === 'low' && isLow) totalWin += amount * 2;
      else if (spotId === 'high' && isHigh) totalWin += amount * 2;
      else if (spotId === 'dozen_1' && is1stDozen) totalWin += amount * 3;
      else if (spotId === 'dozen_2' && is2ndDozen) totalWin += amount * 3;
      else if (spotId === 'dozen_3' && is3rdDozen) totalWin += amount * 3;
      else if (spotId === 'col_1' && isCol1) totalWin += amount * 3;
      else if (spotId === 'col_2' && isCol2) totalWin += amount * 3;
      else if (spotId === 'col_3' && isCol3) totalWin += amount * 3;
    });

    const statusBanner = document.getElementById('roulette-status-banner');
    const colorLabel = winColor === 'green' ? 'ZELENA NULA' : (winColor === 'red' ? 'CRVENO' : 'CRNO');

    if (totalWin > 0) {
      this.wallet.balance += totalWin;
      this.wallet.updateUI();

      if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
      if (window.particleEngine && window.particleEngine.burst) window.particleEngine.burst(300, 250);

      if (statusBanner) {
        statusBanner.textContent = `🎯 POBEDNIČKI BROJ: ${winNum} (${colorLabel})! DOBITAK: +${totalWin.toLocaleString()} ZLT!`;
        statusBanner.className = 'roulette-status-banner win';
      }

      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage(`🏆 EVROPSKI RULET: ${winNum} ${colorLabel}! DOBITAK: +${totalWin.toLocaleString()} ZLT!`, 'jackpot');
      }

      if (window.slotApp?.playerTracker) {
        window.slotApp.playerTracker.recordSpin('roulette', Object.values(this.bets).reduce((a, b) => a + b, 0), totalWin);
      }
    } else {
      if (statusBanner) {
        statusBanner.textContent = `🎯 POBEDNIČKI BROJ: ${winNum} (${colorLabel}). Nema dobitnih uloga.`;
        statusBanner.className = 'roulette-status-banner normal';
      }

      if (window.slotApp?.playerTracker) {
        window.slotApp.playerTracker.recordSpin('roulette', Object.values(this.bets).reduce((a, b) => a + b, 0), 0);
      }
    }

    // Clear current bets
    this.bets = {};
    document.querySelectorAll('.table-chip-marker').forEach(m => m.remove());
    this.updateTotalBetDisplay();
  }
}

window.RoyalRouletteGame = RoyalRouletteGame;
