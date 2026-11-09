/**
 * Core Platform - EGT Lobby & Game Switcher
 * Manages active game lifecycle, modal game picker, and scale adaptations.
 */
class CasinoLobby {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;
    this.games = {};
    this.activeGameId = null;
    this.activeGame = null;

    this.selectBtn = document.getElementById('egt-game-select-btn');
    this.modal = document.getElementById('egt-games-modal');
    this.closeBtn = document.getElementById('close-egt-games');
    this.currentLabel = document.getElementById('egt-current-game-label');

    this.isCashHidden = localStorage.getItem('gsc_lobby_cash_hidden') === '1';
    this.activeCategory = 'all';

    this.initUI();
  }

  registerGame(id, gameInstance) {
    this.games[id] = gameInstance;
  }

  initUI() {
    if (this.selectBtn && this.modal) {
      this.selectBtn.addEventListener('click', () => {
        if (window.slotAudio) window.slotAudio.playClick();
        this.openModal();
      });
    }

    const headerLobbyBtn = document.getElementById('btn-header-lobby');
    if (headerLobbyBtn) {
      headerLobbyBtn.addEventListener('click', () => {
        if (window.slotAudio) window.slotAudio.playClick();
        this.openModal();
      });
    }

    const menuLobbyBtn = document.getElementById('menu-opt-lobby');
    if (menuLobbyBtn) {
      menuLobbyBtn.addEventListener('click', () => {
        if (window.igtApp && typeof window.igtApp.closeCasinoMenu === 'function') {
          window.igtApp.closeCasinoMenu();
        }
        if (window.slotAudio) window.slotAudio.playClick();
        setTimeout(() => this.openModal(), 120);
      });
    }

    if (this.closeBtn && this.modal) {
      this.closeBtn.addEventListener('click', () => {
        if (window.slotAudio) window.slotAudio.playClick();
        this.closeModal();
      });
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });

      // Legacy Category filter tabs (preserved for compatibility)
      const catTabs = this.modal.querySelectorAll('.lobby-cat-tab');
      catTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          if (window.slotAudio) window.slotAudio.playClick();
          catTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const cat = tab.getAttribute('data-category') || 'all';
          this.activeCategory = cat;
          this.filterCategory(cat);
        });
      });

      // Authentic EGT Cabinet Task Bar category tabs
      const taskbarTabs = this.modal.querySelectorAll('.lobby-taskbar-tab');
      taskbarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          if (window.slotAudio) window.slotAudio.playClick();
          taskbarTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const cat = tab.getAttribute('data-category') || 'all';
          this.activeCategory = cat;
          this.filterCategory(cat);
        });
      });

      // Task Bar CASH Privacy toggle
      const cashPrivacyBtn = this.modal.querySelector('#lobby-cash-privacy-btn');
      if (cashPrivacyBtn) {
        cashPrivacyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.slotAudio) window.slotAudio.playClick();
          this.isCashHidden = !this.isCashHidden;
          try {
            localStorage.setItem('gsc_lobby_cash_hidden', this.isCashHidden ? '1' : '0');
          } catch (err) {}
          this.updateLobbyCash();
        });
      }

      // Task Bar Language toggle
      const langToggleBtn = this.modal.querySelector('#lobby-lang-toggle');
      if (langToggleBtn) {
        langToggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.slotAudio) window.slotAudio.playClick();
          if (window.i18n && typeof window.i18n.toggleLanguage === 'function') {
            window.i18n.toggleLanguage();
          } else if (typeof window.toggleLanguage === 'function') {
            window.toggleLanguage();
          }
          this.updateLanguageUI();
        });
      }

      // Task Bar Sound toggle
      const soundToggleBtn = this.modal.querySelector('#lobby-sound-toggle');
      if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.slotAudio) {
            if (typeof window.slotAudio.toggleMute === 'function') {
              window.slotAudio.toggleMute();
            } else if (typeof window.slotAudio.toggleSound === 'function') {
              window.slotAudio.toggleSound();
            }
          }
          this.updateSoundUI();
        });
      }

      // Interactive denomination badges on game cards
      const denomPills = this.modal.querySelectorAll('.egt-denom-strip .denom-pill');
      denomPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.slotAudio) window.slotAudio.playClick();
          const strip = pill.closest('.egt-denom-strip');
          if (strip) {
            strip.querySelectorAll('.denom-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
          }
        });
      });
    }

    const opts = [
      { id: 'classic', el: document.getElementById('egt-opt-classic') },
      { id: 'royal3x3', el: document.getElementById('egt-opt-royal') },
      { id: 'fullfocus', el: document.getElementById('egt-opt-fullfocus') },
      { id: 'mines', el: document.getElementById('egt-opt-mines') },
      { id: 'crash', el: document.getElementById('egt-opt-crash') },
      { id: 'plinko', el: document.getElementById('egt-opt-plinko') },
      { id: 'blackjack', el: document.getElementById('egt-opt-blackjack') },
      { id: 'videopoker', el: document.getElementById('egt-opt-videopoker') },
      { id: 'holdem', el: document.getElementById('egt-opt-holdem') }
    ];

    const boundCards = new Set();
    opts.forEach(({ id, el }) => {
      if (el) {
        boundCards.add(el);
        el.addEventListener('click', () => {
          if (window.slotAudio) window.slotAudio.playClick();
          this.switchGame(id);
          this.closeModal();
        });
      }
    });

    // Dynamic binding for all current and future lobby game cards
    if (this.modal) {
      const allCards = this.modal.querySelectorAll('.egt-game-card');
      allCards.forEach(card => {
        if (!boundCards.has(card)) {
          const gameId = card.getAttribute('data-game') || (card.id ? card.id.replace('egt-opt-', '') : null);
          if (gameId) {
            boundCards.add(card);
            card.addEventListener('click', () => {
              if (window.slotAudio) window.slotAudio.playClick();
              this.switchGame(gameId);
              this.closeModal();
            });
          }
        }
      });
    }
  }

  filterCategory(category) {
    if (!this.modal) return;
    const cards = this.modal.querySelectorAll('.egt-game-card');
    cards.forEach(card => {
      if (card.getAttribute('data-hidden') === 'true' || card.id === 'egt-opt-superhot') {
        card.style.display = 'none';
        return;
      }
      const cardCat = card.getAttribute('data-category') || '';
      const cardTags = (card.getAttribute('data-tags') || '').split(',').map(s => s.trim().toLowerCase());
      if (category === 'all' || cardCat === category || cardTags.includes(category)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  updateLobbyCash() {
    if (!this.modal) return;
    const cashValEl = this.modal.querySelector('#lobby-cash-val');
    const cashSubEl = this.modal.querySelector('#lobby-cash-sub');
    const eyeIconEl = this.modal.querySelector('#lobby-cash-eye-icon');

    const isHidden = this.isCashHidden;
    if (eyeIconEl) {
      eyeIconEl.innerHTML = isHidden 
        ? `<svg class="meta-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg class="meta-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }

    if (isHidden) {
      if (cashValEl) cashValEl.textContent = '••••••';
      if (cashSubEl) cashSubEl.textContent = '••••••';
      return;
    }

    let zltAmount = 0;
    let creditsAmount = 0;
    if (this.wallet) {
      zltAmount = typeof this.wallet.rsdBalance === 'number' ? this.wallet.rsdBalance : 0;
      creditsAmount = typeof this.wallet.balance === 'number' ? this.wallet.balance : Math.floor(zltAmount);
    }

    if (cashValEl) {
      cashValEl.textContent = `${zltAmount.toLocaleString()} ZLT`;
    }
    if (cashSubEl) {
      cashSubEl.textContent = `${creditsAmount.toLocaleString()} KR`;
    }
  }

  updateLanguageUI() {
    if (!this.modal) return;
    const langCodeEl = this.modal.querySelector('#lobby-lang-code');
    if (langCodeEl) {
      const curLang = (window.i18n && window.i18n.currentLang ? window.i18n.currentLang : 'sr').toUpperCase();
      langCodeEl.textContent = curLang;
    }
  }

  updateSoundUI() {
    if (!this.modal) return;
    const soundIconEl = this.modal.querySelector('#lobby-sound-icon');
    if (soundIconEl) {
      const isMuted = window.slotAudio ? !!window.slotAudio.isMuted : false;
      soundIconEl.innerHTML = isMuted
        ? `<svg class="meta-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`
        : `<svg class="meta-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    }
  }

  openModal() {
    if (window.slotApp && window.slotApp.playerTracker && !window.slotApp.playerTracker.profile.isLoggedIn) {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.add('active');
      if (typeof window.switchAuthTab === 'function') window.switchAuthTab('login');
      return;
    }
    if (window.slotApp && (window.slotApp.currentGrandMode === 'vault' || window.slotApp.currentGrandMode === 'royale')) {
      if (window.slotNotifications && typeof window.slotNotifications.show === 'function') {
        window.slotNotifications.show('🔒 U ovom režimu je zaključan isključivo Royal 3x3 slot za sve borbe!', 'info');
      }
      return;
    }
    this.updateLobbyJackpots();
    this.updateLobbyCash();
    this.updateLanguageUI();
    this.updateSoundUI();
    if (this.modal) {
      this.modal.classList.remove('is-hidden');
      this.modal.classList.add('active');
    }
  }

  updateLobbyJackpots() {
    if (!this.jackpots) return;
    this.jackpots.render();
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.add('is-hidden');
      this.modal.classList.remove('active');
    }
  }

  switchGame(gameId) {
    if (this.activeGameId === gameId) return;

    // Strict restriction: in Vault and Royale only royal3x3 slot is permitted!
    if (window.slotApp && (window.slotApp.currentGrandMode === 'vault' || window.slotApp.currentGrandMode === 'royale')) {
      if (gameId !== 'royal3x3') {
        if (window.slotNotifications && typeof window.slotNotifications.show === 'function') {
          window.slotNotifications.show('🔒 U ovom režimu je zaključan isključivo Royal 3x3 slot!', 'warning');
        }
        return;
      }
    }

    if (gameId === 'vault' || gameId === 'royale') {
      if (window.slotApp && typeof window.slotApp.switchGrandMode === 'function') {
        window.slotApp.switchGrandMode(gameId);
      }
      this.closeModal();
      return;
    }

    // If switching to a standalone non-slot game while in Trezor or Battle Royale, automatically return to Casino Salon!
    if (['crash', 'plinko', 'blackjack', 'mines', 'videopoker', 'holdem', 'scratch'].includes(gameId)) {
      const container = document.querySelector('.game-container');
      if (container && (container.classList.contains('in-vault-mode') || container.classList.contains('in-royale-mode'))) {
        const tabs = document.querySelectorAll('.hub-mode-tab');
        tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === 'casino'));
        if (window.slotApp && typeof window.slotApp.switchGrandMode === 'function') {
          window.slotApp.savedCasinoGameId = null;
          window.slotApp.switchGrandMode('casino');
        }
      }
    }

    if (this.activeGame && this.activeGame.isSpinning) {
      if (typeof this.activeGame.forceExit === 'function') {
        this.activeGame.forceExit();
      } else {
        return;
      }
    }

    if (this.activeGame && typeof this.activeGame.unmount === 'function') {
      this.activeGame.unmount();
    }

    this.activeGameId = gameId;
    this.activeGame = this.games[gameId];

    if (window.slotAudio && typeof window.slotAudio.setBgmMode === 'function') {
      if (gameId === 'crash') {
        window.slotAudio.setBgmMode('crash');
      } else {
        const targetMode = (window.slotApp && window.slotApp.currentGrandMode) ? window.slotApp.currentGrandMode : 'casino';
        window.slotAudio.setBgmMode(targetMode);
      }
    }

    if (this.activeGame && typeof this.activeGame.mount === 'function') {
      this.activeGame.mount();
      setTimeout(() => {
        if (this.activeGame && typeof this.activeGame.resizeCanvas === 'function') {
          this.activeGame.resizeCanvas();
        }
        if (this.activeGame && typeof this.activeGame.buildPyramid === 'function') {
          this.activeGame.buildPyramid();
        }
      }, 50);
    }

    this.updateSelectorUI(gameId);

    if (window.updateSlotScale) {
      window.updateSlotScale();
    }
  }

  updateSelectorUI(gameId) {
    if (this.currentLabel) {
      if (window.slotApp && (window.slotApp.currentGrandMode === 'vault' || window.slotApp.currentGrandMode === 'royale')) {
        this.currentLabel.textContent = '🔒 ROYAL 3x3';
      } else if (gameId === 'fullfocus') {
        this.currentLabel.textContent = window.i18n ? window.i18n.t('gameFullFocus') : '3x3 FULL FOCUS';
      } else if (gameId === 'royal3x3') {
        this.currentLabel.textContent = window.i18n ? window.i18n.t('gameRoyal3x3') : 'ROYAL 3x3';
      } else if (gameId === 'mines') {
        this.currentLabel.textContent = window.i18n ? window.i18n.t('gameMines') : 'GRAND MINES X';
      } else if (gameId === 'crash') {
        this.currentLabel.textContent = 'GRAND CRASH';
      } else if (gameId === 'plinko') {
        this.currentLabel.textContent = 'PLINKO DELUXE';
      } else if (gameId === 'blackjack') {
        this.currentLabel.textContent = 'ROYAL BLACKJACK';
      } else if (gameId === 'videopoker') {
        this.currentLabel.textContent = 'ROYAL VIDEO POKER';
      } else if (gameId === 'holdem') {
        this.currentLabel.textContent = 'CASINO HOLD\'EM';
      } else if (gameId === 'scratch') {
        this.currentLabel.textContent = 'ZLATNA GREBALICA';
      } else if (gameId === 'superhot') {
        this.currentLabel.textContent = 'GRAND SUPER HOT';
      } else {
        this.currentLabel.textContent = window.i18n ? window.i18n.t('gameClassic') : '1-LINE CLASSIC';
      }
    }

    const modalBoxes = {
      classic: document.getElementById('egt-opt-classic'),
      royal3x3: document.getElementById('egt-opt-royal'),
      fullfocus: document.getElementById('egt-opt-fullfocus'),
      mines: document.getElementById('egt-opt-mines'),
      crash: document.getElementById('egt-opt-crash'),
      plinko: document.getElementById('egt-opt-plinko'),
      blackjack: document.getElementById('egt-opt-blackjack'),
      videopoker: document.getElementById('egt-opt-videopoker'),
      holdem: document.getElementById('egt-opt-holdem'),
      scratch: document.getElementById('egt-opt-scratch'),
      superhot: document.getElementById('egt-opt-superhot')
    };

    const activeText = window.i18n ? window.i18n.t('egtActiveTag') : 'AKTIVNA IGRA';
    const selectText = window.i18n ? window.i18n.t('egtSelectTag') : 'IGRAJ SADA';

    Object.keys(modalBoxes).forEach(id => {
      const box = modalBoxes[id];
      if (box) {
        const isActive = (id === gameId);
        box.classList.toggle('active', isActive);
        const tag = box.querySelector('.egt-badge-status') || box.querySelector('.egt-box-select-tag');
        if (tag) tag.textContent = isActive ? activeText : selectText;
      }
    });
  }

  updateCurrentLabel() {
    if (this.activeGameId) {
      this.updateSelectorUI(this.activeGameId);
    }
  }
}

window.CasinoLobby = CasinoLobby;
