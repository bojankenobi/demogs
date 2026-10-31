/**
 * Grand Slot Club - Daily Access & Exclusivity Control Manager
 * Enforces daily entry limits for Vault Crawler & Battle Royale,
 * manages daily login grants (100 ZLT), and logs player session activity.
 */
class DailyAccessManager {
  constructor() {
    this.operatorLimitsKey = 'gsc_operator_limits';
    this.loginAuditKey = 'gsc_login_audit_trail';
    this.playerAccessKeyPrefix = 'gsc_daily_access_';
  }

  getTodayStr() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  getMsUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    return Math.max(0, midnight.getTime() - now.getTime());
  }

  getCurrentPlayerId() {
    try {
      const stored = localStorage.getItem('gsc_player_profile');
      if (stored) {
        const p = JSON.parse(stored);
        if (p && p.id) return p.id;
      }
    } catch (e) {}
    return 'gsc_player_1';
  }

  getOperatorLimits() {
    try {
      const stored = localStorage.getItem(this.operatorLimitsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          vaultLimit: parsed.vaultLimit !== undefined ? parsed.vaultLimit : (parsed.vaultDailyLimit !== undefined ? parsed.vaultDailyLimit : 2),
          royaleLimit: parsed.royaleLimit !== undefined ? parsed.royaleLimit : (parsed.royaleDailyLimit !== undefined ? parsed.royaleDailyLimit : 1),
          dailyGrant: parsed.dailyGrant !== undefined ? parsed.dailyGrant : (parsed.dailyLoginGrantZlt !== undefined ? parsed.dailyLoginGrantZlt : 100),
          vaultDailyLimit: parsed.vaultDailyLimit !== undefined ? parsed.vaultDailyLimit : (parsed.vaultLimit !== undefined ? parsed.vaultLimit : 2),
          royaleDailyLimit: parsed.royaleDailyLimit !== undefined ? parsed.royaleDailyLimit : (parsed.royaleLimit !== undefined ? parsed.royaleLimit : 1),
          dailyLoginGrantZlt: parsed.dailyLoginGrantZlt !== undefined ? parsed.dailyLoginGrantZlt : (parsed.dailyGrant !== undefined ? parsed.dailyGrant : 100),
          lockReasonText: parsed.lockReasonText || 'Dnevna kvota ekskluzivnih ulazaka je iskorišćena.',
          lockEnabled: parsed.lockEnabled !== false
        };
      }
    } catch (e) {}

    return {
      vaultLimit: 2,
      royaleLimit: 1,
      dailyGrant: 100,
      vaultDailyLimit: 2,
      royaleDailyLimit: 1,
      dailyLoginGrantZlt: 100,
      lockReasonText: 'Dnevna kvota ekskluzivnih ulazaka je iskorišćena.',
      lockEnabled: true
    };
  }

  getLimits() {
    return this.getOperatorLimits();
  }

  getLimit(mode) {
    const limits = this.getOperatorLimits();
    return mode === 'vault' ? limits.vaultDailyLimit : limits.royaleDailyLimit;
  }

  saveOperatorLimits(limits) {
    try {
      const normalized = {
        vaultLimit: limits.vaultDailyLimit !== undefined ? limits.vaultDailyLimit : (limits.vaultLimit !== undefined ? limits.vaultLimit : 2),
        royaleLimit: limits.royaleDailyLimit !== undefined ? limits.royaleDailyLimit : (limits.royaleLimit !== undefined ? limits.royaleLimit : 1),
        dailyGrant: limits.dailyLoginGrantZlt !== undefined ? limits.dailyLoginGrantZlt : (limits.dailyGrant !== undefined ? limits.dailyGrant : 100),
        vaultDailyLimit: limits.vaultDailyLimit !== undefined ? limits.vaultDailyLimit : (limits.vaultLimit !== undefined ? limits.vaultLimit : 2),
        royaleDailyLimit: limits.royaleDailyLimit !== undefined ? limits.royaleDailyLimit : (limits.royaleLimit !== undefined ? limits.royaleLimit : 1),
        dailyLoginGrantZlt: limits.dailyLoginGrantZlt !== undefined ? limits.dailyLoginGrantZlt : (limits.dailyGrant !== undefined ? limits.dailyGrant : 100),
        lockReasonText: limits.lockReasonText || 'Dnevna kvota ekskluzivnih ulazaka je iskorišćena.',
        lockEnabled: limits.lockEnabled !== false
      };
      localStorage.setItem(this.operatorLimitsKey, JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to save operator limits:', e);
    }
  }

  setLimits(limits) {
    this.saveOperatorLimits(limits);
  }

  getUsage(playerId, mode) {
    const access = this.getPlayerAccess(playerId);
    return mode === 'vault' ? (access.vaultEntries || 0) : (access.royaleEntries || 0);
  }

  getRemaining(playerId, mode) {
    const limit = this.getLimit(mode);
    const usage = this.getUsage(playerId, mode);
    return Math.max(0, limit - usage);
  }

  hasClaimedDailyGrant(playerId) {
    const access = this.getPlayerAccess(playerId);
    return !!access.dailyGrantClaimed;
  }

  getPlayerAccess(playerId) {
    if (!playerId) playerId = 'guest';
    const key = `${this.playerAccessKeyPrefix}${playerId}`;
    const today = this.getTodayStr();

    let data = null;
    try {
      const stored = localStorage.getItem(key);
      if (stored) data = JSON.parse(stored);
    } catch (e) {}

    // Date rollover or brand new record
    if (!data || data.date !== today) {
      const prevTotalLogins = (data && data.totalLogins) || 0;
      data = {
        date: today,
        vaultEntries: 0,
        royaleEntries: 0,
        dailyGrantClaimed: false,
        totalLogins: prevTotalLogins + 1,
        lastLoginTime: Date.now()
      };
      this.savePlayerAccess(playerId, data);
    }

    return data;
  }

  savePlayerAccess(playerId, data) {
    if (!playerId) playerId = 'guest';
    const key = `${this.playerAccessKeyPrefix}${playerId}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save player access quota:', e);
    }
  }

  canEnterMode(playerId, mode) {
    if (mode !== 'vault' && mode !== 'royale') {
      return { allowed: true, mode };
    }

    const limits = this.getOperatorLimits();
    if (!limits.lockEnabled) {
      return { allowed: true, mode, current: 0, currentUsage: 0, max: 999, limit: 999 };
    }

    const access = this.getPlayerAccess(playerId);
    const isVault = mode === 'vault';
    const current = isVault ? (access.vaultEntries || 0) : (access.royaleEntries || 0);
    const max = isVault ? limits.vaultLimit : limits.royaleLimit;

    if (current >= max) {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = Math.max(0, midnight.getTime() - now.getTime());
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(h)}h ${pad(m)}m ${pad(s)}s`;

      return {
        allowed: false,
        mode,
        current,
        currentUsage: current,
        max,
        limit: max,
        remaining: 0,
        reason: limits.lockReasonText || 'Dnevna kvota ekskluzivnih ulazaka je iskorišćena.',
        resetInMs: diffMs,
        timeUntilReset: timeStr
      };
    }

    return {
      allowed: true,
      mode,
      current,
      currentUsage: current,
      max,
      limit: max,
      remaining: max - current
    };
  }

  recordEntry(playerId, mode) {
    if (mode !== 'vault' && mode !== 'royale') return;
    const access = this.getPlayerAccess(playerId);
    if (mode === 'vault') {
      access.vaultEntries = (access.vaultEntries || 0) + 1;
    } else {
      access.royaleEntries = (access.royaleEntries || 0) + 1;
    }
    access.lastActiveTime = Date.now();
    this.savePlayerAccess(playerId, access);
  }

  checkAndClaimDailyGrant(playerId, username = '') {
    const limits = this.getOperatorLimits();
    const grantAmount = Number(limits.dailyGrant) || 100;
    const access = this.getPlayerAccess(playerId);

    if (!access.dailyGrantClaimed) {
      access.dailyGrantClaimed = true;
      access.lastGrantAmount = grantAmount;
      access.lastGrantTime = Date.now();
      this.savePlayerAccess(playerId, access);

      this.recordLoginAudit(playerId, username, grantAmount);

      return {
        awarded: true,
        shouldAward: true,
        amount: grantAmount,
        totalLogins: access.totalLogins || 1
      };
    }

    return {
      awarded: false,
      shouldAward: false,
      amount: 0,
      totalLogins: access.totalLogins || 1
    };
  }

  resetPlayerLimits(playerId) {
    const access = this.getPlayerAccess(playerId);
    access.vaultEntries = 0;
    access.royaleEntries = 0;
    this.savePlayerAccess(playerId, access);
  }

  resetAllPlayerLimits() {
    const today = this.getTodayStr();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.playerAccessKeyPrefix)) {
          const item = JSON.parse(localStorage.getItem(k));
          if (item) {
            item.vaultEntries = 0;
            item.royaleEntries = 0;
            item.date = today;
            localStorage.setItem(k, JSON.stringify(item));
          }
        }
      }
    } catch (e) {
      console.warn('Error resetting all player limits:', e);
    }
  }

  recordLoginAudit(arg1, arg2, arg3 = 100) {
    let playerId = 'gsc_player_1';
    let username = 'Gost Igrač';
    let grantAmount = 0;

    if (typeof arg1 === 'object' && arg1 !== null) {
      playerId = arg1.playerId || 'gsc_player_1';
      username = arg1.playerName || arg1.username || playerId;
      grantAmount = arg1.bonusAwarded !== undefined ? arg1.bonusAwarded : (arg1.grantAmount || 0);
    } else {
      playerId = arg1 || 'gsc_player_1';
      username = arg2 || playerId;
      grantAmount = arg3 || 0;
    }

    const trail = this.getLoginAuditTrail();
    const isMobile = (typeof window !== 'undefined' && window.innerWidth <= 768) || 
                     (typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent));
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      playerId,
      playerName: username,
      username: username,
      timestamp: Date.now(),
      timeStr: timeStr,
      dateStr: this.getTodayStr(),
      bonusAwarded: grantAmount,
      grantAwarded: grantAmount,
      device: isMobile ? '📱 Mobilni Uređaj' : '💻 Desktop PC',
      deviceType: isMobile ? 'Mobilni' : 'Desktop',
      location: 'Kazino Klub / Lokalno'
    };

    trail.unshift(entry);
    // Keep last 150 login events
    if (trail.length > 150) trail.length = 150;

    try {
      localStorage.setItem(this.loginAuditKey, JSON.stringify(trail));
    } catch (e) {}
  }

  getTodayLogins() {
    const today = this.getTodayStr();
    const trail = this.getLoginAuditTrail();
    return trail.filter(t => t.dateStr === today);
  }

  getLoginAuditTrail() {
    try {
      const stored = localStorage.getItem(this.loginAuditKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    // Seed with realistic demo logins if empty
    const now = Date.now();
    const seed = [
      {
        id: 'log_seed_1',
        playerId: 'gsc_usr_7891',
        username: 'Stefan_VIP',
        timestamp: now - 180000,
        dateStr: this.getTodayStr(),
        grantAwarded: 100,
        device: '💻 Desktop PC'
      },
      {
        id: 'log_seed_2',
        playerId: 'gsc_usr_4201',
        username: 'Marko_Kralj',
        timestamp: now - 720000,
        dateStr: this.getTodayStr(),
        grantAwarded: 100,
        device: '📱 Mobilni Uređaj'
      },
      {
        id: 'log_seed_3',
        playerId: 'gsc_usr_1105',
        username: 'Nikola_Slot',
        timestamp: now - 3600000,
        dateStr: this.getTodayStr(),
        grantAwarded: 100,
        device: '💻 Desktop PC'
      }
    ];

    try {
      localStorage.setItem(this.loginAuditKey, JSON.stringify(seed));
    } catch (e) {}

    return seed;
  }

  getTodayLoginsCount() {
    const today = this.getTodayStr();
    const trail = this.getLoginAuditTrail();
    return trail.filter(t => t.dateStr === today).length;
  }

  getTotalLoginsCount() {
    const trail = this.getLoginAuditTrail();
    return trail.length;
  }
}

if (typeof window !== 'undefined') {
  window.DailyAccessManager = DailyAccessManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DailyAccessManager };
}
