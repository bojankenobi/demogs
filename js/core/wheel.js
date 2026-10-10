/**
 * Core Platform - IGT Wheel of Fortune (Kolo Sreće) Module
 * 3D High-Gloss Vegas Fortune Wheel with Canvas Renderer, Physics Spin,
 * Ratchet Peg Ticking, Pointer Deflection, Multipliers, Jackpots, and Free Spins Triggers.
 */
class IGTWheelBonus {
  constructor(wallet, jackpots, onAwardFreeSpins, onWheelComplete) {
    this.wallet = wallet;
    this.jackpots = jackpots;
    this.onAwardFreeSpins = onAwardFreeSpins;
    this.onWheelComplete = onWheelComplete;

    this.progress = 0; // 0 to 100%
    this.isSpinning = false;
    this.currentRotation = 0; // In radians
    this.dismissTimer = null;
    this.lastWinningSeg = null;
    this.lastWinCredits = 0;

    // Harmonized IGT Vegas Segment Palette with Bankrupt Risk (12 Segments)
    this.segments = [
      { label: '25x', sub: 'MULT', type: 'mult', val: 25, bg1: '#260845', bg2: '#53198a', textColor: '#fef08a' },
      { label: '10 FS', sub: '2x START', type: 'freespins', spins: 10, startMult: 2, bg1: '#4a1278', bg2: '#8b24d6', textColor: '#ffffff' },
      { label: '50x', sub: 'MULT', type: 'mult', val: 50, bg1: '#542e03', bg2: '#b3770e', textColor: '#fffbeb' },
      { label: 'BANKRUPT', sub: '0x GUBITAK', type: 'bust', val: 0, bg1: '#0a0a0a', bg2: '#2a0808', textColor: '#ef4444', isBust: true },
      { label: '30x', sub: 'MULT', type: 'mult', val: 30, bg1: '#260845', bg2: '#53198a', textColor: '#fef08a' },
      { label: '15 FS', sub: '3x START', type: 'freespins', spins: 15, startMult: 3, bg1: '#581c87', bg2: '#a855f7', textColor: '#ffffff' },
      { label: '75x', sub: 'MULT', type: 'mult', val: 75, bg1: '#542e03', bg2: '#b3770e', textColor: '#fffbeb' },
      { label: 'SILVER', sub: 'JACKPOT', type: 'jackpot', tier: 'silver', bg1: '#1e293b', bg2: '#475569', textColor: '#f1f5f9' },
      { label: 'GOLD', sub: 'JACKPOT', type: 'jackpot', tier: 'gold', bg1: '#78350f', bg2: '#d97706', textColor: '#fffbeb' },
      { label: '100x', sub: 'SUPER', type: 'mult', val: 100, bg1: '#580816', bg2: '#991b1b', textColor: '#fef08a' },
      { label: 'BANKRUPT', sub: '0x GUBITAK', type: 'bust', val: 0, bg1: '#0a0a0a', bg2: '#2a0808', textColor: '#ef4444', isBust: true },
      { label: '200x', sub: 'MEGA WIN', type: 'mult', val: 200, bg1: '#19032b', bg2: '#4c0d80', textColor: '#ffd700', isMega: true }
    ];

    this.initDOM();
    this.renderMeter();
  }

  initDOM() {
    this.crownEl = document.getElementById('wheel-topbox-crown');
    this.energyValEl = document.getElementById('wheel-energy-val');
    this.energyFillEl = document.getElementById('wheel-energy-fill');
    this.miniDiscEl = document.getElementById('wheel-mini-disc');

    this.modal = document.getElementById('wheel-modal');
    this.closeBtn = document.getElementById('btn-wheel-close');
    this.canvas = document.getElementById('wheel-canvas');
    this.spinBtn = document.getElementById('btn-spin-wheel');
    this.claimBtn = document.getElementById('btn-wheel-claim');
    this.winAnnouncement = document.getElementById('wheel-win-announcement');
    this.winValEl = document.getElementById('wheel-win-val');
    this.bulbsTrack = document.getElementById('wheel-bulbs-track');
    this.pointerAssembly = document.getElementById('wheel-pointer-assembly');

    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.drawWheel(0);
    }

    if (this.spinBtn) {
      this.spinBtn.addEventListener('click', () => this.spin());
    }

    if (this.claimBtn) {
      this.claimBtn.addEventListener('click', () => this.finalizeWinAndClose());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        if (!this.isSpinning) {
          if (window.slotAudio) window.slotAudio.playClick();
          this.closeModal();
        }
      });
    }

    // Dismiss on overlay click (outside modal card)
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal && !this.isSpinning) {
          this.closeModal();
        }
      });
    }

    // Dismiss on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active') && !this.isSpinning) {
        this.closeModal();
      }
    });

    if (this.crownEl) {
      this.crownEl.addEventListener('click', () => {
        if (!this.isSpinning) {
          if (this.progress >= 100) {
            if (window.slotAudio) window.slotAudio.playClick();
            this.openModal(false);
          } else {
            if (window.slotAudio) window.slotAudio.playClick();
            if (window.slotApp && window.slotApp.showMessage) {
              window.slotApp.showMessage(`🎡 IGT TOČAK SREĆE: PUNITE MERAČ SPINOVIMA (TRENUTNO ${Math.floor(this.progress)}%)`, 'warning');
            }
          }
        }
      });
    }

    this.initBulbs();
  }

  initBulbs() {
    if (!this.bulbsTrack) return;
    this.bulbsTrack.innerHTML = '';
    const bulbCount = 24;
    const r = 191; // Radius from 200, 200 center
    for (let i = 0; i < bulbCount; i++) {
      const angle = (i / bulbCount) * 2 * Math.PI;
      const x = 200 + r * Math.cos(angle);
      const y = 200 + r * Math.sin(angle);
      const bulb = document.createElement('div');
      bulb.className = `wheel-bulb ${i % 2 === 0 ? 'bulb-gold' : 'bulb-purple'}`;
      bulb.style.left = `${x}px`;
      bulb.style.top = `${y}px`;
      bulb.style.animationDelay = `${(i * 0.08).toFixed(2)}s`;
      this.bulbsTrack.appendChild(bulb);
    }
  }

  chargeOnSpin(bet) {
    if (this.isSpinning) return;
    const denom = (this.wallet && this.wallet.activeDenom) ? this.wallet.activeDenom : 1;
    const anteMultiplier = (this.wallet && this.wallet.isGoldenBet) ? 2.0 : 1.0;
    const betRsd = Math.max(1, (bet || 20) * denom * anteMultiplier);

    const mathMgr = window.slotApp?.mathManager || window.slotMathManager;
    const profile = mathMgr ? mathMgr.getActiveProfile() : null;
    const req = profile?.meterTurnoverRequired || { cards: 450, mines: 600, wheel: 850 };

    const increment = Math.max(0.5, +((betRsd / req.wheel) * 100).toFixed(1));
    this.progress = Math.min(100, +(this.progress + increment).toFixed(1));
    this.renderMeter();

    if (this.progress >= 100) {
      setTimeout(() => {
        if (!this.isSpinning) {
          this.openModal(true);
        }
      }, 700);
    }
  }

  renderMeter() {
    if (this.energyValEl) this.energyValEl.textContent = `${Math.floor(this.progress)}%`;
    if (this.energyFillEl) this.energyFillEl.style.width = `${this.progress}%`;
    if (this.crownEl) {
      this.crownEl.classList.toggle('ready', this.progress >= 100);
    }
    if (this.miniDiscEl) {
      this.miniDiscEl.style.transform = `rotate(${this.progress * 3.6}deg)`;
    }
  }

  openModal(isAuto = false) {
    if (!this.modal) return;
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }

    this.modal.classList.add('active');

    if (this.winAnnouncement) this.winAnnouncement.style.display = 'none';
    if (this.claimBtn) this.claimBtn.style.display = 'none';

    if (this.spinBtn) {
      this.spinBtn.disabled = false;
      this.spinBtn.style.display = 'block';
      this.spinBtn.innerHTML = '🎰 ZAVRTI TOČAK SREĆE 🎰';
    }

    if (this.closeBtn) {
      this.closeBtn.style.display = 'flex';
      this.closeBtn.disabled = false;
    }

    this.drawWheel(this.currentRotation);

    try {
      if (window.slotAudio && typeof window.slotAudio.playBonusNotification === 'function') {
        window.slotAudio.playBonusNotification();
      }
    } catch (e) {}

    if (isAuto) {
      // Auto-spin after 1.8s delay if player doesn't click
      this.autoSpinTimer = setTimeout(() => {
        if (!this.isSpinning && this.modal.classList.contains('active')) {
          this.spin();
        }
      }, 1800);
    }
  }

  closeModal() {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.autoSpinTimer) {
      clearTimeout(this.autoSpinTimer);
      this.autoSpinTimer = null;
    }

    if (this.modal) {
      this.modal.classList.remove('active');
    }
  }

  drawWheel(angleRad) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerR = cx - 5;
    const numSegs = this.segments.length;
    const segAngle = (2 * Math.PI) / numSegs;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    // 1. Draw 12 Slices
    for (let i = 0; i < numSegs; i++) {
      const seg = this.segments[i];
      const startA = i * segAngle;
      const endA = startA + segAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, outerR, startA, endA);
      ctx.closePath();

      // Radial slice gradient with metallic depth
      const grad = ctx.createRadialGradient(0, 0, 35, 0, 0, outerR);
      grad.addColorStop(0, seg.bg1);
      grad.addColorStop(0.7, seg.bg2);
      grad.addColorStop(1, seg.isMega ? '#7c1ebb' : seg.bg1);
      ctx.fillStyle = grad;
      ctx.fill();

      // Golden dividing rib
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(outerR * Math.cos(startA), outerR * Math.sin(startA));
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Thin inner highlight line on divider
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo((outerR - 2) * Math.cos(startA), (outerR - 2) * Math.sin(startA));
      ctx.strokeStyle = 'rgba(255, 245, 192, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Radial text rendering (oriented cleanly along the wedge centerline)
      ctx.save();
      ctx.rotate(startA + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Contrast drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;

      // Primary Label (Number / Jackpot Name)
      ctx.fillStyle = seg.textColor;
      ctx.font = seg.isMega 
        ? '900 15px Montserrat, Arial Black, sans-serif'
        : (seg.type === 'jackpot' ? '900 14px Cinzel, Montserrat, sans-serif' : '900 15px Montserrat, Arial Black, sans-serif');
      ctx.fillText(seg.label, outerR - 24, -4);

      // Secondary Sub-label (MULT, JACKPOT, 2x START, MEGA WIN)
      ctx.fillStyle = seg.isMega 
        ? '#fde047' 
        : (seg.textColor === '#ffffff' ? '#e9d5ff' : '#fcd34d');
      ctx.font = '700 8.5px Montserrat, sans-serif';
      ctx.fillText(seg.sub, outerR - 24, 9);

      ctx.restore();
    }

    // 2. Outer Rim Metallic Studs (Brass Pegs)
    for (let i = 0; i < numSegs; i++) {
      const pegAngle = i * segAngle;
      const px = Math.cos(pegAngle) * (outerR - 4);
      const py = Math.sin(pegAngle) * (outerR - 4);

      // Peg Shadow base
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#1c0a02';
      ctx.fill();

      // Brass Peg with highlight
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
      const pegGrad = ctx.createRadialGradient(px - 1, py - 1, 0.5, px, py, 3.5);
      pegGrad.addColorStop(0, '#ffffff');
      pegGrad.addColorStop(0.35, '#ffd700');
      pegGrad.addColorStop(1, '#854d0e');
      ctx.fillStyle = pegGrad;
      ctx.fill();
    }

    // 3. Center Metallic 3D Vegas Hub (Concentric Gold & Velvet Medallion)
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, 2 * Math.PI);
    const hubOuterGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 46);
    hubOuterGrad.addColorStop(0, '#fff5c0');
    hubOuterGrad.addColorStop(0.35, '#d4af37');
    hubOuterGrad.addColorStop(0.85, '#6a3f03');
    hubOuterGrad.addColorStop(1, '#231302');
    ctx.fillStyle = hubOuterGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner Velvet Medallion
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, 2 * Math.PI);
    const hubInnerGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 34);
    hubInnerGrad.addColorStop(0, '#2d0852');
    hubInnerGrad.addColorStop(0.65, '#140324');
    hubInnerGrad.addColorStop(1, '#080010');
    ctx.fillStyle = hubInnerGrad;
    ctx.fill();
    ctx.strokeStyle = '#dfb743';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Embossed IGT Brand Emblem
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 15px Cinzel, serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText('IGT', 0, 1);

    ctx.restore();
  }

  spin() {
    if (this.isSpinning) return;
    if (this.autoSpinTimer) clearTimeout(this.autoSpinTimer);
    this.isSpinning = true;

    if (this.spinBtn) {
      this.spinBtn.disabled = true;
      this.spinBtn.innerHTML = '⏳ TOČAK SE VRTI...';
    }
    if (this.closeBtn) {
      this.closeBtn.disabled = true;
    }
    if (this.winAnnouncement) {
      this.winAnnouncement.style.display = 'none';
    }

    // Weighted target selection:
    // Solid odds on multipliers and Free Spins; rare on 200x Mega and Jackpots
    const weights = [20, 16, 14, 6, 18, 12, 10, 14, 4, 8, 12, 3];
    const totalW = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalW;
    let targetIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) {
        targetIndex = i;
        break;
      }
      rand -= weights[i];
    }

    const numSegs = this.segments.length;
    const segAngle = (2 * Math.PI) / numSegs;
    const targetOffset = targetIndex * segAngle + segAngle / 2;
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6 to 8 full rotations
    const targetAngle = fullSpins * 2 * Math.PI + (3 * Math.PI / 2 - targetOffset);

    const startAngle = this.currentRotation % (2 * Math.PI);
    const totalRotation = (targetAngle - startAngle);
    const duration = 5200; // 5.2 seconds Vegas spin
    const startTime = performance.now();
    let lastPegIndex = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Deceleration curve: heavy initial spin followed by long gradual ratchet decay
      const ease = 1 - Math.pow(1 - progress, 3.8);
      const currentA = startAngle + totalRotation * ease;
      this.currentRotation = currentA;

      this.drawWheel(currentA);

      // Detect peg passing under pointer (-PI/2)
      const normalizedA = (currentA + Math.PI / 2) % (2 * Math.PI);
      const currentPeg = Math.floor((normalizedA >= 0 ? normalizedA : normalizedA + 2 * Math.PI) / segAngle);
      if (currentPeg !== lastPegIndex) {
        lastPegIndex = currentPeg;
        const tickPitch = 1.0 + (1 - progress) * 0.4;
        if (window.slotAudio) window.slotAudio.playWheelTick(tickPitch);

        // Mechanical pointer deflection bounce
        if (this.pointerAssembly) {
          this.pointerAssembly.classList.remove('peg-kick');
          void this.pointerAssembly.offsetWidth; // Reflow
          this.pointerAssembly.classList.add('peg-kick');
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.onSpinStopped(targetIndex);
      }
    };

    requestAnimationFrame(animate);
  }

  onSpinStopped(winnerIndex) {
    this.isSpinning = false;
    const winningSeg = this.segments[winnerIndex];
    this.lastWinningSeg = winningSeg;
    const bet = (this.wallet && this.wallet.bet) ? this.wallet.bet : 20;

    // Reset progress meter to 0%
    this.progress = 0;
    this.renderMeter();

    let displayAmountText = '';
    let winCredits = 0;

    if (winningSeg.type === 'bust') {
      winCredits = 0;
      displayAmountText = '💥 BANKRUPT! 0 RSD (POKUŠAJTE PONOVO)';
      if (window.slotAudio && typeof window.slotAudio.playMineExplode === 'function') {
        window.slotAudio.playMineExplode();
      } else if (window.slotAudio && typeof window.slotAudio.playClick === 'function') {
        window.slotAudio.playClick();
      }
    } else {
      if (window.slotAudio) window.slotAudio.playWheelWin();
      if (window.particleEngine) window.particleEngine.spawnCelebration(true);

      try {
        if (winningSeg.type === 'mult') {
          winCredits = bet * winningSeg.val;
          const denom = (this.wallet && this.wallet.activeDenom) ? this.wallet.activeDenom : 1;
          const rsdAmount = (winCredits * denom).toLocaleString();
          displayAmountText = `+${winCredits.toLocaleString()} KREDITA (${rsdAmount} RSD)`;
          if (this.wallet) this.wallet.addWin(winCredits);
          if (window.slotApp && window.slotApp.playerTracker) {
            window.slotApp.playerTracker.recordBonus('wheel');
          }
        } else if (winningSeg.type === 'freespins') {
          displayAmountText = `${winningSeg.spins} BESPLATNIH SPINOVA (${winningSeg.startMult}x START)!`;
        } else if (winningSeg.type === 'jackpot') {
          if (this.jackpots) {
            let claimRes = null;
            if (typeof this.jackpots.claimTier === 'function') {
              claimRes = this.jackpots.claimTier(winningSeg.tier);
            } else if (typeof this.jackpots.awardJackpot === 'function') {
              this.jackpots.awardJackpot(winningSeg.tier);
            }
            winCredits = (claimRes && claimRes.creditsWon) ? claimRes.creditsWon : (bet * 60);
            const prizeRsd = (claimRes && claimRes.prize) ? claimRes.prize.toFixed(2) : (winCredits).toLocaleString();
            displayAmountText = `JACKPOT ${winningSeg.tier.toUpperCase()} (${prizeRsd} RSD)!`;
          }
        }
      } catch (err) {
        console.error('Error processing wheel win:', err);
        displayAmountText = `DOBITAK ZABELEŽEN!`;
      }
    }

    this.lastWinCredits = winCredits;

    // Show win announcement banner
    if (this.winAnnouncement && this.winValEl) {
      this.winValEl.textContent = displayAmountText;
      this.winAnnouncement.style.display = 'block';
    }

    // Toggle control buttons: Hide spin button, show claim & close buttons
    if (this.spinBtn) {
      this.spinBtn.style.display = 'none';
    }
    if (this.claimBtn) {
      this.claimBtn.style.display = 'inline-block';
      this.claimBtn.textContent = (winningSeg.type === 'bust') ? 'ZATVORI' : (window.i18n ? window.i18n.t('wheelClaimBtn') : 'PREUZMI NAGRADU');
    }
    if (this.closeBtn) {
      this.closeBtn.disabled = false;
      this.closeBtn.style.display = 'flex';
    }

    // Auto-dismiss fallback timer: closes after 4.5s if player doesn't click
    this.dismissTimer = setTimeout(() => {
      this.finalizeWinAndClose();
    }, 4500);
  }

  finalizeWinAndClose() {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }

    const winningSeg = this.lastWinningSeg;
    const winCredits = this.lastWinCredits || 0;
    const bet = (this.wallet && this.wallet.bet) ? this.wallet.bet : 20;

    this.closeModal();

    try {
      if (winningSeg && winningSeg.type === 'freespins') {
        if (this.onAwardFreeSpins) {
          this.onAwardFreeSpins(winningSeg.spins, winningSeg.startMult);
        }
      } else if (winCredits >= bet * 25 && window.slotApp && window.slotApp.showBigWin) {
        window.slotApp.showBigWin(winCredits, () => {
          if (this.onWheelComplete) this.onWheelComplete(winCredits);
        });
      } else {
        if (this.onWheelComplete) this.onWheelComplete(winCredits);
      }
    } catch (err) {
      console.error('Error during wheel bonus handoff:', err);
      if (this.onWheelComplete) this.onWheelComplete(winCredits);
    }
  }
}

window.IGTWheelBonus = IGTWheelBonus;
