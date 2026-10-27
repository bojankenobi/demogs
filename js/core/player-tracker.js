/**
 * IGT - Player Tracker & Authentication Engine
 * Manages real player profile, credentials, Neon DB sessions, and comprehensive game analytics.
 */
class PlayerTracker {
  constructor() {
    this.storageKey = 'igt_player_profile';
    this.tokenKey = 'gsc_auth_token';
    this.sessionStartTime = Date.now();
    this.profile = this.loadProfile();

    // Auto-sync with CRM backend after initial boot
    setTimeout(() => {
      if (this.profile.isLoggedIn) {
        this.syncWithBackend();
      }
    }, 1800);
  }

  getAuthToken() {
    try {
      return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey) || null;
    } catch (e) {
      return null;
    }
  }

  setAuthToken(token, remember = true) {
    try {
      if (remember) {
        localStorage.setItem(this.tokenKey, token);
        sessionStorage.removeItem(this.tokenKey);
      } else {
        sessionStorage.setItem(this.tokenKey, token);
        localStorage.removeItem(this.tokenKey);
      }
    } catch (e) {}
  }

  clearAuthToken() {
    try {
      localStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.tokenKey);
    } catch (e) {}
  }

  generatePlayerId() {
    const savedId = localStorage.getItem('gsc_player_id');
    if (savedId) return savedId;
    const newId = 'gsc_usr_' + Math.floor(1000 + Math.random() * 9000);
    try {
      localStorage.setItem('gsc_player_id', newId);
    } catch (e) {}
    return newId;
  }

  loadProfile() {
    const persistentId = this.generatePlayerId();
    const defaultProfile = {
      id: persistentId,
      username: '',
      phone: '',
      vipTier: 'STANDARD',
      balance_rsd: 1000.00,
      pin: '',
      isVerified18: false,
      isLoggedIn: false,
      rememberMe: true,
      registeredAt: Date.now(),
      stats: {
        totalSpins: 0,
        spinsByGame: {
          classic: 0,
          royal3x3: 0,
          fullfocus: 0,
          mines: 0
        },
        totalBet: 0,
        totalWin: 0,
        biggestWin: 0,
        bonusesTriggered: {
          freeSpins: 0,
          holdAndWin: 0,
          miniMines: 0,
          gambleDouble: 0
        },
        jackpotsWon: {
          silver: 0,
          gold: 0,
          diamond: 0
        },
        totalPlayTimeSeconds: 0
      }
    };

    try {
      const saved = localStorage.getItem(this.storageKey) || localStorage.getItem('maxbet_player_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultProfile,
          ...parsed,
          stats: {
            ...defaultProfile.stats,
            ...(parsed.stats || {}),
            spinsByGame: {
              ...defaultProfile.stats.spinsByGame,
              ...((parsed.stats && parsed.stats.spinsByGame) || {})
            },
            bonusesTriggered: {
              ...defaultProfile.stats.bonusesTriggered,
              ...((parsed.stats && parsed.stats.bonusesTriggered) || {})
            },
            jackpotsWon: {
              ...defaultProfile.stats.jackpotsWon,
              ...((parsed.stats && parsed.stats.jackpotsWon) || {})
            }
          }
        };
      }
    } catch (e) {
      console.error('Failed to load player profile:', e);
    }

    return defaultProfile;
  }

  saveProfile() {
    try {
      if (this.profile.rememberMe || this.profile.isLoggedIn) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch (e) {
      console.error('Failed to save player profile:', e);
    }
  }

  async checkSession() {
    const token = this.getAuthToken();
    if (!token) {
      this.profile.isLoggedIn = false;
      return { success: false, reason: 'no_token' };
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success && data.player) {
        this.profile.id = data.player.id;
        this.profile.username = data.player.username || data.player.nickname;
        this.profile.phone = data.player.phone || null;
        this.profile.vipTier = data.player.vip_tier || 'STANDARD';
        this.profile.balance_rsd = Number(data.player.balance_rsd != null ? data.player.balance_rsd : 1000.00);
        this.profile.isLoggedIn = true;
        this.profile.isVerified18 = true;
        this.saveProfile();
        return { success: true, player: data.player };
      } else {
        // Invalid or expired token
        this.clearAuthToken();
        this.profile.isLoggedIn = false;
        this.saveProfile();
        return { success: false, error: data.error || 'Sesija je istekla.' };
      }
    } catch (e) {
      console.warn('Session check network fallback:', e);
      return { success: this.profile.isLoggedIn, player: this.profile };
    }
  }

  async register(username, password, phone = null, nickname = null) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, phone, nickname })
      });

      // Graceful fallback if static dev server returns 405 (Method Not Allowed) or 404
      if (res.status === 405 || res.status === 404) {
        console.warn(`[PlayerTracker] /api/auth/register returned ${res.status} (static dev server). Activating local VIP profile.`);
        const localId = 'gsc_usr_' + Math.random().toString(36).substring(2, 9);
        const localToken = 'gsc_tok_local_' + Date.now();
        const localPlayer = {
          id: localId,
          username: username,
          nickname: nickname || username,
          phone: phone,
          balance_rsd: 1000.00,
          vip_tier: 'STANDARD'
        };

        this.setAuthToken(localToken, true);
        this.profile.id = localPlayer.id;
        this.profile.username = localPlayer.username;
        this.profile.phone = localPlayer.phone;
        this.profile.vipTier = localPlayer.vip_tier;
        this.profile.balance_rsd = 1000.00;
        this.profile.isLoggedIn = true;
        this.profile.isVerified18 = true;
        this.profile.rememberMe = true;
        this.sessionStartTime = Date.now();
        this.saveProfile();

        try { localStorage.setItem('gsc_player_id', localPlayer.id); } catch (e) {}

        return {
          success: true,
          player: localPlayer,
          token: localToken,
          message: 'Dobrodošli u Grand Slot Club! Vaš nalog je otvoren uz 1.000 Zlatnika bonusa dobrodošlice.'
        };
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Non-JSON response from /api/auth/register:', jsonErr);
        return { success: false, error: `Greška servera (${res.status}). Pokušajte ponovo.` };
      }

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Greška pri registraciji.' };
      }

      this.setAuthToken(data.token, true);
      this.profile.id = data.player.id;
      this.profile.username = data.player.username || username;
      this.profile.phone = data.player.phone || phone;
      this.profile.vipTier = data.player.vip_tier || 'STANDARD';
      this.profile.balance_rsd = Number(data.player.balance_rsd != null ? data.player.balance_rsd : 1000.00);
      this.profile.isLoggedIn = true;
      this.profile.isVerified18 = true;
      this.profile.rememberMe = true;
      this.sessionStartTime = Date.now();
      this.saveProfile();

      try {
        localStorage.setItem('gsc_player_id', data.player.id);
      } catch (e) {}

      return { success: true, player: data.player, token: data.token, message: data.message };
    } catch (e) {
      console.error('Registration fetch network error:', e);
      return { success: false, error: 'Mrežna greška pri povezivanju sa serverom. Proverite internet vezu.' };
    }
  }

  async login(username, password, rememberMe = true) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      // Graceful fallback if static dev server returns 405 (Method Not Allowed) or 404
      if (res.status === 405 || res.status === 404) {
        console.warn(`[PlayerTracker] /api/auth/login returned ${res.status} (static dev server). Activating local VIP profile.`);
        const localId = 'gsc_usr_local_' + Math.random().toString(36).substring(2, 7);
        const localToken = 'gsc_tok_local_' + Date.now();
        const localPlayer = {
          id: this.profile.id || localId,
          username: username,
          nickname: username,
          phone: this.profile.phone || null,
          balance_rsd: this.profile.balance_rsd || 1000.00,
          vip_tier: this.profile.vipTier || 'STANDARD'
        };

        this.setAuthToken(localToken, rememberMe);
        this.profile.id = localPlayer.id;
        this.profile.username = localPlayer.username;
        this.profile.isLoggedIn = true;
        this.profile.isVerified18 = true;
        this.profile.rememberMe = rememberMe;
        this.sessionStartTime = Date.now();
        this.saveProfile();

        try { localStorage.setItem('gsc_player_id', localPlayer.id); } catch (e) {}

        return {
          success: true,
          player: localPlayer,
          token: localToken,
          message: 'Uspešna prijava (lokalni profil).'
        };
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Non-JSON response from /api/auth/login:', jsonErr);
        return { success: false, error: `Greška servera (${res.status}). Pokušajte ponovo.` };
      }

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Pogrešno korisničko ime ili lozinka.' };
      }

      this.setAuthToken(data.token, rememberMe);
      this.profile.id = data.player.id;
      this.profile.username = data.player.username || username;
      this.profile.phone = data.player.phone || null;
      this.profile.vipTier = data.player.vip_tier || 'STANDARD';
      this.profile.balance_rsd = Number(data.player.balance_rsd != null ? data.player.balance_rsd : 1000.00);
      this.profile.isLoggedIn = true;
      this.profile.isVerified18 = true;
      this.profile.rememberMe = rememberMe;
      this.sessionStartTime = Date.now();
      this.saveProfile();

      try {
        localStorage.setItem('gsc_player_id', data.player.id);
      } catch (e) {}

      return { success: true, player: data.player, token: data.token, message: data.message };
    } catch (e) {
      console.error('Login fetch network error:', e);
      return { success: false, error: 'Mrežna greška pri povezivanju sa serverom. Proverite internet vezu.' };
    }
  }

  logout() {
    this.clearAuthToken();
    this.profile.isLoggedIn = false;
    if (!this.profile.rememberMe) {
      this.profile.username = '';
      this.profile.phone = '';
      this.profile.isVerified18 = false;
    }
    this.saveProfile();
  }

  async syncWithBackend(extra = {}) {
    if (typeof fetch === 'undefined') return;

    try {
      let favoriteGame = 'royal3x3';
      let maxSpins = -1;
      const spins = this.profile.stats.spinsByGame || {};
      for (const [game, count] of Object.entries(spins)) {
        if (count > maxSpins) {
          maxSpins = count;
          favoriteGame = game;
        }
      }

      const isPush = typeof Notification !== 'undefined' && Notification.permission === 'granted';
      const pushSub = window.currentPushSubscription || null;
      const currentRsd = (window.app && window.app.wallet)
        ? window.app.wallet.rsdBalance
        : (this.profile.balance_rsd != null ? this.profile.balance_rsd : 1000.00);

      const payload = {
        id: this.profile.id,
        nickname: this.profile.username || ('Gost_' + this.profile.id.replace('gsc_usr_', '')),
        vip_tier: this.profile.vipTier || 'STANDARD',
        balance_rsd: currentRsd,
        total_turnover: this.profile.stats.totalBet || 0,
        total_spins: this.profile.stats.totalSpins || 0,
        total_wins: this.profile.stats.totalWin || 0,
        favorite_game: favoriteGame,
        device_info: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          language: typeof navigator !== 'undefined' ? navigator.language : '',
          platform: typeof navigator !== 'undefined' ? navigator.platform : '',
          screen: typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : ''
        },
        push_subscription: pushSub,
        is_push_enabled: isPush,
        ...extra
      };

      const headers = { 'Content-Type': 'application/json' };
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/players/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.player) {
          if (data.player.vip_tier) this.profile.vipTier = data.player.vip_tier;
          if (data.player.balance_rsd != null) this.profile.balance_rsd = Number(data.player.balance_rsd);
          this.saveProfile();
        }
      }
    } catch (e) {
      // Offline / standalone fallback
    }
  }

  recordSpin(gameId, betAmount, winAmount = 0) {
    if (!this.profile.isLoggedIn) return;

    this.profile.stats.totalSpins += 1;
    if (this.profile.stats.spinsByGame[gameId] !== undefined) {
      this.profile.stats.spinsByGame[gameId] += 1;
    } else {
      this.profile.stats.spinsByGame[gameId] = 1;
    }

    this.profile.stats.totalBet += betAmount;
    this.profile.stats.totalWin += winAmount;

    if (winAmount > this.profile.stats.biggestWin) {
      this.profile.stats.biggestWin = winAmount;
    }

    this.saveProfile();

    // Periodic sync every 10 spins
    if (this.profile.stats.totalSpins % 10 === 0) {
      this.syncWithBackend();
    }
  }

  recordBonus(bonusType) {
    if (!this.profile.isLoggedIn) return;
    if (this.profile.stats.bonusesTriggered[bonusType] !== undefined) {
      this.profile.stats.bonusesTriggered[bonusType] += 1;
    }
    this.saveProfile();
  }

  recordJackpot(tier, amount) {
    if (!this.profile.isLoggedIn) return;
    const key = tier.toLowerCase();
    if (this.profile.stats.jackpotsWon[key] !== undefined) {
      this.profile.stats.jackpotsWon[key] += 1;
    }
    this.profile.stats.totalWin += amount;
    if (amount > this.profile.stats.biggestWin) {
      this.profile.stats.biggestWin = amount;
    }
    this.saveProfile();
  }

  getCalculatedRTP() {
    if (this.profile.stats.totalBet <= 0) return '0.00';
    const rtp = (this.profile.stats.totalWin / this.profile.stats.totalBet) * 100;
    return rtp.toFixed(2);
  }

  getSessionPlayTime() {
    const sessionSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const totalSeconds = (this.profile.stats.totalPlayTimeSeconds || 0) + sessionSeconds;
    
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  }
}

window.PlayerTracker = PlayerTracker;
