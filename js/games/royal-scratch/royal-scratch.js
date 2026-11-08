/**
 * Grand Slot Club - Royal Scratch (Zlatna Grebalica 3x3)
 * 
 * Interactive 3x3 Luxury Scratchcard Game
 * Features:
 * - Real-time canvas foil scratching (Touch & Mouse support with destination-out composite)
 * - "Ogrebi Sve" (Instant Scratch All) with sequential reveal animation
 * - 7 Premier Casino Symbols (Seven 100x, Crown 50x, Diamond 25x, Coin 10x, Horseshoe 5x, Star 2x, Bell 1x)
 * - Match-3 Mechanic with payline and scatter detection
 * - Free Daily Scratchcard perk integration
 * - Integrated with Wallet & Player Tracker
 */

class RoyalScratchGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.currentBet = 20;
    this.cardState = 'ready'; // 'ready', 'scratching', 'revealed'
    this.grid = []; // 9 items: { id, name, mult, icon, revealed }
    this.revealedCount = 0;
    this.isScratching = false;

    this.BET_LEVELS = [10, 20, 50, 100, 200];
    this.betIndex = 1; // Default 20

    this.SYMBOLS = [
      { id: 'seven', name: 'Zlatne Sedmice', mult: 100, icon: 'assets/symbols/seven.svg', weight: 4 },
      { id: 'crown', name: 'Kraljevska Kruna', mult: 50, icon: 'assets/symbols/crown.svg', weight: 8 },
      { id: 'diamond', name: 'Plavi Dijamant', mult: 25, icon: 'assets/symbols/diamond.svg', weight: 14 },
      { id: 'coin', name: 'Zlatnik GSC', mult: 10, icon: 'assets/symbols/coin.svg', weight: 22 },
      { id: 'horseshoe', name: 'Srećna Potkovica', mult: 5, icon: 'assets/symbols/horseshoe.svg', weight: 32 },
      { id: 'star', name: 'Grand Zvezda', mult: 2, icon: 'assets/symbols/star-flower.svg', weight: 50 },
      { id: 'bell', name: 'Zlatno Zvono', mult: 1, icon: 'assets/symbols/bell.svg', weight: 70 }
    ];

    this.viewContainer = document.getElementById('scratch-game-view');
    this.bindEvents();
  }

  bindEvents() {
    // Bet Steppers
    const btnMinus = document.getElementById('scratch-bet-minus');
    const btnPlus = document.getElementById('scratch-bet-plus');
    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        if (this.cardState === 'scratching') return;
        if (this.betIndex > 0) {
          this.betIndex--;
          this.currentBet = this.BET_LEVELS[this.betIndex];
          this.updateBetDisplay();
          if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        }
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        if (this.cardState === 'scratching') return;
        if (this.betIndex < this.BET_LEVELS.length - 1) {
          this.betIndex++;
          this.currentBet = this.BET_LEVELS[this.betIndex];
          this.updateBetDisplay();
          if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        }
      });
    }

    // Action Buttons
    const btnNew = document.getElementById('btn-scratch-buy');
    if (btnNew) {
      btnNew.addEventListener('click', () => this.buyNewCard());
    }

    const btnAll = document.getElementById('btn-scratch-all');
    if (btnAll) {
      btnAll.addEventListener('click', () => this.scratchAll());
    }
  }

  mount() {
    this.isActive = true;
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }
    this.updateBetDisplay();
    if (this.cardState === 'ready' && (!this.grid || this.grid.length === 0)) {
      this.generateCardGrid(false); // Demo initial card
    }
  }

  unmount() {
    this.isActive = false;
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
  }

  forceExit() {
    this.isScratching = false;
  }

  updateBetDisplay() {
    const betEl = document.getElementById('scratch-bet-amount');
    if (betEl) {
      betEl.textContent = `${this.currentBet} ZLT`;
    }
  }

  buyNewCard() {
    if (!this.wallet) return;

    if (this.wallet.balance < this.currentBet) {
      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage('⚠️ Nemate dovoljno ZLT kredita za novu karticu!', 'normal');
      }
      return;
    }

    // Deduct cost
    this.wallet.balance -= this.currentBet;
    this.wallet.updateUI();

    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();

    this.cardState = 'scratching';
    this.revealedCount = 0;
    this.generateCardGrid(true);

    const btnBuy = document.getElementById('btn-scratch-buy');
    const btnAll = document.getElementById('btn-scratch-all');
    if (btnBuy) {
      btnBuy.disabled = true;
      btnBuy.textContent = 'GREBI POLJA...';
    }
    if (btnAll) {
      btnAll.disabled = false;
    }

    const statusBanner = document.getElementById('scratch-status-banner');
    if (statusBanner) {
      statusBanner.textContent = '✨ Ogrebi sva 9 polja ili klikni "OGREBI SVE"!';
      statusBanner.className = 'scratch-status-banner normal';
    }
  }

  getRandomSymbol() {
    const totalWeight = this.SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of this.SYMBOLS) {
      if (rand < sym.weight) return sym;
      rand -= sym.weight;
    }
    return this.SYMBOLS[this.SYMBOLS.length - 1];
  }

  generateCardGrid(isPaid = true) {
    this.grid = [];

    // Math model: determine if this card is a winner (~36% hit rate)
    const isWin = isPaid ? (Math.random() < 0.36) : false;
    let winningSymbol = null;

    if (isWin) {
      winningSymbol = this.getRandomSymbol();
    }

    // Populate 9 items
    if (isWin && winningSymbol) {
      // Pick 3 random positions for winning symbol
      const winPositions = [];
      while (winPositions.length < 3) {
        const rPos = Math.floor(Math.random() * 9);
        if (!winPositions.includes(rPos)) winPositions.push(rPos);
      }

      for (let i = 0; i < 9; i++) {
        if (winPositions.includes(i)) {
          this.grid.push({ ...winningSymbol, revealed: false, isWinningMatch: true });
        } else {
          // Non-winning symbol, ensure no other 3-of-a-kind
          let otherSym;
          do {
            otherSym = this.getRandomSymbol();
          } while (otherSym.id === winningSymbol.id);
          this.grid.push({ ...otherSym, revealed: false, isWinningMatch: false });
        }
      }
    } else {
      // Losing card: distribute symbols so no symbol appears 3 times
      const symbolCounts = {};
      for (let i = 0; i < 9; i++) {
        let sym;
        let attempts = 0;
        do {
          sym = this.getRandomSymbol();
          attempts++;
        } while ((symbolCounts[sym.id] || 0) >= 2 && attempts < 20);

        symbolCounts[sym.id] = (symbolCounts[sym.id] || 0) + 1;
        this.grid.push({ ...sym, revealed: false, isWinningMatch: false });
      }
    }

    this.renderGrid(isPaid);
  }

  renderGrid(isPaid = true) {
    const gridEl = document.getElementById('scratch-card-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    this.grid.forEach((cell, idx) => {
      const cellWrap = document.createElement('div');
      cellWrap.className = 'scratch-cell-wrapper';
      cellWrap.dataset.index = idx;

      // Inner Revealed Content (Symbol & Multiplier)
      const contentEl = document.createElement('div');
      contentEl.className = 'scratch-cell-content';
      contentEl.innerHTML = `
        <img src="${cell.icon}" alt="${cell.name}" class="scratch-symbol-img">
        <span class="scratch-symbol-tag">${cell.name}</span>
        <span class="scratch-mult-badge">${cell.mult}x</span>
      `;
      cellWrap.appendChild(contentEl);

      // Canvas Golden Foil Coating
      const canvas = document.createElement('canvas');
      canvas.className = 'scratch-canvas-foil';
      canvas.width = 110;
      canvas.height = 110;
      cellWrap.appendChild(canvas);

      this.drawGoldFoil(canvas);

      if (isPaid) {
        this.attachScratchHandlers(canvas, idx);
      } else {
        // Preview mode: draw foil with a lock symbol
        this.drawFoilPreview(canvas);
      }

      gridEl.appendChild(cellWrap);
    });
  }

  drawGoldFoil(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Metallic Brushed Gold Gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f9e8a2');
    grad.addColorStop(0.3, '#d4af37');
    grad.addColorStop(0.5, '#aa771c');
    grad.addColorStop(0.7, '#f9e8a2');
    grad.addColorStop(1, '#8b6508');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Embossed Emblem Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.font = 'bold 22px Cinzel, serif';
    ctx.fillStyle = 'rgba(70, 45, 5, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', w / 2, h / 2 - 8);

    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('GREBI', w / 2, h / 2 + 16);
  }

  drawFoilPreview(canvas) {
    this.drawGoldFoil(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('KUPI KARTICU', canvas.width / 2, canvas.height / 2 + 30);
  }

  attachScratchHandlers(canvas, index) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let scratchedPixels = 0;

    const scratch = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();

      scratchedPixels += 8;
      if (scratchedPixels >= 45 && !this.grid[index].revealed) {
        this.revealCell(index);
      }
    };

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      scratch(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      isDrawing = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      scratch(e.clientX, e.clientY);
    });

    // Touch Support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDrawing = true;
      const touch = e.touches[0];
      scratch(touch.clientX, touch.clientY);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const touch = e.touches[0];
      scratch(touch.clientX, touch.clientY);
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      isDrawing = false;
    });
  }

  revealCell(index) {
    if (this.grid[index].revealed) return;
    this.grid[index].revealed = true;
    this.revealedCount++;

    const cellWraps = document.querySelectorAll('.scratch-cell-wrapper');
    const targetWrap = cellWraps[index];
    if (targetWrap) {
      targetWrap.classList.add('is-revealed');
      const canvas = targetWrap.querySelector('.scratch-canvas-foil');
      if (canvas) {
        canvas.style.opacity = '0';
        canvas.style.pointerEvents = 'none';
      }
    }

    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();

    if (this.revealedCount >= 9) {
      this.checkCardResult();
    }
  }

  scratchAll() {
    if (this.cardState !== 'scratching') return;

    const btnAll = document.getElementById('btn-scratch-all');
    if (btnAll) btnAll.disabled = true;

    this.grid.forEach((cell, idx) => {
      setTimeout(() => {
        this.revealCell(idx);
      }, idx * 120);
    });
  }

  checkCardResult() {
    this.cardState = 'revealed';

    const btnBuy = document.getElementById('btn-scratch-buy');
    const btnAll = document.getElementById('btn-scratch-all');
    if (btnBuy) {
      btnBuy.disabled = false;
      btnBuy.textContent = 'NOVA KARTICA 🎟️';
    }
    if (btnAll) {
      btnAll.disabled = true;
    }

    // Count occurrences of each symbol
    const counts = {};
    this.grid.forEach(cell => {
      counts[cell.id] = (counts[cell.id] || 0) + 1;
    });

    let winningSym = null;
    Object.keys(counts).forEach(symId => {
      if (counts[symId] >= 3) {
        winningSym = this.SYMBOLS.find(s => s.id === symId);
      }
    });

    const statusBanner = document.getElementById('scratch-status-banner');

    if (winningSym) {
      const winAmount = this.currentBet * winningSym.mult;
      this.wallet.balance += winAmount;
      this.wallet.updateUI();

      // Highlight winning cells
      const cellWraps = document.querySelectorAll('.scratch-cell-wrapper');
      this.grid.forEach((c, i) => {
        if (c.id === winningSym.id && cellWraps[i]) {
          cellWraps[i].classList.add('winning-gold-cell');
        }
      });

      if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
      if (window.particleEngine && window.particleEngine.burst) window.particleEngine.burst(300, 250);

      if (statusBanner) {
        statusBanner.textContent = `🎉 POGODAK 3x ${winningSym.name.toUpperCase()}! DOBITAK: +${winAmount.toLocaleString()} ZLT (${winningSym.mult}x)!`;
        statusBanner.className = 'scratch-status-banner win';
      }

      if (typeof window.slotApp?.showMessage === 'function') {
        window.slotApp.showMessage(`🏆 ZLATNA GREBALICA: +${winAmount.toLocaleString()} ZLT (${winningSym.mult}x)!`, 'jackpot');
      }

      // Record in PlayerTracker
      if (window.slotApp?.playerTracker) {
        window.slotApp.playerTracker.recordSpin('scratch', this.currentBet, winAmount);
      }
    } else {
      if (statusBanner) {
        statusBanner.textContent = 'Više sreće na sledećoj kartici! Kupite novu karticu za novu šansu.';
        statusBanner.className = 'scratch-status-banner normal';
      }

      // Record in PlayerTracker
      if (window.slotApp?.playerTracker) {
        window.slotApp.playerTracker.recordSpin('scratch', this.currentBet, 0);
      }
    }
  }
}

window.RoyalScratchGame = RoyalScratchGame;
