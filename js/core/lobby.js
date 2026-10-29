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
    }

    const opts = [
      { id: 'classic', el: document.getElementById('egt-opt-classic') },
      { id: 'royal3x3', el: document.getElementById('egt-opt-royal') },
      { id: 'fullfocus', el: document.getElementById('egt-opt-fullfocus') },
      { id: 'mines', el: document.getElementById('egt-opt-mines') },
      { id: 'crash', el: document.getElementById('egt-opt-crash') },
      { id: 'plinko', el: document.getElementById('egt-opt-plinko') }
    ];

    opts.forEach(({ id, el }) => {
      if (el) {
        el.addEventListener('click', () => {
          if (window.slotAudio) window.slotAudio.playClick();
          this.switchGame(id);
          this.closeModal();
        });
      }
    });
  }

  openModal() {
    this.updateLobbyJackpots();
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

    if (this.activeGame && typeof this.activeGame.mount === 'function') {
      this.activeGame.mount();
    }

    this.updateSelectorUI(gameId);

    if (window.updateSlotScale) {
      window.updateSlotScale();
    }
  }

  updateSelectorUI(gameId) {
    if (this.currentLabel) {
      if (gameId === 'fullfocus') {
        this.currentLabel.textContent = window.i18n ? window.i18n.t('gameFullFocus') : '3x3 FULL FOCUS';
      } else if (gameId === 'royal3x3') {
        this.currentLabel.textContent = window.i18n ? window.i18n.t('gameRoyal3x3') : 'ROYAL 3x3';
      } else if (gameId === 'mines') {
        this.currentLabel.textContent = window.i18n ? window.i18n.t('gameMines') : 'GRAND MINES X';
      } else if (gameId === 'crash') {
        this.currentLabel.textContent = 'GRAND CRASH';
      } else if (gameId === 'plinko') {
        this.currentLabel.textContent = 'PLINKO DELUXE';
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
      plinko: document.getElementById('egt-opt-plinko')
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
