/**
 * Grand Slot Club - The Vault Crawler (Solo Roguelike Dungeon Engine)
 * Slay-the-Spire style floor progression with turn-based slot combat,
 * permanent Talent Tree progression, loadout items for Battle Royale,
 * and automated 48-hour physical QR voucher generation for club visits.
 */

class VaultCrawler {
  constructor(wallet, lobby) {
    this.wallet = wallet;
    this.lobby = lobby;

    this.STORAGE_KEY = 'gsc_vault_crawler_v1';
    this.TALENTS_KEY = 'gsc_vault_talents_v1';
    this.INVENTORY_KEY = 'gsc_vault_inventory_v1';

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

    this.currentEnemy = null;
    this.isCombatActive = false;

    // Load persistent upgrades and inventory
    this.loadTalents();
    this.loadInventory();
    this.loadState();

    // Floor definitions & Enemies
    this.FLOOR_CONFIG = [
      {
        floor: 1,
        name: 'Sprat 1: Predvorje & Straža',
        desc: 'Prizemlje kazina sa laserskim senzorima i osnovnim obezbeđenjem.',
        enemy: { name: 'Stražar Predvorja', maxHp: 300, attack: 10, icon: '👮' },
        milestoneVoucher: null
      },
      {
        floor: 2,
        name: 'Sprat 2: Laserski Koridori',
        desc: 'Automatizovane laserske zamke i patrolni dronovi.',
        enemy: { name: 'Sajber Patrolni Dron', maxHp: 550, attack: 16, icon: '🤖' },
        milestoneVoucher: null
      },
      {
        floor: 3,
        name: 'Sprat 3: Serverska Soba & AI Brava',
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
        desc: 'Zlatni koridor sa elitnim privatnim obezbeđenjem.',
        enemy: { name: 'Elitni Komandir Obezbeđenja', maxHp: 1350, attack: 32, icon: '💂' },
        milestoneVoucher: null
      },
      {
        floor: 5,
        name: 'Sprat 5: Glavni Sef Pit Bossa',
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
      }
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        floor: this.floor,
        nodeIndex: this.nodeIndex,
        vaultKeys: this.vaultKeys,
        playerHp: this.playerHp
      }));
    } catch (e) {}
  }

  initDOM() {
    this.stageView = document.getElementById('vault-crawler-view');
    this.slotStage = document.querySelector('.slot-stage-scaler');

    this.floorTitleEl = document.getElementById('vault-floor-title');
    this.floorSubEl = document.getElementById('vault-floor-sub');
    this.keysValEl = document.getElementById('vault-keys-val');

    this.playerHpBar = document.getElementById('vault-player-hp-fill');
    this.playerHpVal = document.getElementById('vault-player-hp-val');
    this.playerShieldBar = document.getElementById('vault-player-shield-fill');
    this.playerShieldVal = document.getElementById('vault-player-shield-val');

    this.enemyNameEl = document.getElementById('vault-enemy-name');
    this.enemyHpBar = document.getElementById('vault-enemy-hp-fill');
    this.enemyHpVal = document.getElementById('vault-enemy-hp-val');
    this.combatLogEl = document.getElementById('vault-combat-log');

    // Bottom action buttons
    const btnTalents = document.getElementById('btn-vault-talents');
    if (btnTalents) {
      btnTalents.addEventListener('click', () => this.openTalentsModal());
    }

    const btnResetRun = document.getElementById('btn-vault-reset-run');
    if (btnResetRun) {
      btnResetRun.addEventListener('click', () => {
        if (confirm('Želite li da započnete novu provalu od Sprata 1? Sakupljeni ključevi i talenat-drvo se zadržavaju.')) {
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
    this.renderNodes();
    this.updateHUD();
  }

  renderNodes() {
    const mapStrip = document.getElementById('vault-map-nodes');
    if (!mapStrip) return;

    const icons = ['🚪', '📦', '⚠️', '💎', '👑'];
    mapStrip.innerHTML = icons.map((ic, idx) => {
      const isCleared = (idx < this.nodeIndex);
      const isActive = (idx === this.nodeIndex);
      return `
        <div class="vault-node ${isActive ? 'active' : ''} ${isCleared ? 'cleared' : ''}" title="Soba ${idx + 1}">
          <span class="vault-node-icon">${isCleared ? '✓' : ic}</span>
          <span class="vault-node-lbl">Soba ${idx + 1}</span>
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
  }

  /**
   * Hook called after every spin on the slot reels
   * @param {number} winAmount - Payout won on the spin
   * @param {Array} symbols - Reel symbols landed
   */
  handleSpinResult(winAmount, symbols = []) {
    if (!this.isActive || !this.isCombatActive || !this.currentEnemy) return;

    // 1. Calculate player attack damage (Payout * Damage Multiplier)
    let damage = Math.round(winAmount * 1.5);
    if (damage <= 0) {
      // Small chip damage on near misses
      damage = 15;
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
    }
    this.empCharge = Math.min(100, this.empCharge + empGain);

    // Apply damage to enemy
    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);

    if (this.currentEnemy.hp <= 0) {
      // Enemy defeated!
      this.handleEnemyDefeated();
      return;
    }

    // 2. Enemy counter-attacks!
    let enemyDmg = this.currentEnemy.attack;
    if (this.empCharge >= 100) {
      // EMP stun!
      this.empCharge = 0;
      this.setLog(`⚡ EMP ŠOK! Neprijatelj je ošamućen i preskače potez! Naneo si -${damage} štete!`);
    } else {
      // Absorb with shield first
      if (this.playerShield > 0) {
        if (this.playerShield >= enemyDmg) {
          this.playerShield -= enemyDmg;
          enemyDmg = 0;
        } else {
          enemyDmg -= this.playerShield;
          this.playerShield = 0;
        }
      }
      this.playerHp = Math.max(0, this.playerHp - enemyDmg);
      this.setLog(`⚔️ Udarac: -${damage} HP neprijatelju! ${this.currentEnemy.name} uzvraća za -${this.currentEnemy.attack} štete!`);
    }

    this.updateHUD();

    if (this.playerHp <= 0) {
      this.handlePlayerDefeated();
    }
  }

  handleEnemyDefeated() {
    this.isCombatActive = false;
    const keysWon = Math.floor(Math.random() * 3) + 2;
    this.vaultKeys += keysWon;

    // Loot drops
    if (Math.random() < 0.45) {
      this.inventory.kevlarShields += 1;
      this.saveInventory();
    }

    this.saveState();
    this.setLog(`💥 POBEDA! ${this.currentEnemy.name} je savladan! Osvojeno +${keysWon} Ključa Trezora!`);
    this.updateHUD();

    setTimeout(() => {
      this.advanceNode();
    }, 1800);
  }

  advanceNode() {
    this.nodeIndex++;
    if (this.nodeIndex >= 5) {
      // Floor cleared!
      this.handleFloorCleared();
    } else {
      // Next room on same floor
      this.initCurrentFloor();
    }
  }

  handleFloorCleared() {
    const cfg = this.FLOOR_CONFIG[this.floor - 1];
    
    // Check if floor awards a physical QR voucher!
    if (cfg && cfg.milestoneVoucher) {
      this.awardMilestoneVoucher(cfg.milestoneVoucher);
    }

    if (this.floor >= this.maxFloors) {
      alert('🏆 ČESTITAMO! Opljačkan je i otključan kompletni Glavni Sef Grand Slot Cluba! Svi spratovi su uspešno pređeni!');
      this.resetRun();
    } else {
      this.floor++;
      this.nodeIndex = 0;
      this.playerHp = this.playerMaxHp;
      this.saveState();
      alert(`🎉 SPRAT ${this.floor - 1} OČIŠĆEN! Otvara se prolaz ka Spratu ${this.floor}: ${this.FLOOR_CONFIG[this.floor - 1].name}!`);
      this.initCurrentFloor();
    }
  }

  async awardMilestoneVoucher(vInfo) {
    const code = 'GSC-VLT-' + Math.floor(1000 + Math.random() * 9000);
    const voucherPayload = {
      voucherCode: code,
      title: vInfo.title,
      description: vInfo.desc,
      rewardType: vInfo.rewardType,
      rewardValue: vInfo.rewardVal,
      location: 'Grand Slot Club (Bilo kojih 20 lokala)',
      expiresInHours: 48
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
    } catch (e) {
      // Offline fallback
    }

    // Trigger visual voucher modal celebration
    if (window.slotApp && typeof window.slotApp.showVoucherTicket === 'function') {
      window.slotApp.showVoucherTicket({
        voucher_code: code,
        title: vInfo.title,
        reward_value: vInfo.rewardVal,
        expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
      });
    } else {
      alert(`🎁 OTKLJUČAN FIZIČKI VAUČER!\n${vInfo.title}\nKod: ${code}\nPokažite ga na šanku bilo kog Grand Slot lokala u roku od 48 sati!`);
    }
  }

  handlePlayerDefeated() {
    this.isCombatActive = false;
    this.setLog('💀 Obezbeđenje te je savladalo! Provala je propala, ali sakupljeni ključevi su sačuvani.');
    this.updateHUD();

    setTimeout(() => {
      alert('Obezbeđenje te je izbacilo iz trezora! Iskoristi sakupljene Ključeve za trajne talente i pokušaj ponovo!');
      this.resetRun();
    }, 1500);
  }

  resetRun() {
    this.floor = 1;
    this.nodeIndex = 0;
    this.playerHp = this.playerMaxHp;
    this.playerShield = this.talents.armorPlating * 15;
    this.saveState();
    this.initCurrentFloor();
  }

  openTalentsModal() {
    const costWild = (this.talents.wildLuck + 1) * 5;
    const costArmor = (this.talents.armorPlating + 1) * 4;
    const costMagnet = (this.talents.goldMagnet + 1) * 3;

    const msg = `
🏛️ TREZOR TALENT TREE (Trajna Progresija)
Raspoloživo: ${this.vaultKeys} Ključeva Trezora

1. Hakerski Prsti (Nivo ${this.talents.wildLuck}/5): +${(this.talents.wildLuck + 1) * 5}% šansa za Wild
   Cena: ${costWild} ključeva

2. Kevlar Pancir (Nivo ${this.talents.armorPlating}/5): +${(this.talents.armorPlating + 1) * 15} početni štit
   Cena: ${costArmor} ključeva

3. Zlatni Magnet (Nivo ${this.talents.goldMagnet}/5): +${(this.talents.goldMagnet + 1) * 10}% ZLT plen
   Cena: ${costMagnet} ključeva

Izaberite opciju (1, 2 ili 3) za nadogradnju:
    `.trim();

    const choice = prompt(msg);
    if (choice === '1') {
      if (this.vaultKeys >= costWild && this.talents.wildLuck < 5) {
        this.vaultKeys -= costWild;
        this.talents.wildLuck++;
        this.saveTalents();
        this.saveState();
        alert('✓ Nadograđeni Hakerski Prsti!');
      } else {
        alert('Nemate dovoljno ključeva ili je nivo maksimalan.');
      }
    } else if (choice === '2') {
      if (this.vaultKeys >= costArmor && this.talents.armorPlating < 5) {
        this.vaultKeys -= costArmor;
        this.talents.armorPlating++;
        this.saveTalents();
        this.saveState();
        alert('✓ Nadograđen Kevlar Pancir!');
      } else {
        alert('Nemate dovoljno ključeva ili je nivo maksimalan.');
      }
    } else if (choice === '3') {
      if (this.vaultKeys >= costMagnet && this.talents.goldMagnet < 5) {
        this.vaultKeys -= costMagnet;
        this.talents.goldMagnet++;
        this.saveTalents();
        this.saveState();
        alert('✓ Nadograđen Zlatni Magnet!');
      } else {
        alert('Nemate dovoljno ključeva ili je nivo maksimalan.');
      }
    }
    this.updateHUD();
  }
}

window.VaultCrawler = VaultCrawler;
