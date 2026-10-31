/**
 * Grandslot - Admin Remote Bridge
 * Connects the slot game silently in the background to the standalone Operator Admin Dashboard (admin.html)
 * via BroadcastChannel, localStorage, and WebRTC (PeerJS) cloud remote sync.
 * 
 * NOTE: Contains ZERO in-slot player UI, zero PIN pads, and zero operator shortcuts.
 * The player-facing slot machine remains 100% clean and authentic.
 */
class AdminBridge {
  constructor(app) {
    this.app = app;
    this.channelName = 'grandslot_admin_channel';
    this.channel = null;
    this.remoteConnections = [];
    this.peer = null;
    this.roomId = this.getOrCreateRoomId();

    this.initChannel();
    this.initWebRTC();
    this.attachTelemetryHooks();
  }

  getOrCreateRoomId() {
    let roomId = localStorage.getItem('grandslot_slot_room_id');
    if (!roomId) {
      roomId = 'GSC-' + Math.floor(1000 + Math.random() * 9000);
      try { localStorage.setItem('grandslot_slot_room_id', roomId); } catch (e) {}
    }
    return roomId;
  }

  initWebRTC() {
    if (typeof Peer === 'undefined') {
      return;
    }

    const peerId = 'grandslot-slot-' + this.roomId.toLowerCase();
    try {
      this.peer = new Peer(peerId, { debug: 0 });

      this.peer.on('connection', (conn) => {
        this.remoteConnections = this.remoteConnections || [];
        this.remoteConnections.push(conn);

        conn.on('data', (data) => {
          this.handleMessage(data);
        });

        conn.on('close', () => {
          this.remoteConnections = this.remoteConnections.filter(c => c !== conn);
        });

        // Send instant telemetry state to remote operator device
        setTimeout(() => {
          try {
            conn.send({ action: 'STATE_UPDATE', state: this.getTelemetryState() });
          } catch (e) {}
        }, 150);
      });

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          this.roomId = 'GSC-' + Math.floor(1000 + Math.random() * 9000);
          try { localStorage.setItem('grandslot_slot_room_id', this.roomId); } catch (e) {}
        }
      });
    } catch (e) {
      console.warn('Silent WebRTC init note:', e);
    }
  }

  initChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => this.handleMessage(event.data);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // Storage event fallback (cross-tab sync with admin.html)
    window.addEventListener('storage', (e) => {
      if (e.key === 'grandslot_admin_command' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          this.handleMessage(data);
        } catch (err) {}
      }
    });

    // Announce to any active admin dashboard that the slot is online
    setTimeout(() => {
      this.postMessage({ action: 'SLOT_ONLINE', timestamp: Date.now() });
      this.broadcastState();
    }, 300);
  }

  postMessage(data) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }

    // Forward to remote WebRTC connections (operator mobile phone / tablet)
    if (this.remoteConnections && this.remoteConnections.length > 0) {
      this.remoteConnections.forEach(conn => {
        try {
          if (conn.open) conn.send(data);
        } catch (err) {}
      });
    }

    // Also persist telemetry to localStorage for initial dashboard load
    if (data.action === 'STATE_UPDATE' && data.state) {
      try {
        localStorage.setItem('grandslot_live_telemetry', JSON.stringify(data.state));
      } catch (e) {}
    }
  }

  handleMessage(data) {
    if (!data || !data.action) return;

    switch (data.action) {
      case 'REQUEST_STATE':
      case 'ADMIN_ONLINE':
        this.broadcastState();
        break;

      case 'SET_PRESET':
        if (this.app.mathManager && data.presetId) {
          this.app.mathManager.setPreset(data.presetId);
          this.broadcastState();
        }
        break;

      case 'SET_WEIGHT':
        if (this.app.mathManager && data.symbolId && data.value) {
          this.app.mathManager.setCustomWeight(data.symbolId, data.value);
          this.broadcastState();
        }
        break;

      case 'TRIGGER_JACKPOT':
        if (this.app.jackpots && data.tier) {
          this.app.jackpots.awardJackpot(data.tier, (tier, pot) => {
            const isEn = window.i18n && window.i18n.currentLang === 'en';
            const title = isEn 
              ? `🏆 ${tier.toUpperCase()} JACKPOT +${pot.toLocaleString()} RSD!`
              : `🏆 ${tier.toUpperCase()} DŽEKPOT +${pot.toLocaleString()} RSD!`;
            this.app.showMessage(title, 'jackpot');
          });
          this.broadcastState();
        }
        break;

      case 'TRIGGER_BONUS':
        if (data.bonusType === 'wheel' && this.app.wheelBonus) {
          this.app.wheelBonus.openModal(true);
        } else if (data.bonusType === 'mines' && this.app.meters) {
          this.app.meters.minesProgress = 100;
          this.app.meters.activateMinesBonus(this.app.wallet.bet);
        } else if (data.bonusType === 'cards' && this.app.meters) {
          this.app.meters.cardsProgress = 100;
          this.app.meters.activateCardsBonus(this.app.wallet.bet);
        } else if (data.bonusType === 'doublerush' && this.app.meters) {
          this.app.meters.cardsProgress = 100;
          this.app.meters.activateCardsBonus(this.app.wallet.bet);
          this.app.meters.minesProgress = 100;
          this.app.meters.activateMinesBonus(this.app.wallet.bet);
          this.app.showMessage('🔥 DOUBLE BONUS RUSH AKTIVIRAN!', 'frenzy');
        }
        this.broadcastState();
        break;

      case 'WALLET_ADD':
        if (this.app.wallet && typeof data.amount === 'number') {
          this.app.wallet.addFictionalRsd(data.amount);
          this.app.showMessage(`💰 +${data.amount.toLocaleString()} RSD!`, 'win');
          this.broadcastState();
        }
        break;

      case 'WALLET_SET':
        if (this.app.wallet && typeof data.amount === 'number') {
          this.app.wallet.rsdBalance = data.amount;
          this.app.wallet.saveState();
          this.app.wallet.updateUI();
          this.broadcastState();
        }
        break;

      case 'SWITCH_GAME':
        if (this.app.lobby && data.gameId) {
          this.app.lobby.selectGame(data.gameId);
          this.broadcastState();
        }
        break;

      case 'SET_ACTIVE_PROMO':
        if (this.app) {
          if (this.app.setActivePromotion) {
            this.app.setActivePromotion(data.promo);
          } else {
            localStorage.setItem('gsc_active_promo', JSON.stringify(data.promo));
          }
        }
        break;

      case 'TRIGGER_PROMO_POPUP':
        if (this.app && data.promo) {
          const promo = data.promo;
          const myPlayerId = this.app.playerTracker ? this.app.playerTracker.profile.id : null;
          if (promo.targetType === 'single' && promo.targetPlayerId && promo.targetPlayerId !== myPlayerId) {
            break;
          }
          if (promo.targetType === 'vip' && this.app.playerTracker?.profile?.vipTier !== 'VIP') {
            break;
          }
          if (this.app.openPromotionModal) {
            this.app.openPromotionModal(promo);
          } else if (this.app.openVoucherModal) {
            this.app.openVoucherModal({
              campaignId: promo.id,
              title: promo.title,
              description: promo.body,
              rewardValue: promo.promoValue,
              imageUrl: promo.imageUrl,
              location: promo.location,
              promoAction: promo.promoAction,
              expiresAt: promo.expiresAt
            });
          }
        }
        break;

      case 'TRIGGER_PUSH':
        if (this.app.notifications) {
          if (data.notifType === 'jackpot') this.app.notifications.triggerJackpotAlert('gold');
          else if (data.notifType === 'tournament') this.app.notifications.triggerTournamentAlert();
          else if (data.notifType === 'bonus') this.app.notifications.triggerBonusAlert();
          else if (data.title && data.body) {
            const myPlayerId = this.app.playerTracker ? this.app.playerTracker.profile.id : null;
            if (data.targetType === 'single' && data.targetPlayerId && data.targetPlayerId !== myPlayerId) {
              break;
            }
            if (data.targetType === 'vip' && this.app.playerTracker?.profile?.vipTier !== 'VIP') {
              break;
            }

            this.app.notifications.sendPushNotification(data.title, data.body, {
              url: `./?promo_action=${data.promoAction || 'none'}&promo_val=${data.promoValue || 0}&promo_title=${encodeURIComponent(data.title || '')}&promo_body=${encodeURIComponent(data.body || '')}&promo_img=${encodeURIComponent(data.imageUrl || '')}&promo_loc=${encodeURIComponent(data.location || '')}`
            });
            this.app.showMessage(`🔔 ${data.title}`, 'win');

            if (data.promoAction && data.promoAction !== 'none' && this.app.claimPromoBonus) {
              this.app.claimPromoBonus({
                promoAction: data.promoAction,
                promoValue: data.promoValue,
                title: data.title,
                body: data.body,
                imageUrl: data.imageUrl,
                location: data.location
              });
            }
          }
        }
        break;

      case 'RESET_SESSION':
        localStorage.clear();
        setTimeout(() => window.location.reload(), 400);
        break;
    }
  }

  getTelemetryState() {
    try {
      if (!this.app) return {};

      const jp = this.app.jackpots;
      let silverVal = 80;
      let goldVal = 250;
      let diamondVal = 600;

      if (jp) {
        if (typeof jp.jackpotSilver === 'number') silverVal = jp.jackpotSilver;
        else if (jp.pots && jp.pots.silver && typeof jp.pots.silver.current === 'number') silverVal = jp.pots.silver.current;

        if (typeof jp.jackpotGold === 'number') goldVal = jp.jackpotGold;
        else if (jp.pots && jp.pots.gold && typeof jp.pots.gold.current === 'number') goldVal = jp.pots.gold.current;

        if (typeof jp.jackpotDiamond === 'number') diamondVal = jp.jackpotDiamond;
        else if (jp.pots && jp.pots.diamond && typeof jp.pots.diamond.current === 'number') diamondVal = jp.pots.diamond.current;
      }

      return {
        timestamp: Date.now(),
        roomId: this.roomId,
        balance: this.app.wallet ? this.app.wallet.rsdBalance : 0,
        credits: this.app.wallet ? this.app.wallet.credits : 0,
        bet: this.app.wallet ? this.app.wallet.bet : 20,
        activeDenom: this.app.wallet ? this.app.wallet.activeDenom : 1,
        activeGame: this.app.lobby ? this.app.lobby.activeGameId : 'royal3x3',
        activePreset: this.app.mathManager ? this.app.mathManager.activePreset : 'standard',
        customWeights: (this.app.mathManager && typeof this.app.mathManager.getActiveWeights === 'function') 
          ? this.app.mathManager.getActiveWeights() 
          : {},
        jackpots: {
          silver: Math.floor(silverVal),
          gold: Math.floor(goldVal),
          diamond: Math.floor(diamondVal)
        }
      };
    } catch (err) {
      console.warn('[AdminBridge] getTelemetryState fail-safe triggered:', err);
      return {
        timestamp: Date.now(),
        roomId: this.roomId,
        balance: 0,
        credits: 0,
        bet: 20,
        activeDenom: 1,
        activeGame: 'royal3x3',
        activePreset: 'standard',
        customWeights: {},
        jackpots: { silver: 80, gold: 250, diamond: 600 }
      };
    }
  }

  broadcastState() {
    try {
      const state = this.getTelemetryState();
      this.postMessage({ action: 'STATE_UPDATE', state });
    } catch (err) {
      console.warn('[AdminBridge] broadcastState ignored error:', err);
    }
  }

  attachTelemetryHooks() {
    window.addEventListener('grandslot:spinend', () => this.broadcastState());
    window.addEventListener('grandslot:walletupdate', () => this.broadcastState());

    setInterval(() => {
      this.broadcastState();
    }, 2500);
  }
}

window.AdminBridge = AdminBridge;
