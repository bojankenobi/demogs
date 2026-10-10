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
      profileDenomDesc: 'Izaberite koliko dinara vredi 1 kredit:',
      profileDepositDesc: 'Dodajte fiktivna sredstva na svoj račun u dinarima radi testiranja igre:',
      profileDepositBtn: 'DOPUNI RSD',
      depositSuccessMsg: '💰 USPEŠNO UPLAĆENO +{rsd} RSD (+{credits} KR)!',

      // Wheel of Fortune
      wheelTitle: '✦ WHEEL OF FORTUNE ✦',
      wheelSub: 'OSVOJITE DO 200x ULOGA, JACKPOT ILI BESPLATNE SPINOVE!',
      wheelSpinBtn: '🎰 ZAVRTI TOČAK SREĆE 🎰',
      wheelSpinning: '⏳ TOČAK SE VRTI...',
      wheelClaimBtn: '💰 PREUZMI DOBITAK & NASTAVI 💰',
      wheelCloseBtn: '✕ ZATVORI',
      wheelWonLabel: 'OSVOJENI DOBITAK:',
      wheelCloseTitle: 'Zatvori točak (ESC)',
      wheelLockedMsg: '🎡 IGT TOČAK SREĆE: PUNITE MERAČ SPINOVIMA (TRENUTNO {pct}%)',
      wheelBankruptMsg: '💥 BANKRUPT! 0 RSD (POKUŠAJTE PONOVO)',
      wheelFsAwarded: '{spins} BESPLATNIH SPINOVA ({mult}x START)!',
      wheelJackpotAwarded: 'JACKPOT {tier} ({amount} RSD)!',

      // Volatility & Math Modal
      volatilityPillTitle: 'Podešavanje volatilnosti i stalnih dobitaka',
      volatilityFooterTitle: 'Podešavanje Volatilnosti & Prezentacija',
      volatilityBadge: '🎰 MATEMATIKA & VOLATILNOST',
      volatilityTitle: 'IZABERITE PROFIL AUTOMATA',
      volatilitySubtitle: 'Podesite učestalost dobitaka ili uključite stalne dobitke za prezentaciju igara',
      volatilityCloseTitle: 'Zatvori',
      volatilityRibbonRecommended: 'PREPORUČENO',
      volatilityStandardTitle: 'Casino Standard',
      volatilityStandardRtp: '~96.0% RTP • Hit Rate ~25%',
      volatilityStandardDesc: 'Standardna industrijska slot matematika. Balansirani dobici i gubici. Isplata za 2 simbola važi isključivo za zlatnike, ostali simboli traže punu liniju.',
      volatilityHitLabel: 'Udarac:',
      volatilityHitStandard: '1 od 4 spina',
      volatilityBonusTurnoverLabel: 'Obrt za bonus:',
      volatilitySelectBtn: 'IZABERI PROFIL',
      volatilityRibbonGreen: 'ČEŠĆI DOBICI',
      volatilityLowTitle: 'Niska Volatilnost',
      volatilityLowRtp: '~97.0% RTP • Hit Rate ~40%',
      volatilityLowDesc: 'Češći manji dobici za duže trajanje kredita i opušteniju sesiju. 2 simbola plaćaju za zlatnike, zvona i sedmice.',
      volatilityHitLow: 'Skoro svaki 2. spin',
      volatilityRibbonRed: 'VISOK RIZIK & VEĆE ISPLATE',
      volatilityHighTitle: 'Visoka Volatilnost',
      volatilityHighRtp: '~94.5% RTP • Hit Rate ~16%',
      volatilityHighDesc: 'Visok adrenalinski rizik. Ređi dobici, ali NEMA isplate za 2 simbola — isključivo 3 simbola plaćaju uz +50% veće iznose (1.5x Multiplier)!',
      volatilityHitHigh: '1 od 6 spinova',
      volatilityRibbonPurple: '100% DOBITAK • PREZENTACIJA',
      volatilityDemoTitle: 'Demo Prezentacija',
      volatilityDemoRtp: '100% Hit • Promo Show',
      volatilityDemoDesc: 'Garantovan dobitak na svakom spinu! Idealan režim za demonstraciju automata klijentima, brzo otključavanje Mina, Točka i Karata.',
      volatilityHitDemo: 'SVAKI SPIN DOBITAN',
      volatilityTurnoverDemo: 'Munjevito (70 - 130 RSD)',
      volatilityFooterNote: '💡 Promena profila trenutno ažurira sve igre (Classic, Royal 3x3, Mines) i brzinu punjenja bonusa.',
      mathPresetActivated: '⚡ MATEMATIČKI REŽIM: {name}',

      // Buy Bonus Modal
      buyBonusTitle: 'Kupi Bonus: Direktan ulaz u Točak, Mine ili Free Spinove!',
      buyBonusBadge: '⚡ VIP DIREKTNA AKCIJA',
      buyBonusModalTitle: 'KUPOVINA BONUSA',
      buyBonusModalSub: 'Preskočite čekanje i odmah aktivirajte željeni bonus po izboru!',
      buyCardWheelTitle: 'Točak Sreće',
      buyCardWheelDesc: 'Garantovan ulazak u Točak Sreće sa novčanim nagradama, besplatnim spinovima i šansom za Diamond Jackpot!',
      buyCardMinesTitle: 'IGT Mini-Mines',
      buyCardMinesDesc: 'Otvorite polja, sakupljajte dragulje sa rastućim multiplikatorima i naplatite ulog pre nego što detonira mina!',
      buyCardFsTitle: 'Super Besplatni Spinovi',
      buyCardFsDesc: '10 garantovanih besplatnih spinova sa stalnim 2x multiplikatorom na sve dobitne linije i kombinacije!',
      buyBtnPrefix: 'KUPI ZA {amount} RSD',
      buyBonusFooterNote: '💡 Cena kupovine bonusa automatski se računa na osnovu Vašeg trenutnog uloga (Bet) i denominacije.',
      notEnoughCreditsForBuy: 'NEMATE DOVOLJNO SREDSTAVA ZA KUPOVINU BONUSA!',
      buyBonusPurchased: '⚡ KUPLJEN BONUS: {name} (-{cost} RSD)!',

      // Tournament Mode
      tournamentBtnTitle: 'Turnirski Režim (120s Izazov)',
      tourBannerBadge: '🏆 IGT TURNIR',
      tourExitTitle: 'Napusti turnir',
      tournamentModalBadge: '🏆 120s HIGH-SPEED IZAZOV',
      tournamentModalTitle: 'IGT CASINO TURNIR',
      tournamentModalSubtitle: 'Takmičite se za vrh tabele sa 5.000 turnirskih kredita!',
      tourDurationLabel: 'TRAJANJE',
      tourDurationVal: '120 Sekundi',
      tourStartCreditsLabel: 'START KREDITI',
      tourBalanceLabel: 'VAŠ SALDO',
      tourSafeVal: '100% Bezbedan',
      tourLeaderboardTitle: '👑 TRENUTNA TABELA ŠAMPIONA',
      tourStartBtn: 'ZAPOČNI TURNIR (120 SEKUNDI) 🚀',
      tourFinishedTitle: 'TURNIR JE ZAVRŠEN!',
      tourFinishedSub: 'Čestitamo! Vaš rezultat je uspešno zabeležen na tabeli šampiona.',
      tourPointsWonLabel: 'OSVOJENI POENI',
      tourFinalRankLabel: 'KONAČAN PLASMAN',
      tourContinueBtn: 'NASTAVI IGRU ✨',
      tourAlreadyActive: '⚡ TURNIR JE VEĆ U TOKU!',
      tourStartedMsg: '🏆 TURNIR JE POČEO! 2 MINUTA ZA MAKSIMALAN DOBITAK! ⚡',
      tourFinishedMsg: '🎉 ZAVRŠEN TURNIR! RANG: {rank} ({score} RSD)!',
      tourPlayerYou: 'Vi (Igrač)',
      tourRankPlace: '#{rank}. MESTO',

      // Meters & Top Buttons & Ambience
      meterCardsTitle: 'Karte / Duplanje Bonus',
      meterWheelTitle: 'IGT Točak Sreće - Kliknite ili napunite za igru!',
      meterWheelLabel: 'TOČAK',
      goldenBetTitle: 'Golden Bet: +25% ulog za 2x brži Točak i Mine!',
      ambientTitle: 'Vegas Casino Ambijent (Šum & Zvona)',

      // Free Spins Banner & Summary
      fsBannerTitle: 'SUPER BONUS REŽIM',
      fsMultLabel: 'MNOŽILAC:',
      fsSummaryTitle: 'ČESTITAMO!',
      fsSummarySub: 'ZAVRŠENI BESPLATNI SPINOVI',
      fsSummaryClaim: 'PREUZMI DOBITAK',
      fsSuperBonusTrigger: '⚡ SUPER BONUS: {spins} BESPLATNIH SPINOVA ({mult}x MNOŽILAC)!',
      fsMultIncreased: '🔥 MNOŽILAC POVEĆAN NA {mult}x!',
      fsRetriggerMsg: '🎉 RETRIGGER: +{spins} DODATNIH BESPLATNIH SPINOVA!',

      // Gamble & Mini-Mines
      gambleLostChoice: '❌ POGREŠAN IZBOR! IZGUBLJENO: {amount} KREDITA!',
      miniMinesWipedOut: '💥 MINA EKSPLODIRALA! IZGUBLJEN SAV DOBITAK (0 RSD)!',

      // Extra Profile & Login & HUD Labels
      profileDepositSectionTitle: '💳 FIKTIVNA DOPUNA DINARA (DEMO)',
      profileDenomSectionTitle: '🎰 DENOMINACIJA (VREDNOST KREDITA)',
      profileBonusesSectionTitle: '🏆 BONISI & JACKPOTI',
      profileJackpotSummaryLabel: 'Osvojeni Jackpoti (S / G / D):',
      loginUsernameLabel: 'Korisničko ime / Nickname:',
      loginPinLabel: 'PIN Kod (opciono):',
      loginUserPlaceholder: 'Vaše korisničko ime / Nickname',
      loginPinPlaceholder: 'Demo PIN (opciono)',
      depositPlaceholder: 'Iznos u RSD...',
      fsSpinsLabel: 'SPINOVI:',
      tourTimeLabel: 'VREME:',
      tourScoreLabel: 'POENI:',
      buyBonusBtnText: 'KUPI BONUS'
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
      profileDenomDesc: 'Select RSD coin value per 1 credit:',
      profileDepositDesc: 'Add fictional demo funds in RSD to test slot gameplay:',
      profileDepositBtn: 'DEPOSIT RSD',
      depositSuccessMsg: '💰 DEPOSIT SUCCESSFUL: +{rsd} RSD (+{credits} CREDITS)!',

      // Wheel of Fortune
      wheelTitle: '✦ WHEEL OF FORTUNE ✦',
      wheelSub: 'WIN UP TO 200x BET, JACKPOT OR FREE SPINS!',
      wheelSpinBtn: '🎰 SPIN THE WHEEL 🎰',
      wheelSpinning: '⏳ WHEEL IS SPINNING...',
      wheelClaimBtn: '💰 COLLECT PRIZE & CONTINUE 💰',
      wheelCloseBtn: '✕ CLOSE',
      wheelWonLabel: 'PRIZE WON:',
      wheelCloseTitle: 'Close wheel (ESC)',
      wheelLockedMsg: '🎡 IGT WHEEL OF FORTUNE: CHARGE METER VIA SPINS (CURRENTLY {pct}%)',
      wheelBankruptMsg: '💥 BANKRUPT! 0 RSD (TRY AGAIN)',
      wheelFsAwarded: '{spins} FREE SPINS ({mult}x START)!',
      wheelJackpotAwarded: 'JACKPOT {tier} ({amount} RSD)!',

      // Volatility & Math Modal
      volatilityPillTitle: 'Volatility and guaranteed win configuration',
      volatilityFooterTitle: 'Volatility & Presentation Settings',
      volatilityBadge: '🎰 MATH & VOLATILITY',
      volatilityTitle: 'SELECT SLOT PROFILE',
      volatilitySubtitle: 'Adjust win frequency or enable presentation mode for guaranteed wins',
      volatilityCloseTitle: 'Close',
      volatilityRibbonRecommended: 'RECOMMENDED',
      volatilityStandardTitle: 'Casino Standard',
      volatilityStandardRtp: '~96.0% RTP • Hit Rate ~25%',
      volatilityStandardDesc: 'Standard industrial slot mathematics. Balanced wins and losses. 2-symbol payout applies only to Gold Coins, other symbols require a full 3-line.',
      volatilityHitLabel: 'Hit Rate:',
      volatilityHitStandard: '1 in 4 spins',
      volatilityBonusTurnoverLabel: 'Bonus Turnover:',
      volatilitySelectBtn: 'SELECT PROFILE',
      volatilityRibbonGreen: 'FREQUENT WINS',
      volatilityLowTitle: 'Low Volatility',
      volatilityLowRtp: '~97.0% RTP • Hit Rate ~40%',
      volatilityLowDesc: 'Frequent smaller wins for longer credit endurance and relaxed gameplay. 2 symbols pay for Coins, Bells, and Sevens.',
      volatilityHitLow: 'Nearly every 2nd spin',
      volatilityRibbonRed: 'HIGH RISK & BIG PAYOUTS',
      volatilityHighTitle: 'High Volatility',
      volatilityHighRtp: '~94.5% RTP • Hit Rate ~16%',
      volatilityHighDesc: 'High adrenaline risk. Rarer wins, but NO 2-symbol payouts — only 3-of-a-kind pays with +50% larger amounts (1.5x Multiplier)!',
      volatilityHitHigh: '1 in 6 spins',
      volatilityRibbonPurple: '100% HIT • PRESENTATION',
      volatilityDemoTitle: 'Demo Presentation',
      volatilityDemoRtp: '100% Hit • Promo Show',
      volatilityDemoDesc: 'Guaranteed win on every single spin! Ideal mode for demonstrating the cabinet to clients, rapidly unlocking Mines, Wheel and Cards.',
      volatilityHitDemo: 'EVERY SPIN WINS',
      volatilityTurnoverDemo: 'Lightning Fast (70 - 130 RSD)',
      volatilityFooterNote: '💡 Profile changes immediately update all games (Classic, Royal 3x3, Mines) and bonus meter charging rates.',
      mathPresetActivated: '⚡ MATH PROFILE: {name}',

      // Buy Bonus Modal
      buyBonusTitle: 'Buy Bonus: Direct entry into Wheel, Mines, or Free Spins!',
      buyBonusBadge: '⚡ VIP INSTANT ACTION',
      buyBonusModalTitle: 'BUY BONUS',
      buyBonusModalSub: 'Skip the wait and instantly trigger your bonus of choice!',
      buyCardWheelTitle: 'Wheel of Fortune',
      buyCardWheelDesc: 'Guaranteed entry to the Wheel of Fortune with cash prizes, free spins, and a shot at the Diamond Jackpot!',
      buyCardMinesTitle: 'IGT Mini-Mines',
      buyCardMinesDesc: 'Uncover tiles, gather gems with climbing multipliers, and cash out before hitting a mine!',
      buyCardFsTitle: 'Super Free Spins',
      buyCardFsDesc: '10 guaranteed free spins with persistent 2x multiplier on all winning lines and combinations!',
      buyBtnPrefix: 'BUY FOR {amount} RSD',
      buyBonusFooterNote: '💡 Bonus buy cost is automatically calculated based on your current Bet and denomination.',
      notEnoughCreditsForBuy: 'INSUFFICIENT FUNDS TO BUY BONUS!',
      buyBonusPurchased: '⚡ BONUS PURCHASED: {name} (-{cost} RSD)!',

      // Tournament Mode
      tournamentBtnTitle: 'Tournament Mode (120s Challenge)',
      tourBannerBadge: '🏆 IGT TOURNAMENT',
      tourExitTitle: 'Exit Tournament',
      tournamentModalBadge: '🏆 120s HIGH-SPEED CHALLENGE',
      tournamentModalTitle: 'IGT CASINO TOURNAMENT',
      tournamentModalSubtitle: 'Compete for the top of the leaderboard with 5,000 tournament credits!',
      tourDurationLabel: 'DURATION',
      tourDurationVal: '120 Seconds',
      tourStartCreditsLabel: 'START CREDITS',
      tourBalanceLabel: 'YOUR BALANCE',
      tourSafeVal: '100% Protected',
      tourLeaderboardTitle: '👑 CURRENT CHAMPIONS LEADERBOARD',
      tourStartBtn: 'START TOURNAMENT (120 SECONDS) 🚀',
      tourFinishedTitle: 'TOURNAMENT COMPLETED!',
      tourFinishedSub: 'Congratulations! Your score has been entered on the champions leaderboard.',
      tourPointsWonLabel: 'POINTS EARNED',
      tourFinalRankLabel: 'FINAL RANKING',
      tourContinueBtn: 'CONTINUE PLAYING ✨',
      tourAlreadyActive: '⚡ TOURNAMENT IS ALREADY ACTIVE!',
      tourStartedMsg: '🏆 TOURNAMENT STARTED! 2 MINUTES FOR MAXIMUM WIN! ⚡',
      tourFinishedMsg: '🎉 TOURNAMENT FINISHED! RANK: {rank} ({score} RSD)!',
      tourPlayerYou: 'You (Player)',
      tourRankPlace: '#{rank} PLACE',

      // Meters & Top Buttons & Ambience
      meterCardsTitle: 'Cards / Gamble Bonus',
      meterWheelTitle: 'IGT Wheel of Fortune - Click or charge to play!',
      meterWheelLabel: 'WHEEL',
      goldenBetTitle: 'Golden Bet: +25% bet for 2x faster Wheel & Mines charging!',
      ambientTitle: 'Vegas Casino Ambience (Crowd & Bells)',

      // Free Spins Banner & Summary
      fsBannerTitle: 'SUPER BONUS MODE',
      fsMultLabel: 'MULTIPLIER:',
      fsSummaryTitle: 'CONGRATULATIONS!',
      fsSummarySub: 'FREE SPINS COMPLETED',
      fsSummaryClaim: 'COLLECT WIN',
      fsSuperBonusTrigger: '⚡ SUPER BONUS: {spins} FREE SPINS ({mult}x MULTIPLIER)!',
      fsMultIncreased: '🔥 MULTIPLIER INCREASED TO {mult}x!',
      fsRetriggerMsg: '🎉 RETRIGGER: +{spins} EXTRA FREE SPINS!',

      // Gamble & Mini-Mines
      gambleLostChoice: '❌ WRONG CHOICE! LOST: {amount} CREDITS!',
      miniMinesWipedOut: '💥 MINE EXPLODED! ALL BONUS WINNINGS LOST (0 RSD)!',

      // Extra Profile & Login & HUD Labels
      profileDepositSectionTitle: '💳 FICTIONAL RSD DEPOSIT (DEMO)',
      profileDenomSectionTitle: '🎰 DENOMINATION (COIN VALUE)',
      profileBonusesSectionTitle: '🏆 BONUSES & JACKPOTS',
      profileJackpotSummaryLabel: 'Jackpots Won (S / G / D):',
      loginUsernameLabel: 'Username / Nickname:',
      loginPinLabel: 'PIN Code (optional):',
      loginUserPlaceholder: 'Your username / nickname',
      loginPinPlaceholder: 'Demo PIN (optional)',
      depositPlaceholder: 'Amount in RSD...',
      fsSpinsLabel: 'SPINS:',
      tourTimeLabel: 'TIME:',
      tourScoreLabel: 'SCORE:',
      buyBonusBtnText: 'BUY BONUS'
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
        if (window.slotApp.buyBonus && typeof window.slotApp.buyBonus.updatePrices === 'function') {
          window.slotApp.buyBonus.updatePrices();
        }
        if (window.slotApp.tournament && typeof window.slotApp.tournament.renderLeaderboard === 'function') {
          window.slotApp.tournament.renderLeaderboard();
        }
        if (window.slotApp.mathManager && typeof window.slotApp.mathManager.updateHUD === 'function') {
          window.slotApp.mathManager.updateHUD();
        }
        if (window.slotApp.wheelBonus && typeof window.slotApp.wheelBonus.drawWheel === 'function') {
          window.slotApp.wheelBonus.drawWheel(window.slotApp.wheelBonus.currentRotation);
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
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
          el.setAttribute('placeholder', this.t(key));
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
