/**
 * Grand Slot Club - Live Events & Club Broadcast Hub Manager
 * 
 * Manages physical club events, venue tournaments, RSVPs and Fast-Pass QR tickets.
 * Connects the mobile player app directly with physical casino venue visits.
 */

class ClubEventsManager {
  constructor(app) {
    this.app = app;
    this.STORAGE_KEY = 'gsc_my_event_rsvps_v1';
    this.rsvps = this.loadRsvps();
    this.activeFilter = 'all';

    this.events = [
      {
        id: 'evt_bg_slama',
        title: 'SLOT ŠAMPIONAT: GRAND SLAMA',
        city: 'bg',
        venueId: 'loc_bg_centar',
        venueName: 'Grand Slot Beograd - Centar (Kralja Milana 12)',
        address: 'Kralja Milana 12, Beograd',
        dateTime: 'Petak • 21:00h',
        prize: '💰 50.000 ZLT Promo Kredita + Šampionski Pehar',
        desc: '15 minuta brzih spinova na izabranim EGT kabinetima u sali. Najviši rezultat nosi pehar i ekskluzivni promo paket kluba.',
        capacity: '18 / 30 Prijavljenih',
        badge: '🔥 NAJPOPULARNIJI TURNIR',
        badgeClass: 'badge-fire'
      },
      {
        id: 'evt_nbg_night',
        title: 'MYSTERY DŽEKPOT GROZNICA & DJ',
        city: 'bg',
        venueId: 'loc_bg_nbg',
        venueName: 'Grand Slot Novi Beograd (Bulevar Mihajla Pupina 10)',
        address: 'Bulevar Mihajla Pupina 10, Novi Beograd',
        dateTime: 'Subota • 22:00h',
        prize: '🎁 3x Garantovane Noćne Mystery Drop Koverte',
        desc: 'Noćni slot maraton uz DJ rezidenta. Svaki aktivan slot aparat u sali učestvuje u nasumičnim Mystery Drop kovertama.',
        capacity: 'Svi gosti kluba',
        badge: '⚡ NOĆNI SPECIJAL',
        badgeClass: 'badge-gold'
      },
      {
        id: 'evt_ns_poker',
        title: 'POKER APARAT KUP VOJVODINE',
        city: 'ns',
        venueId: 'loc_ns_centar',
        venueName: 'Grand Slot Novi Sad (Zmaj Jovina 8)',
        address: 'Zmaj Jovina 8, Novi Sad',
        dateTime: 'Nedelja • 19:00h',
        prize: '🏆 30.000 ZLT + Royal Video Poker Statua',
        desc: 'Tradicionalni turnir u Video Poker retro aparatima. 20 fiksnih rundi po igraču, najveća sakupljena tabela odnosi pobedu.',
        capacity: '12 / 20 Takmičara',
        badge: '🃏 KARTAŠKI KUP',
        badgeClass: 'badge-cyan'
      },
      {
        id: 'evt_nis_hh',
        title: 'DOUBLE WINNER HAPPY HOUR',
        city: 'nis',
        venueId: 'loc_nis_centar',
        venueName: 'Grand Slot Niš (Obrenovićeva 22)',
        address: 'Obrenovićeva 22, Niš',
        dateTime: 'Utorak • 18:00h - 21:00h',
        prize: '⚡ 2x VIP Bodovi + Promo Tiketi na sat vremena',
        desc: 'Duplirani bodovi za sve VIP članove kluba na blagajni i automatski Mystery tiketi na slot mašinama svakih 60 minuta.',
        capacity: 'Otvoreno za sve članove',
        badge: '🌟 HAPPY HOUR',
        badgeClass: 'badge-purple'
      }
    ];

    this.bindEvents();
    this.updateSpotlightBar();
  }

  loadRsvps() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  saveRsvps() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.rsvps));
    } catch (_) {}
  }

  bindEvents() {
    // Modal Openers
    const btnMenuEvents = document.getElementById('menu-opt-events');
    if (btnMenuEvents) {
      btnMenuEvents.addEventListener('click', () => {
        if (this.app && typeof this.app.closeCasinoMenu === 'function') {
          this.app.closeCasinoMenu();
        }
        setTimeout(() => this.openModal(), 120);
      });
    }

    const btnSpotlight = document.getElementById('btn-spotlight-rsvp');
    if (btnSpotlight) {
      btnSpotlight.addEventListener('click', () => this.openModal());
    }

    // Modal Close
    const closeBtn = document.getElementById('btn-close-club-events');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    const closeFooterBtn = document.getElementById('btn-events-close-footer');
    if (closeFooterBtn) {
      closeFooterBtn.addEventListener('click', () => this.closeModal());
    }

    const modal = document.getElementById('club-events-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // FastPass Close
    const closeFpBtn = document.getElementById('btn-close-fastpass');
    if (closeFpBtn) {
      closeFpBtn.addEventListener('click', () => this.closeFastPass());
    }

    const closeFpFooterBtn = document.getElementById('btn-close-fastpass-footer');
    if (closeFpFooterBtn) {
      closeFpFooterBtn.addEventListener('click', () => this.closeFastPass());
    }

    const fpModal = document.getElementById('event-fastpass-modal');
    if (fpModal) {
      fpModal.addEventListener('click', (e) => {
        if (e.target === fpModal) this.closeFastPass();
      });
    }

    // Filter Pills
    const filterPills = document.querySelectorAll('.event-filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeFilter = pill.getAttribute('data-city') || 'all';
        this.renderEvents();
      });
    });
  }

  openModal() {
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    const modal = document.getElementById('club-events-modal');
    if (!modal) return;
    this.renderEvents();
    modal.classList.remove('is-hidden');
    modal.classList.add('active');
  }

  closeModal() {
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    const modal = document.getElementById('club-events-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.add('is-hidden');
    }
  }

  renderEvents() {
    const listEl = document.getElementById('club-events-list');
    if (!listEl) return;

    const filtered = this.activeFilter === 'all' 
      ? this.events 
      : this.events.filter(e => e.city === this.activeFilter);

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="events-empty-state">
          <span class="empty-icon">📍</span>
          <p>Trenutno nema najavljenih turnira za izabrani grad. Izaberite "SVI KLUBOVI" za uvid u sva dešavanja.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(ev => {
      const rsvp = this.rsvps[ev.id];
      const isRsvpd = !!rsvp;

      return `
        <div class="event-card-item ${isRsvpd ? 'rsvpd-active' : ''}">
          <div class="event-card-top">
            <span class="event-badge ${ev.badgeClass}">${ev.badge}</span>
            <span class="event-timing">${ev.dateTime}</span>
          </div>

          <h3 class="event-title">${ev.title}</h3>
          
          <div class="event-meta-line">
            <span class="meta-icon">📍</span>
            <span class="meta-venue">${ev.venueName}</span>
          </div>

          <div class="event-prize-box">
            <span class="prize-label">NAGRADNI FOND &amp; BENEFIT:</span>
            <span class="prize-value">${ev.prize}</span>
          </div>

          <p class="event-description">${ev.desc}</p>

          <div class="event-footer-action">
            <span class="event-capacity">👥 ${ev.capacity}</span>
            ${isRsvpd ? `
              <div class="event-confirmed-group">
                <span class="confirmed-tag">✅ PRIJAVLJEN (${rsvp.ticketCode})</span>
                <button type="button" class="btn-view-pass" data-event-id="${ev.id}">Prikaži Propusnicu 🎟️</button>
              </div>
            ` : `
              <button type="button" class="btn-event-rsvp" data-event-id="${ev.id}">
                🎟️ PRIJAVI SE ZA TURNIR
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach RSVP buttons
    listEl.querySelectorAll('.btn-event-rsvp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.currentTarget.getAttribute('data-event-id');
        this.rsvpEvent(eventId);
      });
    });

    // Attach View Pass buttons
    listEl.querySelectorAll('.btn-view-pass').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.currentTarget.getAttribute('data-event-id');
        const ev = this.events.find(item => item.id === eventId);
        const rsvp = this.rsvps[eventId];
        if (ev && rsvp) {
          this.showFastPass(ev, rsvp.ticketCode);
        }
      });
    });
  }

  rsvpEvent(eventId) {
    const ev = this.events.find(item => item.id === eventId);
    if (!ev) return;

    if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
    if (window.particleEngine && window.particleEngine.burst) window.particleEngine.burst(300, 250);

    const cityPrefix = ev.city.toUpperCase();
    const randNum = Math.floor(100 + Math.random() * 900);
    const ticketCode = `TRN-${cityPrefix}01-${randNum}`;

    const rsvpRecord = {
      eventId: ev.id,
      ticketCode,
      eventTitle: ev.title,
      venueName: ev.venueName,
      dateTime: ev.dateTime,
      rsvpdAt: new Date().toISOString()
    };

    this.rsvps[ev.id] = rsvpRecord;
    this.saveRsvps();
    this.renderEvents();
    this.showFastPass(ev, ticketCode);

    if (this.app && typeof this.app.showMessage === 'function') {
      this.app.showMessage(`🎟️ Uspešna prijava za turnir! Propusnica: ${ticketCode}`, 'jackpot');
    }
  }

  showFastPass(ev, ticketCode) {
    const fpModal = document.getElementById('event-fastpass-modal');
    if (!fpModal) return;

    const titleEl = document.getElementById('fastpass-title');
    const venueEl = document.getElementById('fastpass-venue');
    const timeEl = document.getElementById('fastpass-time');
    const codeEl = document.getElementById('fastpass-code-val');
    const playerEl = document.getElementById('fastpass-player');
    const qrBox = document.getElementById('fastpass-qr-box');

    if (titleEl) titleEl.textContent = ev.title;
    if (venueEl) venueEl.textContent = `📍 ${ev.venueName}`;
    if (timeEl) timeEl.textContent = `⏱️ ${ev.dateTime}`;
    if (codeEl) codeEl.textContent = ticketCode;

    const playerName = (this.app?.playerTracker?.profile?.name) || 'VIP Gost';
    if (playerEl) playerEl.textContent = playerName;

    if (qrBox) {
      qrBox.innerHTML = '';
      if (typeof window.QRCode === 'function') {
        try {
          new window.QRCode(qrBox, {
            text: ticketCode,
            width: 140,
            height: 140,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 0
          });
        } catch (_) {
          qrBox.innerHTML = `<div style="font-size:2rem; padding: 20px 0;">🏁<br><strong>${ticketCode}</strong></div>`;
        }
      } else {
        qrBox.innerHTML = `<div style="font-size:2rem; padding: 20px 0;">🏁<br><strong>${ticketCode}</strong></div>`;
      }
    }

    fpModal.classList.remove('is-hidden');
    fpModal.classList.add('active');
  }

  closeFastPass() {
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    const fpModal = document.getElementById('event-fastpass-modal');
    if (fpModal) {
      fpModal.classList.remove('active');
      fpModal.classList.add('is-hidden');
    }
  }

  updateSpotlightBar() {
    const textEl = document.getElementById('spotlight-event-text');
    if (!textEl) return;
    const nextEvent = this.events[0];
    if (nextEvent) {
      textEl.textContent = `${nextEvent.dateTime} @ ${nextEvent.venueName.split('(')[0].trim()} (Fond: 50.000 ZLT)`;
    }
  }
}

window.ClubEventsManager = ClubEventsManager;
