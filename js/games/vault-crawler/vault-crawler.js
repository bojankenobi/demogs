/**
 * Grand Slot Club - The Vault Crawler (Solo Roguelike Dungeon Engine)
 * Slay-the-Spire style floor progression with turn-based slot combat,
 * Heist Tower visual roadmap, floating combat FX, Talent Tree modal,
 * and Vault Raider Leaderboard (Rang Lista).
 */

class VaultCrawler {
  constructor(wallet, lobby) {
    this.wallet = wallet;
    this.lobby = lobby;

    this.STORAGE_KEY = 'gsc_vault_crawler_v1';
    this.TALENTS_KEY = 'gsc_vault_talents_v1';
    this.INVENTORY_KEY = 'gsc_vault_inventory_v1';
    this.LEADERBOARD_KEY = 'gsc_vault_leaderboard_v1';

    // State
    this.isActive = false;
    this.floor = 1;
    this.nodeIndex = 0;
    this.maxFloors = 5;

    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.playerShield = 0;
    this.empCharge = 0; // 0 to 100%
    this.vaultKeys = 0;
    this.totalLootZlt = 0;

    this.currentEnemy = null;
    this.isCombatActive = false;

    // Load persistent upgrades and inventory
    this.loadTalents();
    this.loadInventory();
    this.loadState();
    this.initLeaderboardData();

    // Floor definitions & Enemies
    this.FLOOR_CONFIG = [
      {
        floor: 1,
        name: 'Sprat 1: Predvorje & Straža',
        shortName: 'Predvorje',
        desc: 'Prizemlje kazina sa laserskim senzorima i osnovnim obezbeđenjem.',
        enemy: { name: 'Stražar Predvorja', maxHp: 300, attack: 10, icon: '👮' },
        milestoneVoucher: null
      },
      {
        floor: 2,
        name: 'Sprat 2: Laserski Koridori',
        shortName: 'Laseri',
        desc: 'Automatizovane laserske zamke i patrolni dronovi.',
        enemy: { name: 'Sajber Patrolni Dron', maxHp: 550, attack: 16, icon: '🤖' },
        milestoneVoucher: null
      },
      {
        floor: 3,
        name: 'Sprat 3: Serverska Soba & AI Brava',
        shortName: 'AI Brava',
        desc: 'Centralni mainframe sa kriptovanim sefom.',
        enemy: { name: 'Sajber Čuvar Trezora', maxHp: 900, attack: 24, icon: '🛡️' },
        milestoneVoucher: {
          title: 'VIP Koktel na Šanku Kluba',
          rewardType: 'drink',
          rewardVal: 500,
          desc: 'Besplatan VIP koktel dobrodošlice na šanku u bilo kom od 20 Grand Slot klubova!'
        }
      },
      {
        floor: 4,
        name: 'Sprat 4: VIP Trezor Visokih Uloga',
        shortName: 'VIP Soba',
        desc: 'Zlatni koridor sa elitnim privatnim obezbeđenjem.',
        enemy: { name: 'Elitni Komandir Obezbeđenja', maxHp: 1350, attack: 32, icon: '💂' },
        milestoneVoucher: null
      },
      {
        floor: 5,
        name: 'Sprat 5: Glavni Sef Pit Bossa',
        shortName: 'Glavni Sef',
        desc: 'Završna dvorana sa dijamantskim sefom Grand Slot Cluba!',
        enemy: { name: 'Pit Boss Glavnog Sefa', maxHp: 2000, attack: 42, icon: '👑' },
        milestoneVoucher: {
          title: 'Zlatni VIP Tiket: 2.000 ZLT + Ulaznica',
          rewardType: 'club_ticket',
          rewardVal: 2000,
          desc: '2.000 ZLT promo kredit za slot aparate + piće + besplatna ulaznica za kazino turnir!'
        }
      }
    ];

    this.initDOM();
  }

  loadTalents() {
    try {
      const raw = localStorage.getItem(this.TALENTS_KEY);
      this.talents = raw ? JSON.parse(raw) : {
        wildLuck: 0,      // +5% wild chance per lvl
        armorPlating: 0,  // +15 starting shield per lvl
        goldMagnet: 0     // +10% ZLT drop per lvl
      };
    } catch (e) {
      this.talents = { wildLuck: 0, armorPlating: 0, goldMagnet: 0 };
    }
  }

  saveTalents() {
    try {
      localStorage.setItem(this.TALENTS_KEY, JSON.stringify(this.talents));
    } catch (e) {}
  }

  loadInventory() {
    try {
      const raw = localStorage.getItem(this.INVENTORY_KEY);
      this.inventory = raw ? JSON.parse(raw) : {
        kevlarShields: 1,  // Protects from 1 Ice Freeze in Battle Royale
        boosterPotions: 1  // +20% points in Battle Royale
      };
    } catch (e) {
      this.inventory = { kevlarShields: 1, boosterPotions: 1 };
    }
  }

  saveInventory() {
    try {
      localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(this.inventory));
    } catch (e) {}
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        this.floor = d.floor || 1;
        this.nodeIndex = d.nodeIndex || 0;
        this.vaultKeys = d.vaultKeys || 0;
        this.playerHp = d.playerHp !== undefined ? d.playerHp : 100;
        this.totalLootZlt = d.totalLootZlt || 0;
      }
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        floor: this.floor,
        nodeIndex: this.nodeIndex,
        vaultKeys: this.vaultKeys,
        playerHp: this.playerHp,
        totalLootZlt: this.totalLootZlt
      }));
    } catch (e) {}
  }

  /* ==========================================================================
     Leaderboard Engine (Rang Lista Provalnika)
     ========================================================================== */
  initLeaderboardData() {
    this.DEFAULT_RAIDERS = [
      { id: 'usr_1', rank: 1, name: 'VipGost_Nbgd', floor: 5, floorName: 'Glavni Sef', keys: 48, lootZlt: 18500, prize: '🎟️ VIP Tiket' },
      { id: 'usr_2', rank: 2, name: 'SlotKralj_Zemun', floor: 5, floorName: 'Glavni Sef', keys: 41, lootZlt: 15200, prize: '🎟️ VIP Tiket' },
      { id: 'usr_3', rank: 3, name: 'Dijamant_Dorcol', floor: 4, floorName: 'VIP Soba', keys: 29, lootZlt: 11400, prize: '🍸 Koktel Vaučer' },
      { id: 'usr_4', rank: 4, name: 'Srecko777', floor: 3, floorName: 'AI Brava', keys: 22, lootZlt: 7800, prize: '🍸 Koktel Vaučer' },
      { id: 'usr_5', rank: 5, name: 'Krusevac_Master', floor: 3, floorName: 'AI Brava', keys: 18, lootZlt: 6100, prize: '-' },
      { id: 'usr_6', rank: 6, name: 'Nis_HighRoller', floor: 2, floorName: 'Laseri', keys: 12, lootZlt: 3900, prize: '-' },
      { id: 'usr_7', rank: 7, name: 'Subotica_Queen', floor: 1, floorName: 'Predvorje', keys: 8, lootZlt: 2100, prize: '-' }
    ];

    try {
      const raw = localStorage.getItem(this.LEADERBOARD_KEY);
      this.raiders = raw ? JSON.parse(raw) : [...this.DEFAULT_RAIDERS];
    } catch (e) {
      this.raiders = [...this.DEFAULT_RAIDERS];
    }
  }

  saveLeaderboardData() {
    try {
      localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(this.raiders));
    } catch (e) {}
  }

  getPlayerName() {
    try {
      const p = localStorage.getItem('maxbet_player_profile');
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed.username) return parsed.username;
      }
    } catch (e) {}
    return 'Ti (Provalnik)';
  }

  getSortedLeaderboard() {
    const myName = this.getPlayerName();
    const flCfg = this.FLOOR_CONFIG[this.floor - 1] || this.FLOOR_CONFIG[0];
    let prizeStr = '-';
    if (this.floor >= 5) prizeStr = '🎟️ VIP Tiket 2.000 ZLT';
    else if (this.floor >= 3) prizeStr = '🍸 VIP Koktel';

    const playerEntry = {
      id: 'you_player',
      isYou: true,
      name: myName,
      floor: this.floor,
      floorName: flCfg.shortName,
      keys: this.vaultKeys,
      lootZlt: this.totalLootZlt,
      prize: prizeStr
    };

    // Filter out existing you_player if present
    const others = this.raiders.filter(r => !r.isYou);
    const combined = [playerEntry, ...others];

    // Sort by: Floor desc, then Keys desc, then Loot desc
    combined.sort((a, b) => {
      if (b.floor !== a.floor) return b.floor - a.floor;
      if (b.keys !== a.keys) return b.keys - a.keys;
      return b.lootZlt - a.lootZlt;
    });

    // Assign rank numbers
    combined.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return combined;
  }

  openLeaderboardModal() {
    const modal = document.getElementById('vault-leaderboard-modal');
    if (!modal) return;

    this.renderLeaderboard();
    modal.classList.add('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  closeLeaderboardModal() {
    const modal = document.getElementById('vault-leaderboard-modal');
    if (modal) modal.classList.remove('active');
  }

  renderLeaderboard() {
    const listEl = document.getElementById('vault-raiders-list');
    const myRankPill = document.getElementById('vault-my-rank-pill');
    const myRankName = document.getElementById('vault-my-rank-name');
    const myRankStats = document.getElementById('vault-my-rank-stats');

    const sorted = this.getSortedLeaderboard();
    const myEntry = sorted.find(r => r.isYou);

    if (myEntry) {
      if (myRankPill) myRankPill.textContent = `#${myEntry.rank}`;
      if (myRankName) myRankName.textContent = `${myEntry.name} (Tvoj Profil)`;
      if (myRankStats) {
        myRankStats.textContent = `Sprat ${myEntry.floor} (${myEntry.floorName}) • ${myEntry.keys} Ključeva • ${myEntry.lootZlt.toLocaleString()} ZLT Plen`;
      }
    }

    if (listEl) {
      listEl.innerHTML = sorted.map(item => {
        let medal = `#${item.rank}`;
        if (item.rank === 1) medal = '🥇 #1';
        else if (item.rank === 2) medal = '🥈 #2';
        else if (item.rank === 3) medal = '🥉 #3';

        return `
          <div class="vault-raider-row ${item.isYou ? 'you' : ''}">
            <div class="raider-rank-name">
              <span>${medal}</span>
              <span>${item.name}</span>
            </div>
            <div class="raider-fl">F${item.floor} (${item.floorName})</div>
            <div class="raider-keys">🗝️ ${item.keys}</div>
            <div class="raider-prize">${item.prize}</div>
          </div>
        `;
      }).join('');
    }
  }

  /* ==========================================================================
     DOM & Lifecycle
     ========================================================================== */
  initDOM() {
    this.stageView = document.getElementById('vault-crawler-view');
    this.slotStage = document.querySelector('.slot-stage-scaler');

    this.floorTitleEl = document.getElementById('vault-floor-title');
    this.floorSubEl = document.getElementById('vault-floor-sub');
    this.keysValEl = document.getElementById('vault-keys-val');
    this.heistPctEl = document.getElementById('vault-heist-pct');
    this.heistProgressFillEl = document.getElementById('vault-heist-progress-fill');
    this.fxOverlay = document.getElementById('vault-fx-overlay');

    this.playerCard = document.getElementById('vault-player-card');
    this.playerHpBar = document.getElementById('vault-player-hp-fill');
    this.playerHpVal = document.getElementById('vault-player-hp-val');
    this.playerShieldBar = document.getElementById('vault-player-shield-fill');
    this.playerShieldVal = document.getElementById('vault-player-shield-val');

    this.enemyCard = document.getElementById('vault-enemy-card');
    this.enemyNameEl = document.getElementById('vault-enemy-name');
    this.enemyHpBar = document.getElementById('vault-enemy-hp-fill');
    this.enemyHpVal = document.getElementById('vault-enemy-hp-val');
    this.combatLogEl = document.getElementById('vault-combat-log');

    // Bottom action buttons
    const btnLeaderboard = document.getElementById('btn-vault-leaderboard');
    if (btnLeaderboard) {
      btnLeaderboard.addEventListener('click', () => this.openLeaderboardModal());
    }

    const btnCloseLeaderboard = document.getElementById('btn-close-vault-leaderboard');
    if (btnCloseLeaderboard) {
      btnCloseLeaderboard.addEventListener('click', () => this.closeLeaderboardModal());
    }
    const btnDoneLeaderboard = document.getElementById('btn-done-vault-leaderboard');
    if (btnDoneLeaderboard) {
      btnDoneLeaderboard.addEventListener('click', () => this.closeLeaderboardModal());
    }

    const btnTalents = document.getElementById('btn-vault-talents');
    if (btnTalents) {
      btnTalents.addEventListener('click', () => this.openTalentsModal());
    }
    const btnCloseTalents = document.getElementById('btn-close-vault-talents');
    if (btnCloseTalents) {
      btnCloseTalents.addEventListener('click', () => this.closeTalentsModal());
    }
    const btnDoneTalents = document.getElementById('btn-done-vault-talents');
    if (btnDoneTalents) {
      btnDoneTalents.addEventListener('click', () => this.closeTalentsModal());
    }

    // Talent Upgrade Buttons
    const btnUpWild = document.getElementById('btn-up-talent-wild');
    if (btnUpWild) {
      btnUpWild.addEventListener('click', () => this.upgradeTalent('wildLuck'));
    }
    const btnUpArmor = document.getElementById('btn-up-talent-armor');
    if (btnUpArmor) {
      btnUpArmor.addEventListener('click', () => this.upgradeTalent('armorPlating'));
    }
    const btnUpMagnet = document.getElementById('btn-up-talent-magnet');
    if (btnUpMagnet) {
      btnUpMagnet.addEventListener('click', () => this.upgradeTalent('goldMagnet'));
    }

    // Victory Continue Button
    const btnVictoryCont = document.getElementById('btn-vault-victory-continue');
    if (btnVictoryCont) {
      btnVictoryCont.addEventListener('click', () => this.onVictoryContinue());
    }

    const btnResetRun = document.getElementById('btn-vault-reset-run');
    if (btnResetRun) {
      btnResetRun.addEventListener('click', () => {
        if (confirm('Želite li da započnete novu provalu od Sprata 1? Sakupljeni ključevi, plen i talenat-drvo se zadržavaju.')) {
          this.resetRun();
        }
      });
    }
  }

  mount() {
    this.isActive = true;
    if (this.stageView) this.stageView.style.display = 'flex';
    if (this.slotStage) this.slotStage.style.display = 'block';

    // Start or resume floor
    this.initCurrentFloor();
    this.updateHUD();
  }

  unmount() {
    this.isActive = false;
    if (this.stageView) this.stageView.style.display = 'none';
    this.closeLeaderboardModal();
    this.closeTalentsModal();
    this.closeVictoryModal();
  }

  initCurrentFloor() {
    const cfg = this.FLOOR_CONFIG[this.floor - 1] || this.FLOOR_CONFIG[0];
    
    // Apply starting shield from talents
    this.playerShield = this.talents.armorPlating * 15;
    if (this.playerHp <= 0) this.playerHp = this.playerMaxHp;

    this.currentEnemy = {
      name: cfg.enemy.name,
      icon: cfg.enemy.icon,
      hp: cfg.enemy.maxHp,
      maxHp: cfg.enemy.maxHp,
      attack: cfg.enemy.attack
    };

    this.isCombatActive = true;
    this.setLog(`🚨 Alarm aktiviran! ${this.currentEnemy.icon} ${this.currentEnemy.name} ti stoji na putu! Zavrti slot za napad!`);
    this.renderTowerFloors();
    this.renderNodes();
    this.updateHUD();
  }

  renderTowerFloors() {
    const towerGrid = document.getElementById('vault-tower-floors');
    if (!towerGrid) return;

    towerGrid.innerHTML = this.FLOOR_CONFIG.map((cfg, idx) => {
      const flNum = cfg.floor;
      const isCleared = (flNum < this.floor);
      const isActive = (flNum === this.floor);
      const isLocked = (flNum > this.floor);

      let statusBadge = '🔒 Zaključano';
      let icon = cfg.enemy.icon;
      if (isCleared) {
        statusBadge = '✓ Rešeno';
        icon = '🔓';
      } else if (isActive) {
        statusBadge = `Soba ${this.nodeIndex + 1}/5`;
      }

      if (flNum === 3) icon += ' 🍸';
      if (flNum === 5) icon += ' 👑';

      return `
        <div class="tower-floor-item ${isCleared ? 'cleared' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" 
             title="${cfg.name}" data-floor="${flNum}">
          <span class="tower-fl-num">Sprat ${flNum}</span>
          <span class="tower-fl-icon">${icon}</span>
          <span class="tower-fl-badge">${statusBadge}</span>
        </div>
      `;
    }).join('');

    // Attach click for floor inspection info
    towerGrid.querySelectorAll('.tower-floor-item').forEach(item => {
      item.addEventListener('click', () => {
        const fl = parseInt(item.getAttribute('data-floor'), 10);
        const cfg = this.FLOOR_CONFIG[fl - 1];
        if (cfg) {
          const perk = cfg.milestoneVoucher ? `\n🎁 Glavna nagrada: ${cfg.milestoneVoucher.title}` : '';
          this.setLog(`ℹ️ ${cfg.name}: ${cfg.desc}${perk}`);
        }
      });
    });
  }

  renderNodes() {
    const mapStrip = document.getElementById('vault-map-nodes');
    if (!mapStrip) return;

    const icons = ['🚪', '📦', '⚠️', '💎', '👑'];
    const labels = ['Ulaz', 'Sanduk', 'Zamka', 'Terminal', 'Boss'];

    mapStrip.innerHTML = icons.map((ic, idx) => {
      const isCleared = (idx < this.nodeIndex);
      const isActive = (idx === this.nodeIndex);
      return `
        <div class="vault-node ${isActive ? 'active' : ''} ${isCleared ? 'cleared' : ''}" title="${labels[idx]}">
          <span class="vault-node-icon">${isCleared ? '✓' : ic}</span>
          <span class="vault-node-lbl">${labels[idx]}</span>
        </div>
      `;
    }).join('');
  }

  setLog(msg) {
    if (this.combatLogEl) {
      this.combatLogEl.textContent = msg;
    }
  }

  updateHUD() {
    const cfg = this.FLOOR_CONFIG[this.floor - 1] || this.FLOOR_CONFIG[0];
    if (this.floorTitleEl) this.floorTitleEl.textContent = cfg.name;
    if (this.floorSubEl) this.floorSubEl.textContent = `Soba ${this.nodeIndex + 1}/5 • ${cfg.desc}`;
    if (this.keysValEl) this.keysValEl.textContent = `${this.vaultKeys} Ključeva`;

    // Heist progress percentage calculation
    const overallPct = Math.min(100, Math.round(((this.floor - 1) * 20) + (this.nodeIndex / 5) * 20));
    if (this.heistPctEl) this.heistPctEl.textContent = `${overallPct}% Provaljeno`;
    if (this.heistProgressFillEl) this.heistProgressFillEl.style.width = `${overallPct}%`;

    // Player Bars
    if (this.playerHpBar) {
      const pct = Math.max(0, Math.min(100, (this.playerHp / this.playerMaxHp) * 100));
      this.playerHpBar.style.width = `${pct}%`;
    }
    if (this.playerHpVal) this.playerHpVal.textContent = `${this.playerHp}/${this.playerMaxHp}`;

    if (this.playerShieldBar) {
      const shieldPct = Math.max(0, Math.min(100, (this.playerShield / 60) * 100));
      this.playerShieldBar.style.width = `${shieldPct}%`;
    }
    if (this.playerShieldVal) this.playerShieldVal.textContent = `+${this.playerShield}`;

    // Enemy Bars
    if (this.enemyNameEl && this.currentEnemy) {
      this.enemyNameEl.textContent = `${this.currentEnemy.icon} ${this.currentEnemy.name}`;
    }
    if (this.enemyHpBar && this.currentEnemy) {
      const epct = Math.max(0, Math.min(100, (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100));
      this.enemyHpBar.style.width = `${epct}%`;
    }
    if (this.enemyHpVal && this.currentEnemy) {
      this.enemyHpVal.textContent = `${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
    }

    this.renderTowerFloors();
  }

  /* ==========================================================================
     Floating Numbers & Visual Feedback Effects
     ========================================================================== */
  spawnFloatingNumber(text, type = 'dmg', isEnemy = true) {
    if (!this.fxOverlay) return;

    const el = document.createElement('div');
    el.className = `vault-floating-num ${type}`;
    el.textContent = text;

    // Anchor position based on enemy card or player card
    const targetCard = isEnemy ? this.enemyCard : this.playerCard;
    if (targetCard && targetCard.offsetParent) {
      const rect = targetCard.getBoundingClientRect();
      const parentRect = this.fxOverlay.getBoundingClientRect();
      const left = rect.left - parentRect.left + (rect.width / 2) + (Math.random() * 20 - 10);
      const top = rect.top - parentRect.top + (rect.height / 3);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    } else {
      el.style.left = isEnemy ? '70%' : '30%';
      el.style.top = '120px';
    }

    this.fxOverlay.appendChild(el);
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
  }

  triggerHitShake(isEnemy = true) {
    const card = isEnemy ? this.enemyCard : this.playerCard;
    if (card) {
      card.classList.remove('combat-hit-shake');
      void card.offsetWidth; // Trigger reflow
      card.classList.add('combat-hit-shake');
      setTimeout(() => card.classList.remove('combat-hit-shake'), 420);
    }
  }

  /* ==========================================================================
     Spin & Combat Turn Resolution
     ========================================================================== */
  handleSpinResult(winAmount, symbols = []) {
    if (!this.isActive || !this.isCombatActive || !this.currentEnemy) return;

    // 1. Calculate player attack damage (Payout * Damage Multiplier)
    let damage = Math.round(winAmount * 1.5);
    const isCrit = (winAmount >= 100);
    if (damage <= 0) {
      damage = 18; // Chip damage
    }

    // Check for defensive symbols (Diamonds/Crowns add shield)
    let shieldGain = 0;
    let empGain = 10;
    symbols.forEach(sym => {
      if (sym && (sym.id === 'crown' || sym.id === 'diamond')) shieldGain += 8;
      if (sym && (sym.id === 'flower' || sym.id === 'wheel')) empGain += 20;
    });

    if (shieldGain > 0) {
      this.playerShield = Math.min(60, this.playerShield + shieldGain);
      this.spawnFloatingNumber(`+${shieldGain} ŠTIT 🛡️`, 'shield', false);
    }
    this.empCharge = Math.min(100, this.empCharge + empGain);

    // Apply damage to enemy with visual feedback
    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);
    this.spawnFloatingNumber(isCrit ? `CRITICAL -${damage} 💥` : `-${damage} HP`, isCrit ? 'crit' : 'dmg', true);
    this.triggerHitShake(true);

    if (this.currentEnemy.hp <= 0) {
      // Enemy defeated!
      this.handleEnemyDefeated(damage);
      return;
    }

    // 2. Enemy counter-attacks!
    let enemyDmg = this.currentEnemy.attack;
    if (this.empCharge >= 100) {
      // EMP stun!
      this.empCharge = 0;
      this.spawnFloatingNumber('⚡ EMP STUN!', 'emp', true);
      this.setLog(`⚡ EMP ŠOK! Neprijatelj je ošamućen i preskače potez! Naneo si -${damage} štete!`);
    } else {
      // Absorb with shield first
      if (this.playerShield > 0) {
        if (this.playerShield >= enemyDmg) {
          this.playerShield -= enemyDmg;
          enemyDmg = 0;
          this.spawnFloatingNumber('BLOKIRANO 🛡️', 'shield', false);
        } else {
          enemyDmg -= this.playerShield;
          this.playerShield = 0;
        }
      }
      if (enemyDmg > 0) {
        this.playerHp = Math.max(0, this.playerHp - enemyDmg);
        this.spawnFloatingNumber(`-${enemyDmg} HP`, 'dmg', false);
        this.triggerHitShake(false);
      }
      this.setLog(`⚔️ Udarac: -${damage} HP neprijatelju! ${this.currentEnemy.name} uzvraća za -${this.currentEnemy.attack} štete!`);
    }

    this.updateHUD();

    if (this.playerHp <= 0) {
      this.handlePlayerDefeated();
    }
  }

  handleEnemyDefeated(lastDamage) {
    this.isCombatActive = false;

    // Key rewards boosted by Gold Magnet talent
    const magnetBoost = 1 + (this.talents.goldMagnet * 0.1);
    const baseKeys = Math.floor(Math.random() * 3) + 2;
    const keysWon = Math.round(baseKeys * magnetBoost);
    this.vaultKeys += keysWon;

    // ZLT Loot awarded
    const lootWon = Math.round((Math.floor(Math.random() * 200) + 150) * magnetBoost);
    this.totalLootZlt += lootWon;
    if (this.wallet && typeof this.wallet.addFictionalRsd === 'function') {
      this.wallet.addFictionalRsd(lootWon);
    }

    // Inventory Loot drops (Kevlar shield or Booster potion)
    let itemDropName = null;
    if (Math.random() < 0.5) {
      this.inventory.kevlarShields += 1;
      itemDropName = '🛡️ 1x Kevlar Pancir (za Battle Royale)';
      this.saveInventory();
    }

    this.saveState();
    this.updateHUD();

    // Check if this room completes the floor
    const isFloorBoss = (this.nodeIndex >= 4);
    const cfg = this.FLOOR_CONFIG[this.floor - 1];

    if (window.slotAudio && window.slotAudio.playWin) {
      window.slotAudio.playWin();
    }

    // Open Visual Victory Modal (No alert!)
    setTimeout(() => {
      this.openVictoryModal({
        isFloorBoss,
        floor: this.floor,
        nodeIndex: this.nodeIndex + 1,
        enemyName: this.currentEnemy.name,
        keysWon,
        lootWon,
        itemDrop: itemDropName,
        milestoneVoucher: isFloorBoss ? cfg.milestoneVoucher : null
      });
    }, 450);
  }

  openVictoryModal(payload) {
    this.pendingVictoryPayload = payload;
    const modal = document.getElementById('vault-victory-modal');
    if (!modal) return;

    const titleEl = document.getElementById('vault-victory-title');
    const subEl = document.getElementById('vault-victory-sub');
    const lootBox = document.getElementById('vault-victory-loot');
    const iconEl = document.getElementById('vault-victory-icon');

    if (payload.isFloorBoss) {
      if (titleEl) titleEl.textContent = `🏆 SPRAT ${payload.floor} OČIŠĆEN!`;
      if (subEl) subEl.textContent = `Boss "${payload.enemyName}" je poražen! Sef je otvoren!`;
      if (iconEl) iconEl.textContent = '👑';
    } else {
      if (titleEl) titleEl.textContent = `🔓 SOBA ${payload.nodeIndex} OBIJENA!`;
      if (subEl) subEl.textContent = `Prepreka je savladana! Sef je provaljen!`;
      if (iconEl) iconEl.textContent = '💎';
    }

    if (lootBox) {
      let html = `
        <div class="loot-item-row">
          <span>🗝️ Ključevi Trezora:</span>
          <span style="color: #fbbf24;">+${payload.keysWon} Ključa</span>
        </div>
        <div class="loot-item-row">
          <span>💰 ZLT Plen:</span>
          <span style="color: #4ade80;">+${payload.lootWon} ZLT</span>
        </div>
      `;

      if (payload.itemDrop) {
        html += `
          <div class="loot-item-row" style="color: #38bdf8;">
            <span>🎒 Predmet:</span>
            <span>${payload.itemDrop}</span>
          </div>
        `;
      }

      if (payload.milestoneVoucher) {
        html += `
          <div class="loot-voucher-alert">
            🎟️ ČESTITAMO! OTKLJUČAN FIZIČKI VAUČER:<br>
            <strong>${payload.milestoneVoucher.title}</strong><br>
            <span style="font-size: 0.72rem; color: #fff;">Važi 48h u bilo kom od 20 Grand Slot klubova!</span>
          </div>
        `;
      }

      lootBox.innerHTML = html;
    }

    modal.classList.add('active');
  }

  closeVictoryModal() {
    const modal = document.getElementById('vault-victory-modal');
    if (modal) modal.classList.remove('active');
  }

  onVictoryContinue() {
    this.closeVictoryModal();

    if (this.pendingVictoryPayload && this.pendingVictoryPayload.isFloorBoss) {
      // Floor milestone voucher issuance
      const cfg = this.FLOOR_CONFIG[this.floor - 1];
      if (cfg && cfg.milestoneVoucher) {
        this.awardMilestoneVoucher(cfg.milestoneVoucher);
      }

      if (this.floor >= this.maxFloors) {
        this.setLog('👑 Opljačkao si celokupni Glavni Sef Grand Slot Cluba! Čestitamo!');
        this.resetRun();
      } else {
        this.floor++;
        this.nodeIndex = 0;
        this.playerHp = this.playerMaxHp;
        this.saveState();
        this.initCurrentFloor();
      }
    } else {
      this.nodeIndex++;
      this.saveState();
      this.initCurrentFloor();
    }
  }

  async awardMilestoneVoucher(vInfo) {
    const code = 'GSC-VLT-' + Math.floor(1000 + Math.random() * 9000);
    const voucherPayload = {
      voucher_code: code,
      title: vInfo.title,
      description: vInfo.desc,
      reward_type: vInfo.rewardType,
      reward_value: vInfo.rewardVal,
      location: 'Grand Slot Club (20 lokala)',
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    };

    // Attempt to register with backend API or local storage
    try {
      await fetch('/api/vouchers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: localStorage.getItem('gsc_player_id') || 'gsc_vip_crawler',
          voucherCode: code,
          title: vInfo.title,
          rewardValue: vInfo.rewardVal,
          rewardType: vInfo.rewardType,
          location: 'Grand Slot Club (20 lokala)'
        })
      });
    } catch (e) {}

    // Trigger visual voucher modal celebration
    if (window.slotApp && typeof window.slotApp.showVoucherTicket === 'function') {
      window.slotApp.showVoucherTicket(voucherPayload);
    }
  }

  handlePlayerDefeated() {
    this.isCombatActive = false;
    this.setLog('💀 Obezbeđenje te je savladalo! Provala je propala, ali sakupljeni ključevi su sačuvani.');
    this.updateHUD();

    setTimeout(() => {
      this.openVictoryModal({
        isFloorBoss: false,
        floor: this.floor,
        nodeIndex: this.nodeIndex + 1,
        enemyName: 'Obezbeđenje Trezora',
        keysWon: 0,
        lootWon: 0,
        itemDrop: '⚠️ Nema plena. Unapredi talente i pokušaj ponovo!'
      });
      const titleEl = document.getElementById('vault-victory-title');
      const subEl = document.getElementById('vault-victory-sub');
      const iconEl = document.getElementById('vault-victory-icon');
      if (titleEl) titleEl.textContent = '💀 ALARM TE JE UHVATIO!';
      if (subEl) subEl.textContent = 'Obezbeđenje te je izbacilo, ali ključevi i talenat drvo ostaju tvoji!';
      if (iconEl) iconEl.textContent = '🚨';

      this.resetRun();
    }, 1200);
  }

  resetRun() {
    this.floor = 1;
    this.nodeIndex = 0;
    this.playerHp = this.playerMaxHp;
    this.playerShield = this.talents.armorPlating * 15;
    this.saveState();
    this.initCurrentFloor();
  }

  /* ==========================================================================
     Talent Tree Modal (Interactive RPG Upgrades)
     ========================================================================== */
  openTalentsModal() {
    const modal = document.getElementById('vault-talents-modal');
    if (!modal) return;

    this.renderTalentsUI();
    modal.classList.add('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  closeTalentsModal() {
    const modal = document.getElementById('vault-talents-modal');
    if (modal) modal.classList.remove('active');
  }

  renderTalentsUI() {
    const keysValEl = document.getElementById('vault-modal-keys-val');
    if (keysValEl) keysValEl.textContent = this.vaultKeys;

    const costWild = (this.talents.wildLuck + 1) * 5;
    const costArmor = (this.talents.armorPlating + 1) * 4;
    const costMagnet = (this.talents.goldMagnet + 1) * 3;

    // Stars & Costs
    const renderStars = (lvl) => '★'.repeat(lvl) + '☆'.repeat(5 - lvl);

    const starsWild = document.getElementById('talent-stars-wild');
    const costWildEl = document.getElementById('talent-cost-wild');
    const btnWild = document.getElementById('btn-up-talent-wild');
    if (starsWild) starsWild.textContent = renderStars(this.talents.wildLuck);
    if (costWildEl) costWildEl.textContent = this.talents.wildLuck >= 5 ? 'MAX' : `${costWild} 🗝️`;
    if (btnWild) btnWild.disabled = (this.vaultKeys < costWild || this.talents.wildLuck >= 5);

    const starsArmor = document.getElementById('talent-stars-armor');
    const costArmorEl = document.getElementById('talent-cost-armor');
    const btnArmor = document.getElementById('btn-up-talent-armor');
    if (starsArmor) starsArmor.textContent = renderStars(this.talents.armorPlating);
    if (costArmorEl) costArmorEl.textContent = this.talents.armorPlating >= 5 ? 'MAX' : `${costArmor} 🗝️`;
    if (btnArmor) btnArmor.disabled = (this.vaultKeys < costArmor || this.talents.armorPlating >= 5);

    const starsMagnet = document.getElementById('talent-stars-magnet');
    const costMagnetEl = document.getElementById('talent-cost-magnet');
    const btnMagnet = document.getElementById('btn-up-talent-magnet');
    if (starsMagnet) starsMagnet.textContent = renderStars(this.talents.goldMagnet);
    if (costMagnetEl) costMagnetEl.textContent = this.talents.goldMagnet >= 5 ? 'MAX' : `${costMagnet} 🗝️`;
    if (btnMagnet) btnMagnet.disabled = (this.vaultKeys < costMagnet || this.talents.goldMagnet >= 5);
  }

  upgradeTalent(type) {
    let success = false;
    if (type === 'wildLuck') {
      const cost = (this.talents.wildLuck + 1) * 5;
      if (this.vaultKeys >= cost && this.talents.wildLuck < 5) {
        this.vaultKeys -= cost;
        this.talents.wildLuck++;
        this.saveTalents();
        this.saveState();
        if (window.slotAudio && window.slotAudio.playCoinDrop) window.slotAudio.playCoinDrop();
        success = true;
      }
    } else if (type === 'armorPlating') {
      const cost = (this.talents.armorPlating + 1) * 4;
      if (this.vaultKeys >= cost && this.talents.armorPlating < 5) {
        this.vaultKeys -= cost;
        this.talents.armorPlating++;
        this.playerShield = this.talents.armorPlating * 15;
        this.saveTalents();
        this.saveState();
        if (window.slotAudio && window.slotAudio.playCoinDrop) window.slotAudio.playCoinDrop();
        success = true;
      }
    } else if (type === 'goldMagnet') {
      const cost = (this.talents.goldMagnet + 1) * 3;
      if (this.vaultKeys >= cost && this.talents.goldMagnet < 5) {
        this.vaultKeys -= cost;
        this.talents.goldMagnet++;
        this.saveTalents();
        this.saveState();
        if (window.slotAudio && window.slotAudio.playCoinDrop) window.slotAudio.playCoinDrop();
        success = true;
      }
    }

    this.renderTalentsUI();
    this.updateHUD();
    return success;
  }
}

window.VaultCrawler = VaultCrawler;
