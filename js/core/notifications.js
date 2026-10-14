/**
 * Grandslot - Push & In-App Notification Manager
 * Handles Web Notifications, Service Worker Push integration, and Background Engagement Alerts.
 */
class NotificationManager {
  constructor(app) {
    this.app = app;
    this.STORAGE_KEY = 'grandslot_notif_enabled';
    this.swRegistration = null;
    this.awayTimer = null;
    this.isSupported = typeof window !== 'undefined' && ('Notification' in window);

    // Initial state from localStorage (defaults to true if permission is already granted)
    const saved = localStorage.getItem(this.STORAGE_KEY);
    this.isEnabled = (saved !== null) 
      ? (saved === 'true') 
      : (this.isSupported && Notification.permission === 'granted');

    this.initServiceWorker();
    this.initVisibilityListener();
    this.updateUI();
  }

  async initServiceWorker() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('sw.js');
        this.swRegistration = reg;
        if (reg.update) reg.update();
        await this.fetchSubscription();
      } catch (err) {
        console.warn('Service Worker registration note:', err);
      }
    }
  }

  async fetchSubscription() {
    if (!this.swRegistration || !('pushManager' in this.swRegistration)) return null;
    try {
      const sub = await this.swRegistration.pushManager.getSubscription();
      if (sub) {
        window.currentPushSubscription = sub.toJSON ? sub.toJSON() : sub;
        if (this.app?.playerTracker) {
          this.app.playerTracker.syncWithBackend({ 
            push_subscription: window.currentPushSubscription, 
            is_push_enabled: true 
          });
        }
      }
      return sub;
    } catch (e) {
      return null;
    }
  }

  initVisibilityListener() {
    if (typeof document === 'undefined') return;

    // Detect when player minimizes tab or leaves app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Only schedule retention push if player enabled notifications
        if (this.isEnabled && this.isPermissionGranted()) {
          this.scheduleAwayNotification();
        }
      } else {
        // Player returned to game
        if (this.awayTimer) {
          clearTimeout(this.awayTimer);
          this.awayTimer = null;
        }
      }
    });
  }

  isPermissionGranted() {
    return this.isSupported && Notification.permission === 'granted';
  }

  async requestPermission() {
    if (!this.isSupported) {
      if (this.app?.showMessage) {
        this.app.showMessage('ℹ️ Vaš browser ne podržava sistemske push notifikacije.', 'info');
      }
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        this.isEnabled = true;
        localStorage.setItem(this.STORAGE_KEY, 'true');
        this.updateUI();
        await this.fetchSubscription();

        // Audio feedback
        if (window.slotAudio && window.slotAudio.playClick) {
          window.slotAudio.playClick();
        }

        // Welcome Notification
        const isEn = window.i18n && window.i18n.currentLang === 'en';
        const title = isEn ? '🎰 GRANDSLOT NOTIFICATIONS ACTIVE' : '🎰 GRANDSLOT NOTIFIKACIJE AKTIVNE';
        const body = isEn 
          ? 'You will receive instant alerts for major Jackpots, Tournaments and Special Bonuses!' 
          : 'Uspešno ste aktivirali obaveštenja za Grand Džekpotove, Turnire i Specijalne Bonuse!';

        this.sendPushNotification(title, body, { url: './' });

        if (this.app?.showMessage) {
          this.app.showMessage(isEn ? '🔔 NOTIFICATIONS ENABLED!' : '🔔 NOTIFIKACIJE USPEŠNO UKLJUČENE!', 'win');
        }
        return true;
      } else if (perm === 'denied') {
        this.isEnabled = false;
        localStorage.setItem(this.STORAGE_KEY, 'false');
        this.updateUI();

        const isEn = window.i18n && window.i18n.currentLang === 'en';
        const msg = isEn 
          ? '⚠️ Notifications are blocked in browser settings. Please allow them to receive jackpot alerts.'
          : '⚠️ Notifikacije su blokirane u podešavanjima vašeg pretraživača. Omogućite ih za obaveštenja o džekpotovima.';
        if (this.app?.showMessage) {
          this.app.showMessage(msg, 'info');
        }
        return false;
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }

    return false;
  }

  async toggle() {
    if (!this.isSupported) {
      if (this.app?.showMessage) {
        this.app.showMessage('ℹ️ Notifikacije nisu podržane na ovom uređaju.', 'info');
      }
      return;
    }

    if (Notification.permission === 'default') {
      await this.requestPermission();
      return;
    }

    if (Notification.permission === 'denied') {
      const isEn = window.i18n && window.i18n.currentLang === 'en';
      const msg = isEn 
        ? '⚠️ Notifications are blocked. Enable them in site settings in your browser address bar.'
        : '⚠️ Notifikacije su blokirane. Dozvolite ih klikom na katanac u traci browsera.';
      if (this.app?.showMessage) {
        this.app.showMessage(msg, 'info');
      }
      return;
    }

    // Toggle on/off if permission was granted
    this.isEnabled = !this.isEnabled;
    localStorage.setItem(this.STORAGE_KEY, this.isEnabled ? 'true' : 'false');
    this.updateUI();

    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }

    const isEn = window.i18n && window.i18n.currentLang === 'en';
    const msg = this.isEnabled 
      ? (isEn ? '🔔 PUSH NOTIFICATIONS ON' : '🔔 PUSH NOTIFIKACIJE UKLJUČENE')
      : (isEn ? '🔕 PUSH NOTIFICATIONS OFF' : '🔕 PUSH NOTIFIKACIJE ISKLJUČENE');

    if (this.app?.showMessage) {
      this.app.showMessage(msg, 'info');
    }
  }

  scheduleAwayNotification() {
    // Schedule a reminder after player has been inactive for 75 seconds
    this.awayTimer = setTimeout(() => {
      if (document.visibilityState === 'hidden' && this.isEnabled) {
        const isEn = window.i18n && window.i18n.currentLang === 'en';
        const title = isEn ? '🏆 GRANDSLOT CASINO JACKPOT' : '🏆 GRANDSLOT CASINO DŽEKPOT';
        const body = isEn 
          ? 'Gold & Diamond jackpots are reaching record heights! Click to spin and win!' 
          : 'Gold & Diamond džekpot fondovi rastu! Vratite se na slot i osvojite Mega Win!';
        this.sendPushNotification(title, body, { url: './' });
      }
    }, 75000);
  }

  async sendPushNotification(title, body, options = {}) {
    if (!this.isEnabled) return;

    const opt = {
      body: body,
      icon: 'assets/icons/icon-192.png',
      badge: 'assets/icons/favicon.png',
      vibrate: [200, 100, 200],
      tag: 'grandslot-alert',
      data: options.url ? { url: options.url } : { url: './' }
    };

    // 1. Try Service Worker showNotification (works in background & mobile PWA)
    if (this.swRegistration && this.swRegistration.showNotification) {
      try {
        await this.swRegistration.showNotification(title, opt);
        return;
      } catch (e) {
        console.warn('SW showNotification fallback:', e);
      }
    }

    // 2. Direct Window Notification fallback
    if (this.isPermissionGranted()) {
      try {
        const n = new Notification(title, opt);
        n.onclick = (e) => {
          e.preventDefault();
          window.focus();
          n.close();
        };
      } catch (e) {
        console.warn('Direct notification error:', e);
      }
    }
  }

  // Marketing & Game Event Triggers
  triggerJackpotAlert(jackpotTier = 'gold') {
    const isEn = window.i18n && window.i18n.currentLang === 'en';
    const title = isEn ? '⚡ MEGA JACKPOT ALERT!' : '⚡ GRANDSLOT DŽEKPOT ALARM!';
    const tierName = jackpotTier.toUpperCase();
    const body = isEn 
      ? `The ${tierName} JACKPOT is hot! Current prize pool is over 180,000 RSD!`
      : `Džekpot fond (${tierName}) je dostigao vrhunac! Osvojite preko 180.000 RSD na sledećem spinu!`;

    this.sendPushNotification(title, body);

    if (this.app?.showMessage) {
      this.app.showMessage(`🔔 PUSH POSLAT: ${title}`, 'jackpot');
    }
  }

  triggerTournamentAlert() {
    const isEn = window.i18n && window.i18n.currentLang === 'en';
    const title = isEn ? '🏆 120s TOURNAMENT IS LIVE!' : '🏆 GRANDSLOT 120s TURNIR!';
    const body = isEn 
      ? 'Join the high-speed challenge with 5,000 starter credits and claim rank #1!'
      : 'Uđite u brzi turnir sa 5.000 besplatnih poena i preuzmite vodeću poziciju na rang listi!';

    this.sendPushNotification(title, body);

    if (this.app?.showMessage) {
      this.app.showMessage(`🔔 PUSH POSLAT: ${title}`, 'frenzy');
    }
  }

  triggerBonusAlert() {
    const isEn = window.i18n && window.i18n.currentLang === 'en';
    const title = isEn ? '🎁 YOUR BONUS WHEEL IS READY!' : '🎁 VAŠ TOČAK SREĆE JE SPREMAN!';
    const body = isEn 
      ? 'Step up to the Wheel of Fortune! Multipliers up to 200x are waiting for you.'
      : 'Bonus Točak Sreće je spreman za okretanje! Multiplikatori do 200x vas čekaju.';

    this.sendPushNotification(title, body);

    if (this.app?.showMessage) {
      this.app.showMessage(`🔔 PUSH POSLAT: ${title}`, 'win');
    }
  }

  updateUI() {
    const badge = document.getElementById('menu-notif-status-badge');
    if (!badge) return;

    if (!this.isSupported) {
      badge.textContent = 'N/A';
      badge.className = 'menu-pill-badge';
      return;
    }

    if (this.isEnabled && this.isPermissionGranted()) {
      badge.textContent = 'ON';
      badge.className = 'menu-pill-badge badge-green';
    } else {
      badge.textContent = 'OFF';
      badge.className = 'menu-pill-badge';
    }
  }
}

window.NotificationManager = NotificationManager;
