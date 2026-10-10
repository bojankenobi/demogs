/**
 * IGT - Internationalization (i18n) Engine
 * Primary language: Serbian (sr) | Secondary: English (en)
 */
(function() {
  const TRANSLATIONS = {
    sr: {
      brandSub: 'IGT KAZINO',
      leverTitle: 'Povuci ručicu za spin!',
      gameClassic: '1-LINIJA CLASSIC',
      gameRoyal3x3: 'ROYAL 3x3 (5 LINIJA)',
      gameFullFocus: 'ROYAL 3x3 FULL FOCUS',
      gameMines: 'IGT MINES X',
      gameXtension: 'IGT XTENSION LINK',
      gameModeChanged: 'IGRA: {game}',
      linesWin: '{lines} DOBITNIH LINIJA!',
      linesRuleText: 'U <strong>Royal 3x3</strong> igri aktivno je <strong>5 linija</strong> (3 horizontalne + 2 dijagonalne). Dobici na više linija se sabiraju!',
      ready: 'SPREMNI ZA IGRU!',
      spinning: 'VRTENJE U TOKU...',
      tryAgain: 'POKUŠAJTE PONOVO!',
      winPrefix: 'DOBITAK: +',
      egtLobbyTitle: 'IZBOR IGARA',
      egtLobbySub: 'IGT CASINO MULTIGAME',
      egtReturnToGame: 'NAZAD NA IGRU',
      egtActiveTag: 'AKTIVNA IGRA',
      egtSelectTag: 'IGRAJ SADA',
      egtClassicDesc: '1 Centralna Linija • Retro Zlatni Cilindar • Autentična Ručica',
      egtRoyalDesc: '5 Isplatnih Linija • IGT Mines Bonus • Scatter Dijamanti',
      egtFocusDesc: 'Maksimalan Prikaz • 5 Isplatnih Linija • Specijalno za Mobilni Ekran',
      egtMinesDesc: 'Podesiva Mreža & Broj Mina • Multiplier Traka • Instant Isplata',
      egtXtensionDesc: 'Hold & Spin • Širenje Tabele do 8 Redova • 40 Polja IGT Jackpot',
      miniMinesBonusTag: 'BONUS RUNDA',
      miniMinesBonusTitle: '💎 IGT MINES BONUS 💣',
      miniMinesBonusSub: 'OTKRIJTE ZLATNIKE I IZBEGNITE MINE!',
      miniMinesFinished: '💣 MINES BONUS ZAVRŠEN! OSVOJENO: +{amount}',
      miniMinesStart: 'POČETNI BONUS: +{starter} RSD! OTVARAJTE POLJA ILI UZMITE DOBITAK!',
      totalBonusWin: 'TRENUTNI DOBITAK:',
      meterCardsLabel: 'KARTE',
      meterMinesLabel: 'MINE',
      meterCardsLocked: '💎 PUNITE KARTE SPINOVIMA DA OTKLJUČATE!',
      meterMinesLocked: '❇️ MINE SU ZAKLJUČANE! PUNITE TRAKU SPINOVIMA!',
      cardsBonusActivated: '💎 KARTE OTKLJUČANE! ({sec}s)',
      minesBonusActivated: '❇️ IGT MINES OTKLJUČAN! ({sec}s)',
      combo_flower_jackpot: '3x IGT SIMBOL (JACKPOT!)',
      combo_flower_3x: '3x IGT SIMBOL (JACKPOT!)',
      combo_flower_2x: '2x IGT SIMBOL!',
      combo_crown_3x: '3x ZLATNA KRUNA!',
      combo_crown_2x: '2x ZLATNA KRUNA!',
      combo_bar_3x: '3x BAR!',
      combo_bar_2x: '2x BAR!',
      combo_horseshoe_3x: '3x SREĆNA POTKOVICA!',
      combo_horseshoe_2x: '2x SREĆNA POTKOVICA!',
      combo_seven_3x: '3x ZLATNA 7!',
      combo_seven_2x: '2x ZLATNA 7!',
      combo_bell_3x: '3x ZVONO!',
      combo_bell_2x: '2x ZVONO!',
      combo_coin_3x: '3x ZLATNIK!',
      combo_coin_2x: '2x ZLATNIK!',
      combo_diamond_3x: '3x DIJAMANT!',
      combo_diamond_2x: '2x DIJAMANT!',
      combo_flower_bar: 'IGT & BAR KOMBO!',
      freeSpinsWon: '💎 5 BESPLATNIH SPINOVA OSVOJENO! 💎',
      freeSpinsPlusWin: '💎 5 BESPLATNIH SPINOVA + {amount}! 💎',
      freeSpinRemaining: 'BESPLATAN SPIN! Preostalo: ',
      bigWin: '🎰 VELIKI DOBITAK! +',
      notEnoughCredits: 'NEMATE DOVOLJNO KREDITA! Dopunite besplatno.',
      creditsAdded: 'DODATO +{amount} KREDITA!',
      happyHourActive: '🔥 HAPPY HOUR AKTIVAN! x{mult} MNOŽILAC! 🔥',

      credits: 'Krediti',
      bet: 'Ulog',
      win: 'Dobitak',

      addCredits: 'DOPUNA RSD',
      addCreditsTitle: 'Dopunite fiktivne dinare (otvara profil)',
      betLabel: 'ULOG',
      maxBet: 'MAX BET',
      spin: 'SPIN',
      autoSpin: 'AUTO',
      autoSpinOn: 'STOP',
      decreaseBet: 'Smanji ulog',
      increaseBet: 'Povećaj ulog',

      rulesAndPayouts: 'Pravila i Isplate',
      installApp: 'Instaliraj App',
      sound: 'Zvuk',

      paytableTitle: '🏆 TABELA DOBITAKA',
      symFlower: 'IGT Simbol (Jackpot)',
      symCrown: 'Zlatna Kruna',
      symBar: 'BAR Simbol',
      symHorseshoe: 'Srećna Potkovica',
      symSeven: 'Zlatna Sedmica (7)',
      symBell: 'Zlatno Zvono',
      symCoin: 'Zlatnik (Coin)',
      symDiamond: 'Dijamant (Bonus)',
      freeSpinsRuleHeading: '✨ PRAVILA IGRE & BONUSI',
      freeSpinsRuleText: 'Pogodak 3 Dijamanta donosi <strong>5 BESPLATNIH SPINOVA</strong>!',
      instructionsRuleText: 'Možete povući i 3D ručicu sa desne strane za pokretanje valjaka ili pritisnuti taster Space na tastaturi.',
      openAdminPanel: '⚙️ OTVORI ADMIN / OPERATOR PANEL',
      ruleHoldWinTitle: '🔥 HOLD & WIN (IGT RESPINS):',
      ruleHoldWinDesc: 'Kad 3 ili više Zlatnika padnu na bubnjeve, pokreće se bonus sa 3 Respina. Svi novčići ostaju zaključani na tabli. Svaki novi novčić koji padne se takođe zaključava i resetuje broj respina ponovo na 3! Kada popunite svih 9 polja, osvajate maksimalni 💎 DIAMOND JACKPOT!',
      ruleMysteryJpTitle: '🎰 MYSTERY JACKPOT:',
      ruleMysteryJpDesc: 'Svaki spin može nasumično osvojiti progresivni Silver, Gold ili Diamond Jackpot prikazan na vrhu ekrana!',
      ruleCardsTitle: '♠️ KRISTALNI PIK (KARTE):',
      ruleCardsDesc: 'Kada se gornja traka za karte napuni spinovima, Kristalni Pik počinje da svetli i pulsira! Dok svetli, možete ući u igru pogađanja crvene ili crne karte i uvećati dobitak.',

      // Mines In-Game Localization
      minesConfigLabel: 'MINE:',
      minesBetTag: 'ULOG',
      minesBetBtn: 'BET',
      minesNewGameBtn: 'NOVA IGRA',
      minesCashoutBtn: 'ISPLATA',
      minesPickPrompt: 'IZABERITE ULOG I POKRENITE IGRU',
      minesActivePrompt: 'OTVORITE POLJA I IZBEGAVAJTE MINE!',
      minesHitStatus: 'POGODAK! MNOŽILAC: {mult} ({win} RSD)',
      minesAllCleared: '👑 SVA POLJA OČIŠĆENA! OSVOJENO: {win} RSD!',
      minesCashedOut: '💰 ISPLAĆENO: {win} RSD ({mult})',
      minesExploded: '💥 MINA! POKUŠAJTE PONOVO.',
      minesGoldCoin: 'ZLATNIK',
      minesBomb: 'MINA',
      miniPickLabel: 'OTVORI',
      miniHitStatus: 'POGODAK! +{win} RSD ({mult}x)',
      miniMinesAvoided: '👑 SVE MINE IZBEGNUTE! MAKSIMALAN BONUS!',
      miniMinesHitStatus: '💥 MINA! BONUS ZAVRŠEN!',
      miniMinesPrompt: 'OTVARAJTE POLJA ILI UZMITE DOBITAK!',
      miniMinesCashoutLabel: 'UZMI DOBITAK (TAKE WIN)',

      // Adrenaline Pack Keys
      cardsEmblemTitle: 'Kristalni Pik (Karte)',
      gamble: '♠️ KARTE',
      gambleTitle: '♠️ KARTE (CRVENA / CRNA)',
      gambleHistory: 'ISTORIJA:',
      currentGambleWin: 'TRENUTNI DOBITAK:',
      gambleToWin: 'DOBITAK ZA POGODAK:',
      gambleRed: 'CRVENA (RED)',
      gambleBlack: 'CRNA (BLACK)',
      takeWin: '💰 UZMI DOBITAK (TAKE WIN)',
      gambleWon: '🎉 POGODAK! OSVOJENO: {amount}',
      gambleLost: '❌ VIŠE SREĆE DRUGI PUT!',
      holdWinHeading: '🔥 IGT RESPINS (HOLD & WIN) 🔥',
      respinsLeft: 'PREOSTALO RESPINA:',
      hwTotalWin: 'UKUPAN DOBITAK:',
      respinNow: '⚡ POKRENI RESPIN ⚡',
      hwGrandWon: '💥 GRAND JACKPOT! POPUNJENA SVA POLJA! 💥',
      hwFinished: '🏆 HOLD & WIN BONUS ZAVRŠEN! OSVOJENO: +{amount}',
      jackpotWonSilver: '🥈 ČESTITAMO! OSVOJILI STE SILVER JACKPOT: +{amount}! 🥈',
      jackpotWonGold: '🏆 IGT POGODAK! OSVOJILI STE GOLD JACKPOT: +{amount}! 🏆',
      jackpotWonDiamond: '💎 MEGA BANGER! OSVOJILI STE DIAMOND JACKPOT: +{amount}! 💎',

      // PWA Install Keys
      pwaBannerTitle: 'Instalirajte IGT Casino',
      pwaBannerSub: 'Igrajte na punom ekranu bez browser traka, brže i glatko!',
      pwaBannerInstallBtn: 'INSTALIRAJ ODMAH',
      pwaBannerDismissBtn: 'Kasnije',
      pwaIosModalTitle: '📲 INSTALACIJA NA IPHONE / IPAD',
      pwaIosStep1: 'Dodirnite ikonicu <strong>Deli (Share)</strong> na dnu Safari browsera:',
      pwaIosStep2: 'U meniju izaberite opciju <strong>„Dodaj na početni ekran” (Add to Home Screen)</strong>:',
      pwaIosStep3: 'Dodirnite <strong>„Dodaj” (Add)</strong> u gornjem desnom uglu.',
      pwaIosCloseBtn: 'RAZUMEM',
      pwaInstalledSuccess: 'Aplikacija je uspešno instalirana!',

      // 18+ Gate & Login Keys
      loginTitle: 'IGT DEMO PRIJAVA',
      loginSub: 'Pristup 3D kazino platformi i igračkom profilu',
      loginNotice18: '🔞 Strogo zabranjeno licima mlađim od 18 godina. Igrajte odgovorno.',
      loginUserPlaceholder: 'Vaše korisničko ime / Nickname',
      loginPinPlaceholder: 'Demo PIN (opciono)',
      loginAgeConfirm: 'Potvrđujem da imam 18+ godina i prihvatam uslove.',
      loginRememberMe: 'Zapamti me na ovom uređaju',
      loginSubmitBtn: 'POTVRDI I UĐI U IGRU',
      loginAgeRequiredMsg: 'Morate potvrditi da imate 18 ili više godina za pristup!',

      // Player Profile & Statistics Keys
      profileModalTitle: 'PROFIL IGRAČA & STATISTIKA',
      profileVerifiedTag: '18+ VERIFIKOVAN',
      profileTotalSpins: 'Ukupno Spinova:',
      profileTotalBet: 'Ukupan Ulog:',
      profileTotalWin: 'Ukupan Dobitak:',
      profileRtp: 'Lični RTP:',
      profileBiggestWin: 'Najveći Dobitak:',
      profilePlayTime: 'Vreme u Igri:',
      profileClassicSpins: '1-Line Classic:',
      profileRoyalSpins: 'Royal 3x3:',
      profileMinesRounds: 'Mines Igre:',
      profileFreeSpinsCount: 'Besplatni Spinovi:',
      profileHoldWinCount: 'Hold & Win Bonusi:',
      profileMiniMinesCount: 'Mines Bonusi:',
      profileJackpotSilver: 'Silver Jackpoti:',
      profileJackpotGold: 'Gold Jackpoti:',
      profileJackpotDiamond: 'Diamond Jackpoti:',
      profileLogoutBtn: 'ODJAVI SE',
      profileCloseBtn: 'ZATVORI',
      denominationLabel: 'DENOM',
      profileDepositDesc: 'Dodajte fiktivna sredstva na svoj račun u dinarima radi testiranja igre:',
      profileDepositBtn: 'DOPUNI RSD',
      profileDenomDesc: 'Izaberite koliko dinara vredi 1 kredit:'
    },
    en: {
      brandSub: 'IGT CASINO',
      leverTitle: 'Pull lever to spin!',
      gameClassic: '1-LINE CLASSIC',
      gameRoyal3x3: 'ROYAL 3x3 (5 LINES)',
      gameFullFocus: 'ROYAL 3x3 FULL FOCUS',
      gameMines: 'IGT MINES X',
      gameXtension: 'IGT XTENSION LINK',
      gameModeChanged: 'GAME: {game}',
      linesWin: '{lines} WINNING LINES!',
      linesRuleText: 'In <strong>Royal 3x3</strong> game, <strong>5 paylines</strong> are active (3 horizontal + 2 diagonal). Multi-line wins are added together!',
      ready: 'READY TO PLAY!',
      spinning: 'SPINNING...',
      tryAgain: 'TRY AGAIN!',
      winPrefix: 'WIN: +',
      egtLobbyTitle: 'GAMES LOBBY',
      egtLobbySub: 'IGT CASINO MULTIGAME',
      egtReturnToGame: 'BACK TO GAME',
      egtActiveTag: 'ACTIVE GAME',
      egtSelectTag: 'PLAY NOW',
      egtClassicDesc: '1 Center Payline • Retro Golden Cylinder • Mechanical Lever Action',
      egtRoyalDesc: '5 Active Paylines • IGT Mines Bonus • Scatter Diamonds',
      egtFocusDesc: 'Maximized Immersion • 5 Paylines • Optimized for Fullscreen Action',
      egtMinesDesc: 'Customizable Grid & Mines • Multiplier Ladder • Instant Cashout',
      egtXtensionDesc: 'Hold & Spin • Dynamic Expansion to 8 Rows • 40-Spot IGT Jackpot',
      miniMinesBonusTag: 'BONUS ROUND',
      miniMinesBonusTitle: '💎 IGT MINES BONUS 💣',
      miniMinesBonusSub: 'UNCOVER GOLD COINS & AVOID THE MINES!',
      miniMinesFinished: '💣 MINES BONUS FINISHED! WON: +{amount}',
      miniMinesStart: 'STARTING PRIZE: +{starter} RSD! PICK TILES OR TAKE WIN!',
      totalBonusWin: 'CURRENT WIN:',
      meterCardsLabel: 'CARDS',
      meterMinesLabel: 'MINES',
      meterCardsLocked: '💎 CHARGE CARDS VIA SPINS TO UNLOCK!',
      meterMinesLocked: '❇️ MINES ARE LOCKED! CHARGE METER VIA SPINS!',
      cardsBonusActivated: '💎 CARDS UNLOCKED! ({sec}s)',
      minesBonusActivated: '❇️ IGT MINES UNLOCKED! ({sec}s)',
      combo_flower_jackpot: '3x IGT SYMBOL (JACKPOT!)',
      combo_flower_3x: '3x IGT SYMBOL (JACKPOT!)',
      combo_flower_2x: '2x IGT SYMBOL!',
      combo_crown_3x: '3x GOLDEN CROWN!',
      combo_crown_2x: '2x GOLDEN CROWN!',
      combo_bar_3x: '3x BAR!',
      combo_bar_2x: '2x BAR!',
      combo_horseshoe_3x: '3x LUCKY HORSESHOE!',
      combo_horseshoe_2x: '2x LUCKY HORSESHOE!',
      combo_seven_3x: '3x GOLDEN 7!',
      combo_seven_2x: '2x GOLDEN 7!',
      combo_bell_3x: '3x BELL!',
      combo_bell_2x: '2x BELL!',
      combo_coin_3x: '3x GOLD COIN!',
      combo_coin_2x: '2x GOLD COIN!',
      combo_diamond_3x: '3x DIAMOND!',
      combo_diamond_2x: '2x DIAMOND!',
      combo_flower_bar: 'IGT & BAR COMBO!',
      freeSpinsWon: '💎 5 FREE SPINS WON! 💎',
      freeSpinsPlusWin: '💎 5 FREE SPINS + {amount}! 💎',
      freeSpinRemaining: 'FREE SPIN! Remaining: ',
      bigWin: '🎰 BIG WIN! +',
      notEnoughCredits: 'NOT ENOUGH CREDITS! Refill for free.',
      creditsAdded: 'ADDED +{amount} CREDITS!',
      happyHourActive: '🔥 HAPPY HOUR ACTIVE! x{mult} MULTIPLIER! 🔥',

      credits: 'Credits',
      bet: 'Bet',
      win: 'Win',

      addCredits: 'DEPOSIT RSD',
      addCreditsTitle: 'Deposit fictional RSD (opens profile)',
      betLabel: 'BET',
      maxBet: 'MAX BET',
      spin: 'SPIN',
      autoSpin: 'AUTO',
      autoSpinOn: 'STOP',
      decreaseBet: 'Decrease bet',
      increaseBet: 'Increase bet',

      rulesAndPayouts: 'Rules & Payouts',
      installApp: 'Install App',
      sound: 'Sound',

      paytableTitle: '🏆 PAYTABLE & RULES',
      symFlower: 'IGT Symbol (Jackpot)',
      symCrown: 'Golden Crown',
      symBar: 'BAR Symbol',
      symHorseshoe: 'Lucky Horseshoe',
      symSeven: 'Golden Seven (7)',
      symBell: 'Golden Bell',
      symCoin: 'Gold Coin',
      symDiamond: 'Diamond (Bonus)',
      freeSpinsRuleHeading: '✨ GAME RULES & BONUSES',
      freeSpinsRuleText: 'Hit 3 Diamonds to win <strong>5 FREE SPINS</strong>!',
      instructionsRuleText: 'You can also pull the 3D lever on the right side to spin the reels or press the Spacebar.',
      openAdminPanel: '⚙️ OPEN ADMIN / OPERATOR PANEL',
      ruleHoldWinTitle: '🔥 HOLD & WIN (IGT RESPINS):',
      ruleHoldWinDesc: 'When 3 or more Gold Coins land on the reels, a bonus with 3 Respins is triggered. All coins lock in place. Any newly landed coin also locks and resets respins back to 3! Fill all 9 spots to win the maximum 💎 DIAMOND JACKPOT!',
      ruleMysteryJpTitle: '🎰 MYSTERY JACKPOT:',
      ruleMysteryJpDesc: 'Every spin has a random chance to trigger the progressive Silver, Gold, or Diamond Jackpot shown at the top of the screen!',
      ruleCardsTitle: '♠️ CRYSTAL SPADE (CARDS):',
      ruleCardsDesc: 'When the cards meter fills up with spins, the Crystal Spade begins to glow and pulse! While active, you can enter the card gamble game to guess Red or Black and double your prize.',

      // Mines In-Game Localization
      minesConfigLabel: 'MINES:',
      minesBetTag: 'BET',
      minesBetBtn: 'BET',
      minesNewGameBtn: 'NEW GAME',
      minesCashoutBtn: 'CASHOUT',
      minesPickPrompt: 'SELECT BET & START GAME',
      minesActivePrompt: 'PICK TILES & AVOID MINES!',
      minesHitStatus: 'HIT! MULTIPLIER: {mult} ({win} RSD)',
      minesAllCleared: '👑 ALL TILES CLEARED! WON: {win} RSD!',
      minesCashedOut: '💰 CASHED OUT: {win} RSD ({mult})',
      minesExploded: '💥 MINE HIT! TRY AGAIN.',
      minesGoldCoin: 'GOLD COIN',
      minesBomb: 'MINE',
      miniPickLabel: 'PICK',
      miniHitStatus: 'HIT! +{win} RSD ({mult}x)',
      miniMinesAvoided: '👑 ALL MINES AVOIDED! MAX BONUS!',
      miniMinesHitStatus: '💥 MINE HIT! BONUS OVER!',
      miniMinesPrompt: 'PICK TILES OR TAKE WIN!',
      miniMinesCashoutLabel: 'TAKE WIN',

      // Adrenaline Pack Keys
      cardsEmblemTitle: 'Crystal Spade (Cards)',
      gamble: '♠️ CARDS',
      gambleTitle: '♠️ CARDS (RED / BLACK)',
      gambleHistory: 'HISTORY:',
      currentGambleWin: 'CURRENT WIN:',
      gambleToWin: 'WIN ON HIT:',
      gambleRed: 'RED',
      gambleBlack: 'BLACK',
      takeWin: '💰 TAKE WIN',
      gambleWon: '🎉 WIN! DOUBLED TO: {amount}',
      gambleLost: '❌ BETTER LUCK NEXT TIME!',
      holdWinHeading: '🔥 IGT RESPINS (HOLD & WIN) 🔥',
      respinsLeft: 'RESPINS LEFT:',
      hwTotalWin: 'TOTAL WIN:',
      respinNow: '⚡ RESPIN NOW ⚡',
      hwGrandWon: '💥 GRAND JACKPOT! ALL TILES FILLED! 💥',
      hwFinished: '🏆 HOLD & WIN BONUS FINISHED! WON: +{amount}',
      jackpotWonSilver: '🥈 CONGRATULATIONS! YOU WON THE SILVER JACKPOT: +{amount}! 🥈',
      jackpotWonGold: '🏆 IGT HIT! YOU WON THE GOLD JACKPOT: +{amount}! 🏆',
      jackpotWonDiamond: '💎 MEGA BANGER! YOU WON THE DIAMOND JACKPOT: +{amount}! 💎',

      // PWA Install Keys
      pwaBannerTitle: 'Install IGT Casino',
      pwaBannerSub: 'Play in fullscreen without browser bars, faster and smoother!',
      pwaBannerInstallBtn: 'INSTALL NOW',
      pwaBannerDismissBtn: 'Later',
      pwaIosModalTitle: '📲 INSTALL ON IPHONE / IPAD',
      pwaIosStep1: 'Tap the <strong>Share</strong> icon at the bottom of Safari:',
      pwaIosStep2: 'Scroll and select <strong>„Add to Home Screen”</strong>:',
      pwaIosStep3: 'Tap <strong>„Add”</strong> in the top right corner.',
      pwaIosCloseBtn: 'GOT IT',
      pwaInstalledSuccess: 'App successfully installed!',

      // 18+ Gate & Login Keys
      loginTitle: 'IGT DEMO LOGIN',
      loginSub: 'Access to 3D casino platform and player profile',
      loginNotice18: '🔞 Strictly prohibited for individuals under 18. Play responsibly.',
      loginUserPlaceholder: 'Your nickname / Player ID',
      loginPinPlaceholder: 'Demo PIN (optional)',
      loginAgeConfirm: 'I confirm that I am 18+ years of age and accept terms.',
      loginRememberMe: 'Remember me on this device',
      loginSubmitBtn: 'CONFIRM & ENTER GAME',
      loginAgeRequiredMsg: 'You must confirm that you are 18 or older to enter!',

      // Player Profile & Statistics Keys
      profileModalTitle: 'PLAYER PROFILE & STATS',
      profileVerifiedTag: '18+ VERIFIED',
      profileTotalSpins: 'Total Spins:',
      profileTotalBet: 'Total Bet:',
      profileTotalWin: 'Total Win:',
      profileRtp: 'Personal RTP:',
      profileBiggestWin: 'Biggest Win:',
      profilePlayTime: 'Play Time:',
      profileClassicSpins: '1-Line Classic:',
      profileRoyalSpins: 'Royal 3x3:',
      profileMinesRounds: 'Mines Games:',
      profileFreeSpinsCount: 'Free Spins:',
      profileHoldWinCount: 'Hold & Win Bonuses:',
      profileMiniMinesCount: 'Mines Bonuses:',
      profileJackpotSilver: 'Silver Jackpots:',
      profileJackpotGold: 'Gold Jackpots:',
      profileJackpotDiamond: 'Diamond Jackpots:',
      profileLogoutBtn: 'LOGOUT',
      profileCloseBtn: 'CLOSE',
      denominationLabel: 'DENOM',
      profileDepositDesc: 'Add fictional demo funds in RSD to test slot gameplay:',
      profileDepositBtn: 'DEPOSIT RSD',
      profileDenomDesc: 'Select RSD coin value per 1 credit:'
    }
  };

  class I18nEngine {
    constructor() {
      // Default: Serbian (sr), check localStorage
      const savedLang = localStorage.getItem('igt_lang') || localStorage.getItem('maxbet_lang') || localStorage.getItem('grand_slot_lang');
      this.currentLang = (savedLang === 'en' || savedLang === 'sr') ? savedLang : 'sr';
    }

    t(key, params = {}) {
      const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.sr;
      let text = dict[key] || TRANSLATIONS.sr[key] || key;
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
      }
      return text;
    }

    setLanguage(lang) {
      if (lang !== 'sr' && lang !== 'en') return;
      this.currentLang = lang;
      localStorage.setItem('igt_lang', lang);
      localStorage.setItem('maxbet_lang', lang);
      localStorage.setItem('grand_slot_lang', lang);
      localStorage.setItem('grand_slot_lang', lang);
      this.applyTranslations();
      if (window.slotGame && typeof window.slotGame.onLanguageChanged === 'function') {
        window.slotGame.onLanguageChanged();
      }
      if (window.slotApp) {
        if (window.slotApp.minesGame && typeof window.slotApp.minesGame.onLanguageChanged === 'function') {
          window.slotApp.minesGame.onLanguageChanged();
        }
        if (window.slotApp.miniMines && typeof window.slotApp.miniMines.onLanguageChanged === 'function') {
          window.slotApp.miniMines.onLanguageChanged();
        }
        if (window.slotApp.lobby && typeof window.slotApp.lobby.updateCurrentLabel === 'function') {
          window.slotApp.lobby.updateCurrentLabel();
        }
      }
    }

    toggleLanguage() {
      const nextLang = this.currentLang === 'sr' ? 'en' : 'sr';
      this.setLanguage(nextLang);
    }

    applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
          el.textContent = this.t(key);
        }
      });
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key) {
          el.innerHTML = this.t(key);
        }
      });
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
          el.setAttribute('title', this.t(key));
        }
      });

      // Update discreet lang pill label
      const langLabel = document.getElementById('lang-current-label');
      if (langLabel) {
        langLabel.textContent = this.currentLang.toUpperCase();
      }
      const langToggleBtn = document.getElementById('lang-toggle');
      if (langToggleBtn) {
        langToggleBtn.title = this.currentLang === 'sr' ? 'Prebaci na English' : 'Switch to Srpski';
      }

      // Update lang switch buttons active state (if present)
      const btnSr = document.getElementById('lang-sr');
      const btnEn = document.getElementById('lang-en');
      if (btnSr) btnSr.classList.toggle('active', this.currentLang === 'sr');
      if (btnEn) btnEn.classList.toggle('active', this.currentLang === 'en');
      
      // Update HTML lang attribute
      document.documentElement.lang = this.currentLang;
    }
  }

  window.i18n = new I18nEngine();
})();
