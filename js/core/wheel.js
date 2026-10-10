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

    window.addEventListener('resize', () => {
      if (this.modal && this.modal.classList.contains('active')) {
        this.drawWheel(this.currentRotation);
      }
    });

    this.initBulbs();
  }

  initBulbs() {
    if (!this.bulbsTrack) return;
    this.bulbsTrack.innerHTML = '';
    const bulbCount = 24;
    // Exactly 46.5% radius from center (50%, 50%), placing bulbs dead-center in the golden bezel raceway
    const rPct = 46.5;
    for (let i = 0; i < bulbCount; i++) {
      // Offset by half an interval so the 12 o'clock pointer is cleanly framed between two bulbs
      const angle = (i / bulbCount) * 2 * Math.PI - Math.PI / 2 + (Math.PI / bulbCount);
      const xPct = 50 + rPct * Math.cos(angle);
      const yPct = 50 + rPct * Math.sin(angle);
      const bulb = document.createElement('div');
      bulb.className = `wheel-bulb ${i % 2 === 0 ? 'bulb-gold' : 'bulb-purple'}`;
      bulb.style.left = `${xPct.toFixed(3)}%`;
      bulb.style.top = `${yPct.toFixed(3)}%`;
      bulb.style.animationDelay = `${(i * 0.05).toFixed(2)}s`;
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
    this.modal.classList.remove('is-spinning', 'has-won');

    if (this.winAnnouncement) this.winAnnouncement.style.display = 'none';
    if (this.claimBtn) this.claimBtn.style.display = 'none';

    if (this.spinBtn) {
      this.spinBtn.disabled = false;
      this.spinBtn.style.display = 'block';
      this.spinBtn.innerHTML = window.i18n ? window.i18n.t('wheelSpinBtn') : '🎰 ZAVRTI TOČAK SREĆE 🎰';
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
      this.modal.classList.remove('active', 'is-spinning', 'has-won');
    }
  }

  drawWheel(angleRad) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    
    // Auto high-DPI resolution scaling
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    const displaySize = Math.max(280, Math.round(rect.width || 340));
    const renderSize = Math.round(displaySize * dpr);

    if (this.canvas.width !== renderSize || this.canvas.height !== renderSize) {
      this.canvas.width = renderSize;
      this.canvas.height = renderSize;
    }

    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const outerR = cx - 2;
    const rimWidth = Math.round(renderSize * 0.046);
    const sliceOuterR = outerR - rimWidth;
    const numSegs = this.segments.length;
    const segAngle = (2 * Math.PI) / numSegs;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    const hubR = Math.round(renderSize * 0.135);

    // 1. Draw 12 Slices
    for (let i = 0; i < numSegs; i++) {
      const seg = this.segments[i];
      const startA = i * segAngle;
      const endA = startA + segAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, sliceOuterR, startA, endA);
      ctx.closePath();

      // Deep metallic jewel slice gradient
      const grad = ctx.createRadialGradient(0, 0, renderSize * 0.1, 0, 0, sliceOuterR);
      grad.addColorStop(0, seg.bg1);
      grad.addColorStop(0.65, seg.bg2);
      grad.addColorStop(1, seg.isMega ? '#7c1ebb' : seg.bg1);
      ctx.fillStyle = grad;
      ctx.fill();

      // Heavy 3D golden dividing rib
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(sliceOuterR * Math.cos(startA), sliceOuterR * Math.sin(startA));
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = Math.max(2.5, Math.round(renderSize * 0.007));
      ctx.stroke();

      // Specular highlight pinstripe on rib
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo((sliceOuterR - 2) * Math.cos(startA), (sliceOuterR - 2) * Math.sin(startA));
      ctx.strokeStyle = 'rgba(255, 248, 200, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 2. High-legibility Tangential IGT Vegas Arc Text in each Slice
    // Centered along the wedge curve with top of letters pointing toward the outer rim.
    // Under the pointer at 12 o'clock, text lands perfectly horizontal and upright!
    const sliceSpan = sliceOuterR - hubR;
    const textR = hubR + sliceSpan * 0.55;
    const maxW = Math.round(2 * textR * Math.sin(segAngle / 2) * 0.88);

    for (let i = 0; i < numSegs; i++) {
      const seg = this.segments[i];
      const startA = i * segAngle;
      const midA = startA + segAngle / 2;

      ctx.save();
      const tx = Math.cos(midA) * textR;
      const ty = Math.sin(midA) * textR;
      ctx.translate(tx, ty);
      ctx.rotate(midA + Math.PI / 2);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Deep contrast drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = Math.round(renderSize * 0.012);
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;

      // Primary Label (Number / Jackpot Name)
      ctx.fillStyle = seg.textColor;
      const mainFontSize = Math.round(renderSize * (seg.isMega ? 0.040 : (seg.type === 'jackpot' ? 0.036 : 0.042)));
      ctx.font = `900 ${mainFontSize}px Montserrat, Arial Black, sans-serif`;
      ctx.fillText(seg.label, 0, -Math.round(renderSize * 0.018), maxW);

      // Secondary Sub-label (MULT, JACKPOT, 2x START, MEGA WIN)
      ctx.fillStyle = seg.isBust
        ? '#fca5a5'
        : (seg.isMega ? '#fde047' : (seg.textColor === '#ffffff' ? '#e9d5ff' : '#fcd34d'));
      const subFontSize = Math.round(renderSize * 0.020);
      ctx.font = `800 ${subFontSize}px Montserrat, sans-serif`;
      ctx.fillText(seg.sub, 0, Math.round(renderSize * 0.016), maxW);

      ctx.restore();
    }

    // 3. Heavy Metallic Bezel Rim on Rotor Disc
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, 2 * Math.PI);
    ctx.arc(0, 0, sliceOuterR, 0, 2 * Math.PI, true);
    ctx.closePath();
    const rimGrad = ctx.createRadialGradient(0, 0, sliceOuterR, 0, 0, outerR);
    rimGrad.addColorStop(0, '#5a3406');
    rimGrad.addColorStop(0.35, '#d4af37');
    rimGrad.addColorStop(0.65, '#fff2b2');
    rimGrad.addColorStop(0.85, '#aa771c');
    rimGrad.addColorStop(1, '#2c1401');
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Pinstripe borders on rotor rim
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, sliceOuterR, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Brass Ratchet Pegs (Machined Pins) at each slice divider
    const pegR = (sliceOuterR + outerR) / 2;
    for (let i = 0; i < numSegs; i++) {
      const pegAngle = i * segAngle;
      const px = Math.cos(pegAngle) * pegR;
      const py = Math.sin(pegAngle) * pegR;
      const pinRadius = Math.max(3.5, Math.round(renderSize * 0.010));

      // Peg Shadow base
      ctx.beginPath();
      ctx.arc(px, py, pinRadius * 1.35, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(10, 4, 1, 0.85)';
      ctx.fill();

      // Brass Peg dome with specular highlight
      ctx.beginPath();
      ctx.arc(px, py, pinRadius, 0, 2 * Math.PI);
      const pegGrad = ctx.createRadialGradient(px - pinRadius * 0.35, py - pinRadius * 0.35, pinRadius * 0.1, px, py, pinRadius);
      pegGrad.addColorStop(0, '#ffffff');
      pegGrad.addColorStop(0.35, '#ffe57f');
      pegGrad.addColorStop(0.75, '#b8860b');
      pegGrad.addColorStop(1, '#523402');
      ctx.fillStyle = pegGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, pinRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 235, 140, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 5. Center 3D Vegas Hub (Multi-tier Gold & Velvet Medallion)
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, 2 * Math.PI);
    const hubOuterGrad = ctx.createRadialGradient(0, 0, hubR * 0.2, 0, 0, hubR);
    hubOuterGrad.addColorStop(0, '#fff5c0');
    hubOuterGrad.addColorStop(0.35, '#d4af37');
    hubOuterGrad.addColorStop(0.75, '#6a3f03');
    hubOuterGrad.addColorStop(1, '#1f0d01');
    ctx.fillStyle = hubOuterGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = Math.max(2, Math.round(renderSize * 0.007));
    ctx.stroke();

    // Inner Velvet Medallion
    const innerHubR = Math.round(hubR * 0.76);
    ctx.beginPath();
    ctx.arc(0, 0, innerHubR, 0, 2 * Math.PI);
    const hubInnerGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, innerHubR);
    hubInnerGrad.addColorStop(0, '#2d0852');
    hubInnerGrad.addColorStop(0.65, '#140324');
    hubInnerGrad.addColorStop(1, '#080010');
    ctx.fillStyle = hubInnerGrad;
    ctx.fill();
    ctx.strokeStyle = '#dfb743';
    ctx.lineWidth = Math.max(1.5, Math.round(renderSize * 0.005));
    ctx.stroke();

    // Embossed IGT Brand Emblem
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(renderSize * 0.046)}px Cinzel, serif`;
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = Math.round(renderSize * 0.015);
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText('IGT', 0, 1);

    ctx.restore();
  }

  spin() {
    if (this.isSpinning) return;
    if (this.autoSpinTimer) clearTimeout(this.autoSpinTimer);
    this.isSpinning = true;

    if (this.modal) {
      this.modal.classList.add('is-spinning');
      this.modal.classList.remove('has-won');
    }

    if (this.spinBtn) {
      this.spinBtn.disabled = true;
      this.spinBtn.innerHTML = window.i18n ? window.i18n.t('wheelSpinning') : '⏳ TOČAK SE VRTI...';
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

    if (this.modal) {
      this.modal.classList.remove('is-spinning');
      if (winningSeg.type !== 'bust') {
        this.modal.classList.add('has-won');
      }
    }

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
      if (winningSeg.type === 'bust') {
        this.claimBtn.className = 'btn-wheel-claim btn-wheel-bust';
        this.claimBtn.textContent = window.i18n ? window.i18n.t('wheelCloseBtn') : '✕ ZATVORI';
      } else {
        this.claimBtn.className = 'btn-wheel-claim';
        this.claimBtn.textContent = window.i18n ? window.i18n.t('wheelClaimBtn') : '💰 PREUZMI DOBITAK & NASTAVI 💰';
      }
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
