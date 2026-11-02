/**
 * Grand Slot Club - Multi-Tier Progression & Loyalty Engine
 * Manages 3 distinct status tiers:
 *   🥈 SILVER: Starting tier for all registered users (100 ZLT daily grant, 2 Trezor, 1 Royale)
 *   🥇 GOLD: Mid tier, unlocked at 2,500 XP + min. 5,000 ZLT in wallet (+500 ZLT bonus, 200 ZLT daily grant, 3 Trezor, 2 Royale)
 *   👑 VIP: Elite tier, unlocked at 15,000 XP + min. 25,000 ZLT in wallet (+2,000 ZLT bonus, 400 ZLT daily grant, 4 Trezor, 3 Royale)
 *   ⚡ GOD: Operator mode with unlimited access and max privileges
 *
 * Implements a 72-hour Grace Period if a Gold or VIP player's balance drops below the required threshold.
 */
class TierManager {
  static get TIER_CONFIG() {
    return {
      SILVER: {
        id: 'SILVER',
        name: 'Silver Član',
        shortName: 'SILVER',
        icon: '🥈',
        badgeClass: 'tier-silver',
        glowClass: 'tier-silver-glow',
        nextTier: 'GOLD',
        nextXp: 2500,
        nextZlt: 5000,
        levelUpBonus: 0,
        defaultGrant: 100,
        vaultLimit: 2,
        royaleLimit: 1,
        perksTitle: 'POČETNI STATUS',
        perksDesc: 'Standardni pristup Kazino Salonu, 2 ulaza u Trezor i 1 ulaz u Battle Royale dnevno.'
      },
      GOLD: {
        id: 'GOLD',
        name: 'Gold Član',
        shortName: 'GOLD',
        icon: '🥇',
        badgeClass: 'tier-gold',
        glowClass: 'tier-gold-glow',
        nextTier: 'VIP',
        nextXp: 15000,
        nextZlt: 25000,
        levelUpBonus: 500,
        defaultGrant: 200,
        vaultLimit: 3,
        royaleLimit: 2,
        perksTitle: '+1 ULAZ U SVE BORBE & DUPLI BONUS',
        perksDesc: 'Veći dnevni bonus (200 ZLT), +1 ulaz više u Trezor (3/dan) i Battle Royale (2/dan), prioritet za turnire.'
      },
      VIP: {
        id: 'VIP',
        name: 'VIP Klub Elita',
        shortName: 'VIP',
        icon: '👑',
        badgeClass: 'tier-vip',
        glowClass: 'tier-vip-glow',
        nextTier: null,
        nextXp: null,
        nextZlt: null,
        levelUpBonus: 2000,
        defaultGrant: 400,
        vaultLimit: 4,
        royaleLimit: 3,
        perksTitle: 'MAKSIMALNE PRIVILEGIJE & VAUČERI ZA LOKALE',
        perksDesc: 'Maksimalni dnevni bonus (400 ZLT), 4 ulaza u Trezor i 3 u Battle Royale, VIP kruna, fizički vaučeri za lokale.'
      },
      GOD: {
        id: 'GOD',
        name: '⚡ GOD OPERATOR',
        shortName: 'GOD',
        icon: '⚡',
        badgeClass: 'tier-god',
        glowClass: 'tier-god-glow',
        nextTier: null,
        nextXp: null,
        nextZlt: null,
        levelUpBonus: 0,
        defaultGrant: 10000,
        vaultLimit: 9999,
        royaleLimit: 9999,
        perksTitle: 'SUPER ADMINISTRATOR',
        perksDesc: 'Neograničeni resursi, pristup svim sobama i puna kontrola.'
      }
    };
  }

  constructor(app = null) {
    this.app = app;
    this.graceTimerInterval = null;
  }

  init(app) {
    if (app) this.app = app;
    this.ensurePlayerDefaults();
    this.bindEvents();
    this.updateUI();
    this.startGraceTimer();
  }

  ensurePlayerDefaults() {
    if (!this.app || !this.app.playerTracker) return;
    const p = this.app.playerTracker.profile;
    if (!p) return;

    if (!p.vipTier || p.vipTier === 'STANDARD') {
      p.vipTier = (p.is_god || p.role === 'GOD') ? 'GOD' : 'SILVER';
    }
    if (typeof p.xp !== 'number' || isNaN(p.xp)) {
      p.xp = 0;
    }
    if (!p.claimedTiers) {
      p.claimedTiers = { GOLD: false, VIP: false };
    }
    if (!p.gracePeriod) {
      p.gracePeriod = { active: false, expiresAt: null, originalTier: null };
    }
    this.app.playerTracker.saveProfile();
  }

  getTierConfig(tierId = null) {
    if (!tierId) {
      if (this.app && this.app.playerTracker && this.app.playerTracker.profile) {
        tierId = this.app.playerTracker.profile.vipTier;
      }
    }
    const clean = String(tierId || 'SILVER').toUpperCase();
    return TierManager.TIER_CONFIG[clean] || TierManager.TIER_CONFIG.SILVER;
  }

  getEffectiveLimits(tierId = null) {
    const config = this.getTierConfig(tierId);
    let overrides = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('gsc_operator_limits');
        if (stored) overrides = JSON.parse(stored);
      }
    } catch (_) {}

    const tierKey = config.id.toLowerCase(); // 'silver', 'gold', 'vip'
    const customGrant = overrides?.[`dailyGrant_${tierKey}`];
    const customVault = overrides?.[`vaultLimit_${tierKey}`];
    const customRoyale = overrides?.[`royaleLimit_${tierKey}`];

    return {
      dailyGrant: (customGrant !== undefined && customGrant !== null && customGrant !== '') ? Number(customGrant) : config.defaultGrant,
      vaultLimit: (customVault !== undefined && customVault !== null && customVault !== '') ? Number(customVault) : config.vaultLimit,
      royaleLimit: (customRoyale !== undefined && customRoyale !== null && customRoyale !== '') ? Number(customRoyale) : config.royaleLimit
    };
  }

  addXP(amount, reason = '') {
    if (!amount || amount <= 0) return;
    if (!this.app || !this.app.playerTracker) return;
    const p = this.app.playerTracker.profile;
    if (!p || !p.isLoggedIn) return;

    this.ensurePlayerDefaults();
    p.xp = Math.max(0, (p.xp || 0) + Math.round(amount));
    this.app.playerTracker.saveProfile();

    if (this.app && typeof this.app.showMessage === 'function' && reason) {
      this.app.showMessage(`⚡ +${amount} XP (${reason})`, 'info');
    }

    this.checkTierProgression();
    this.updateUI();
  }

  checkTierProgression(manualBalance = null) {
    if (!this.app || !this.app.playerTracker) return;
    const p = this.app.playerTracker.profile;
    if (!p || !p.isLoggedIn) return;
    if (p.vipTier === 'GOD' || p.role === 'GOD' || p.is_god) return;

    this.ensurePlayerDefaults();

    let balance = p.balance_rsd || 1000;
    if (manualBalance !== null) {
      balance = manualBalance;
    } else if (this.app.wallet && typeof this.app.wallet.rsdBalance === 'number') {
      balance = this.app.wallet.rsdBalance;
    }

    const currentTier = p.vipTier;
    const xp = p.xp || 0;

    // --- PROMOTION CHECKS ---
    if (currentTier === 'SILVER') {
      if (xp >= 15000 && balance >= 25000) {
        this.promoteToTier('VIP', 2000);
        return;
      } else if (xp >= 2500 && balance >= 5000) {
        this.promoteToTier('GOLD', 500);
        return;
      }
    } else if (currentTier === 'GOLD') {
      if (xp >= 15000 && balance >= 25000) {
        this.promoteToTier('VIP', 2000);
        return;
      }
    }

    // --- GRACE PERIOD & DEMOTION CHECKS ---
    if (currentTier === 'VIP') {
      const requiredZlt = 25000;
      if (balance < requiredZlt) {
        if (!p.gracePeriod.active) {
          p.gracePeriod = {
            active: true,
            expiresAt: Date.now() + 72 * 3600 * 1000,
            originalTier: 'VIP'
          };
          this.app.playerTracker.saveProfile();
          if (this.app && this.app.showMessage) {
            this.app.showMessage('⚠️ STATUS U RIZIKU: Saldo je pao ispod 25.000 ZLT! Imate 72h da dopunite saldo.', 'error');
          }
        } else {
          // Check expiration
          if (Date.now() >= p.gracePeriod.expiresAt) {
            const fallbackTier = (xp >= 2500 && balance >= 5000) ? 'GOLD' : 'SILVER';
            this.demoteToTier(fallbackTier, 'Grace period od 72h je istekao.');
            return;
          }
        }
      } else {
        // Balance recovered
        if (p.gracePeriod && p.gracePeriod.active) {
          p.gracePeriod = { active: false, expiresAt: null, originalTier: null };
          this.app.playerTracker.saveProfile();
          if (this.app && this.app.showMessage) {
            this.app.showMessage('✅ ČESTITAMO: Vaš VIP status je uspešno sačuvan i bezbedan!', 'jackpot');
          }
        }
      }
    } else if (currentTier === 'GOLD') {
      const requiredZlt = 5000;
      if (balance < requiredZlt) {
        if (!p.gracePeriod.active) {
          p.gracePeriod = {
            active: true,
            expiresAt: Date.now() + 72 * 3600 * 1000,
            originalTier: 'GOLD'
          };
          this.app.playerTracker.saveProfile();
          if (this.app && this.app.showMessage) {
            this.app.showMessage('⚠️ STATUS U RIZIKU: Saldo je pao ispod 5.000 ZLT! Imate 72h da dopunite saldo.', 'error');
          }
        } else {
          // Check expiration
          if (Date.now() >= p.gracePeriod.expiresAt) {
            this.demoteToTier('SILVER', 'Grace period od 72h je istekao.');
            return;
          }
        }
      } else {
        // Balance recovered
        if (p.gracePeriod && p.gracePeriod.active) {
          p.gracePeriod = { active: false, expiresAt: null, originalTier: null };
          this.app.playerTracker.saveProfile();
          if (this.app && this.app.showMessage) {
            this.app.showMessage('✅ ČESTITAMO: Vaš GOLD status je uspešno sačuvan i bezbedan!', 'jackpot');
          }
        }
      }
    }

    this.updateUI();
  }

  promoteToTier(newTier, levelUpBonus) {
    const p = this.app.playerTracker.profile;
    p.vipTier = newTier;
    p.gracePeriod = { active: false, expiresAt: null, originalTier: null };

    // Award bonus if not claimed yet
    let awardedBonus = 0;
    if (!p.claimedTiers[newTier]) {
      p.claimedTiers[newTier] = true;
      if (newTier === 'VIP') p.claimedTiers['GOLD'] = true;
      awardedBonus = levelUpBonus;
      if (this.app && this.app.wallet) {
        this.app.wallet.addFictionalRsd(levelUpBonus);
      }
    }

    this.app.playerTracker.saveProfile();
    if (this.app && typeof this.app.updateModeQuotaPills === 'function') {
      this.app.updateModeQuotaPills();
    }
    this.updateUI();
    this.showCelebrationModal(newTier, awardedBonus);
  }

  demoteToTier(targetTier, reasonText) {
    const p = this.app.playerTracker.profile;
    p.vipTier = targetTier;
    p.gracePeriod = { active: false, expiresAt: null, originalTier: null };
    this.app.playerTracker.saveProfile();

    if (this.app && typeof this.app.updateModeQuotaPills === 'function') {
      this.app.updateModeQuotaPills();
    }
    this.updateUI();

    if (this.app && this.app.showMessage) {
      this.app.showMessage(`⚠️ ${reasonText} Vaš status je promenjen na ${targetTier}.`, 'error');
    }
  }

  showCelebrationModal(tierId, bonusAwarded) {
    const modal = document.getElementById('tier-celebration-modal');
    if (!modal) return;

    const config = this.getTierConfig(tierId);
    const trophyEl = document.getElementById('celebration-trophy-icon');
    const badgeEl = document.getElementById('celebration-tier-badge');
    const titleEl = document.getElementById('celebration-title');
    const descEl = document.getElementById('celebration-desc');
    const bonusEl = document.getElementById('celebration-bonus-amount');
    const perksListEl = document.getElementById('celebration-perks-list');

    if (trophyEl) trophyEl.textContent = config.icon;
    if (badgeEl) {
      badgeEl.className = `celebration-badge ${config.badgeClass}`;
      badgeEl.textContent = `NOVI STATUS: ${config.name.toUpperCase()}!`;
    }
    if (titleEl) titleEl.textContent = 'ČESTITAMO NA NAPREDOVANJU!';
    if (descEl) {
      descEl.textContent = `Vaša igra, posvećenost i status u Grand Slot Clubu su vas podigli na rang ${config.name}!`;
    }
    if (bonusEl) {
      bonusEl.textContent = bonusAwarded > 0 ? `+${bonusAwarded.toLocaleString()} ZLT` : 'Prestižni Status';
    }
    if (perksListEl) {
      const limits = this.getEffectiveLimits(tierId);
      perksListEl.innerHTML = `
        <div class="celebration-perk-item">✔ Dnevni bonus prijave: <strong>+${limits.dailyGrant} ZLT</strong></div>
        <div class="celebration-perk-item">✔ Dnevni ulazi u Trezor: <strong>${limits.vaultLimit} provale/dan</strong></div>
        <div class="celebration-perk-item">✔ Dnevni ulazi u Royale: <strong>${limits.royaleLimit} borbe/dan</strong></div>
        <div class="celebration-perk-item">✔ Ekskluzivni vaučeri i prioritet za klupska takmičenja</div>
      `;
    }

    if (window.slotAudio && window.slotAudio.playJackpot) {
      window.slotAudio.playJackpot();
    }
    if (window.particleEngine && window.particleEngine.spawnCelebration) {
      window.particleEngine.spawnCelebration(true);
    }

    modal.style.display = 'flex';
  }

  closeCelebrationModal() {
    const modal = document.getElementById('tier-celebration-modal');
    if (modal) modal.style.display = 'none';
    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }
  }

  updateUI() {
    this.renderHeaderBadge();
    this.renderProfileWidget();
  }

  renderHeaderBadge() {
    const btn = document.getElementById('btn-header-tier');
    const iconEl = document.getElementById('header-tier-icon');
    const labelEl = document.getElementById('header-tier-label');
    if (!btn) return;

    const p = this.app && this.app.playerTracker ? this.app.playerTracker.profile : null;
    const tierId = (p && p.isLoggedIn) ? (p.vipTier || 'SILVER') : 'SILVER';
    const config = this.getTierConfig(tierId);

    btn.className = `btn-header-nav btn-header-tier ${config.glowClass}`;
    if (iconEl) iconEl.textContent = config.icon;
    if (labelEl) labelEl.textContent = config.shortName;
  }

  renderProfileWidget() {
    const p = this.app && this.app.playerTracker ? this.app.playerTracker.profile : null;
    if (!p) return;

    const config = this.getTierConfig(p.vipTier);
    const balance = this.app && this.app.wallet ? this.app.wallet.rsdBalance : (p.balance_rsd || 1000);
    const xp = p.xp || 0;

    const badgeContainer = document.getElementById('profile-tier-badge-container');
    if (badgeContainer) {
      badgeContainer.innerHTML = `<span class="tier-pill-badge ${config.badgeClass}">${config.icon} ${config.name.toUpperCase()}</span>`;
    }

    const xpCounter = document.getElementById('profile-xp-counter');
    if (xpCounter) {
      xpCounter.textContent = `${xp.toLocaleString()} XP`;
    }

    const targetTitle = document.getElementById('tier-target-title');
    const fillEl = document.getElementById('tier-progress-fill');
    const xpTxt = document.getElementById('tier-xp-progress-txt');
    const zltTxt = document.getElementById('tier-zlt-requirement-txt');
    const perksPreviewTxt = document.getElementById('tier-perks-preview-txt');
    const graceAlert = document.getElementById('tier-grace-alert');
    const graceTimerTxt = document.getElementById('tier-grace-timer-txt');

    if (config.nextTier) {
      const nextConfig = this.getTierConfig(config.nextTier);
      if (targetTitle) {
        targetTitle.textContent = `Sledeći nivo: ${nextConfig.icon} ${nextConfig.shortName} (+${nextConfig.levelUpBonus} ZLT Bonus)`;
      }

      const xpPct = Math.min(100, Math.round((xp / config.nextXp) * 100));
      if (fillEl) fillEl.style.width = `${xpPct}%`;

      if (xpTxt) {
        xpTxt.innerHTML = `XP: <strong>${xp.toLocaleString()} / ${config.nextXp.toLocaleString()} XP</strong> (${xpPct}%)`;
      }

      const hasZlt = balance >= config.nextZlt;
      if (zltTxt) {
        zltTxt.innerHTML = hasZlt 
          ? `<span class="req-met">✔ Saldo: ${Math.round(balance).toLocaleString()} / ${config.nextZlt.toLocaleString()} ZLT</span>`
          : `<span class="req-missing">💵 Saldo: ${Math.round(balance).toLocaleString()} / ${config.nextZlt.toLocaleString()} ZLT (Fali: ${(config.nextZlt - balance).toLocaleString()} ZLT)</span>`;
      }

      if (perksPreviewTxt) {
        perksPreviewTxt.textContent = nextConfig.perksDesc;
      }
    } else {
      if (targetTitle) {
        targetTitle.textContent = config.id === 'GOD' ? '⚡ Super Administrator Režim Aktivan' : '👑 Maksimalni VIP Elite Nivo Dostignut!';
      }
      if (fillEl) fillEl.style.width = '100%';
      if (xpTxt) xpTxt.textContent = `Ukupno skupljeno: ${xp.toLocaleString()} XP`;
      if (zltTxt) zltTxt.innerHTML = `<span class="req-met">✔ Zlatni novčanik: ${Math.round(balance).toLocaleString()} ZLT</span>`;
      if (perksPreviewTxt) perksPreviewTxt.textContent = config.perksDesc;
    }

    // Grace Period Alert
    if (p.gracePeriod && p.gracePeriod.active) {
      if (graceAlert) graceAlert.style.display = 'flex';
      const remainingMs = Math.max(0, p.gracePeriod.expiresAt - Date.now());
      const hours = Math.floor(remainingMs / 3600000);
      const mins = Math.floor((remainingMs % 3600000) / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      const pad = (n) => String(n).padStart(2, '0');
      if (graceTimerTxt) {
        graceTimerTxt.textContent = `Preostalo: ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s da dopunite saldo iznad limita!`;
      }
    } else {
      if (graceAlert) graceAlert.style.display = 'none';
    }
  }

  startGraceTimer() {
    if (this.graceTimerInterval) clearInterval(this.graceTimerInterval);
    this.graceTimerInterval = setInterval(() => {
      const p = this.app && this.app.playerTracker ? this.app.playerTracker.profile : null;
      if (p && p.gracePeriod && p.gracePeriod.active) {
        this.renderProfileWidget();
        if (Date.now() >= p.gracePeriod.expiresAt) {
          this.checkTierProgression();
        }
      }
    }, 1000);
  }

  bindEvents() {
    const btnHeaderTier = document.getElementById('btn-header-tier');
    if (btnHeaderTier) {
      btnHeaderTier.addEventListener('click', () => {
        if (this.app && typeof this.app.openProfileModal === 'function') {
          this.app.openProfileModal();
        }
      });
    }

    const btnClaimCelebration = document.getElementById('btn-celebration-claim');
    if (btnClaimCelebration) {
      btnClaimCelebration.addEventListener('click', () => {
        this.closeCelebrationModal();
      });
    }
  }
}

// Global attachment
if (typeof window !== 'undefined') {
  window.TierManager = TierManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TierManager;
}
