/**
 * IGT - Player Tracker & Analytics Engine
 * Manages player profile, 18+ verification state, sessions, and comprehensive statistics.
 */
class PlayerTracker {
  constructor() {
    this.storageKey = 'igt_player_profile';
    this.sessionStartTime = Date.now();
    this.profile = this.loadProfile();
  }

  loadProfile() {
    const defaultProfile = {
      username: '',
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

  login(username, pin = '', rememberMe = true) {
    this.profile.username = username.trim() || 'Demo Player';
    this.profile.pin = pin;
    this.profile.isVerified18 = true;
    this.profile.isLoggedIn = true;
    this.profile.rememberMe = rememberMe;
    this.sessionStartTime = Date.now();
    this.saveProfile();
  }

  logout() {
    this.profile.isLoggedIn = false;
    if (!this.profile.rememberMe) {
      this.profile.username = '';
      this.profile.pin = '';
      this.profile.isVerified18 = false;
    }
    this.saveProfile();
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
