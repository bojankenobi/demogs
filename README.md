# IGT Multi-Game Casino Terminal & Slot Engine

[![Platform](https://img.shields.io/badge/Platform-HTML5%20%7C%20PWA-120324.svg)](#)
[![Performance](https://img.shields.io/badge/Performance-60--120%20FPS%20GPU-b85afd.svg)](#)
[![Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API%20Synthesized-b640fc.svg)](#)
[![License](https://img.shields.io/badge/License-Proprietary-purple.svg)](#)

> **Language / Jezik:** [English Documentation](#english-documentation) | [Srpska Dokumentacija](#srpska-dokumentacija)

---

<a name="english-documentation"></a>
## 🇬🇧 English Documentation

A high-performance web and Progressive Web Application (PWA) casino gaming platform inspired by modern land-based slot cabinets (IGT / EGT / Novomatic). The application features an authentic mechanical 3D slot cylinder, customizable mathematical volatility models (RNG), dynamic mystery progressive jackpots, multi-tiered interactive bonus games, ante bet options, direct bonus buys, and high-speed competitive tournaments within a zero-dependency ES6 architecture.

---

### 🎰 1. Multigame Terminal Portfolio

The cabinet includes a VIP Casino multigame selection lobby accessible on startup or at any time via the bottom navigation bar:

1. **1-Line Classic Retro Stepper:**
   - Single center payline homage to vintage mechanical Las Vegas slot machines.
   - 3D stepped endcaps, gold drum casing, physical pull lever with spring-damped physics.
   - Near-miss tension deceleration on Reel 3 when two high-value symbols align on Reels 1 and 2.
2. **Royal 3x3 Multi-Line Slot:**
   - 3-reel, 3-row layout with 5 fixed paylines (3 horizontal, 2 diagonal).
   - Dynamic SVG payline renderers with electric golden neon pulse on winning combinations.
   - Multi-line hit evaluation supporting simultaneous multi-line line wins.
3. **Full Focus 3x3 Mode:**
   - High-immersion, edge-to-edge reel drum view removing the side lever for maximized mobile viewport scale.
4. **IGT Mines X (Standalone Arcade Crash Game):**
   - Arcade crash title with customizable grid sizes (**3x3, 5x5, 7x7, 8x8**).
   - Configurable mine density (1 to 24 mines) with mathematically calculated exponential multiplier ladders.
   - Safe tile picks, real-time potential win calculation, and one-click instant cashout.

---

### ⚡ 2. Core Game Mechanics & Advanced Features

#### 👑 Golden Bet / Ante Bet (+25% Stake)
- **Cabinet Switch:** A dedicated Golden Bet switch located beside the bet controls.
- **Cost:** Adds **+25% to the current spin bet** (e.g., 20 credits base bet becomes 25 credits spin cost).
- **Player Advantage:**
  - **2x Accelerated Bonus Meter Charging:** Turnover contribution towards unlocking Točak Sreće, Mini-Mines, and Card Gamble accumulates at double speed.
  - **1.6x Boosted Scatter/Bonus Symbol Weights:** Higher probability of landing bonus symbols (`coin`, `diamond`, `wheel`).

#### ⚡ Buy Bonus Feature ("Kupi Bonus")
- Direct bonus purchases without waiting for meter fills or random reel drops:
  - **🎡 Točak Sreće (Wheel of Fortune):** Purchased for **45x Bet**. Instantly launches the Wheel of Fortune bonus modal with cash prizes, Super Free Spins, and jackpot eligibility.
  - **💣 IGT Mini-Mines Bonus:** Purchased for **35x Bet**. Launches the interactive minefield bonus where players uncover gems with escalating multipliers before cashing out.
  - **⚡ Super Free Spins:** Purchased for **50x Bet**. Awards **10 Free Spins with a persistent 2x Win Multiplier** on all paylines.
- Real-time cost updates dynamically based on current bet size and active currency denomination.

#### 🏆 120-Second Tournament Mode (Turnirski Režim)
- **High-Speed Competitive Challenge:** 2-minute timed sprint where players compete for the top of the leaderboard.
- **Isolated Bankroll:** Players are provisioned with **5,000 tournament credits**.
- **Real Balance Protection:** The player's actual fiat/credit balance is preserved and restored 100% intact upon tournament conclusion.
- **Live On-Screen HUD:** Floating banner displaying remaining time (`MM:SS`), live score, and projected rank.
- **Persistent Local Leaderboard:** Stores high scores across sessions in `localStorage`.

#### 🃏 Interactive Card Gamble (Double-Up / Duplanje)
- Classic Red vs. Black 50/50 double-or-nothing game.
- **Strict Casino Loss Penalty:** If the player guesses incorrectly, **all accumulated winnings from the spin and preceding gamble rounds are forfeited (0 RSD)**.
- Card history tracker showing recent card outcomes.

#### 💣 Interactive Mini-Mines Bonus Round
- Triggered by turnover accumulation or direct buy.
- **Explosion Penalty:** If a player detonates a hidden mine during picks, the round abruptly ends and **all uncovered bonus profits are lost**. Players must decide when to cash out.

#### 🎡 Wheel of Fortune (Točak Sreće)
- Luxury golden bezel wheel with authentic tick-peg pointer animation.
- Segments include direct credit multipliers (5x to 100x), Super Free Spins, and Grand Jackpots.

---

### 📊 3. Mathematical Model & Volatility Engine

The platform incorporates four switchable math presets configurable live via the Volatility modal:

| Volatility Profile | Estimated RTP | Hit Frequency | Payout Characteristics & Rules |
| :--- | :---: | :---: | :--- |
| **Casino Standard** | ~96.0% | ~25.0% (1 in 4) | Balanced industry slot model. 2-symbol payouts allowed only for coins; all other symbols require full 3-symbol lines. |
| **Low Volatility** | ~97.0% | ~40.0% (1 in 2.5) | Frequent small hits for extended session longevity. 2-symbol payouts active for coins, bells, and sevens. Faster bonus unlocks (350–700 RSD turnover). |
| **High Volatility** | ~94.5% | ~16.5% (1 in 6) | High adrenal risk. Strict requirement of 3 matching symbols on active paylines (no 2-symbol pays). Winning 3-matches award **+50% boosted payouts (1.5x Multiplier)**. |
| **Demo Presentation** | 100% | 100.0% (Every spin) | Designed for sales demonstrations and client showcases. Guaranteed win on every spin, rapid meter charging, instant bonus access. |

#### 💰 Mystery Progressive Jackpots (Must-Drop-By Pragovi)
- **Silver Tier:** Seeds at 50.00 RSD | Activates at 80.00 RSD | **Must Drop by 100.00 RSD**
- **Gold Tier:** Seeds at 200.00 RSD | Activates at 250.00 RSD | **Must Drop by 400.00 RSD**
- **Diamond Tier:** Seeds at 500.00 RSD | Activates at 600.00 RSD | **Must Drop by 900.00 RSD**
- Progressive pots accumulate on every spin (`incrementOnSpin`). When a pot reaches its hidden threshold, a mystery drop is awarded.

#### 🎚️ Dynamic Denomination Engine
- Flexible denomination selector: **0.2 RSD, 0.5 RSD, 1 RSD, 2 RSD, 4 RSD** per credit.
- Dual HUD display presenting both game Credits and real currency (RSD) equivalents.

---

### 🔊 4. Web Audio API Procedural Sound Engine

All sound effects are generated purely in real-time through the browser's Web Audio API with zero external audio asset downloads:
- **Mechanical Reel Stops:** Dual-layer acoustic synthesis simulating physical solenoid punch (low-frequency triangle drop, 130Hz -> 32Hz) combined with metallic ratchet pawl latch (sawtooth, 1450Hz -> 260Hz) and damped rebound oscillation.
- **Las Vegas Casino Floor Ambience:** Procedural pink noise filtered through bandpass room resonance (420Hz, Q 1.2) layered with periodic distant bell chimes simulating a lively casino floor.
- **Win Chimes & Cascades:** Harmonically tuned arpeggios, coin drops, and victory fanfares.

---

### 📁 5. Directory Structure

```
igt/
├── assets/
│   ├── icons/            # PWA icons (192x192, 512x512, maskable, favicon)
│   ├── symbols/          # SVG symbols (IGT Flower, Bell, Bar, Seven, Crown, Coin, Diamond, Bomb)
│   ├── logo.svg          # Official IGT horizontal logo
│   └── logo-badge.svg    # IGT VIP Casino badge logo
├── css/
│   └── style.css         # 3D cylinder replica styles, responsive scaler, HUDs, modals
├── js/
│   ├── core/
│   │   ├── admin.js           # Operator panel for jackpot/RTP adjustments
│   │   ├── bonus-features.js  # Free Spins manager, celebration FX, Buy Bonus engine
│   │   ├── gamble.js          # Red/Black card gamble game engine
│   │   ├── jackpots.js        # Progressive & mystery jackpot logic
│   │   ├── lobby.js           # Multi-game terminal switcher & carousel
│   │   ├── math-manager.js    # Volatility presets & payout configuration
│   │   ├── meters.js          # Dual turnover-based bonus meters
│   │   ├── player-tracker.js  # 18+ player session & statistics persistence
│   │   ├── tournament.js      # 120s tournament engine, leaderboard & HUD
│   │   ├── wallet.js          # RSD / Credit wallet, Golden Bet toggle, denomination
│   │   └── wheel.js           # Wheel of Fortune bonus engine
│   ├── games/
│   │   ├── classic/           # 1-Line Classic retro stepper game
│   │   ├── royal3x3/          # Royal 3x3 multi-line game & SVG paylines
│   │   └── mines/             # Standalone Mines X & in-slot Mini-Mines bonus
│   ├── app.js                 # Central orchestrator & lifecycle controller
│   ├── audio.js               # Web Audio API synthesizer & Vegas ambient engine
│   ├── i18n.js                # Bilingual localization (English / Serbian)
│   └── particles.js           # Canvas particle celebration burst FX
├── index.html                 # Main single-page application entrypoint
├── manifest.webmanifest       # PWA configuration manifest
├── sw.js                      # Service Worker for offline play & asset caching
└── README.md                  # Comprehensive platform documentation
```

---

### 🚀 6. Installation & How to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bojankenobi/igtdemo.git
   cd igtdemo
   ```
2. **Start a local HTTP server:**
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   Or using Node.js:
   ```bash
   npx serve .
   ```
3. **Launch in your browser:**
   Open `http://localhost:8000` in Google Chrome, Microsoft Edge, Safari, or mobile browser.
4. **PWA Installation:**
   Click the **"INSTALIRAJ APP"** button in the footer or browser address bar to install as a standalone native app on iOS, Android, or Windows.

---
---

<a name="srpska-dokumentacija"></a>
## 🇷🇸 Srpska Dokumentacija

Visokoperformantna web i PWA (Progressive Web Application) slot platforma inspirisana modernim kazino aparatima vodećih svetskih proizvođača (IGT / EGT / Novomatic). Aplikacija kombinuje verni mehanički 3D cilindar automata, prilagodljivu matematičku volatilnost, progresivne Mystery džekpote, interaktivne bonus igre, opciju povećanog uloga (Golden Bet), direktnu kupovinu bonusa (Buy Bonus) i brzi turnirski režim unutar modularne ES6 klijentske arhitekture bez eksternih biblioteka.

---

### 🎰 1. Multigame Portfolio Igara

Aparat poseduje VIP Casino lobi za izbor igara, dostupan pri startu ili u bilo kom trenutku preko donjeg menija:

1. **1-Line Classic (Retro Mehanički Slot):**
   - Jedna centralna dobitna linija inspirisana klasičnim Las Vegas mehaničkim aparatima.
   - Stepenaste zlatne kape cilindra, masivni bubanj i funkcionalna ručica sa opružnom fizikom povlačenja.
   - Efekat napetosti (Near-Miss) sa dramatičnim usporavanjem 3. rila kada prva dva rila prikažu jake simbole.
2. **Royal 3x3 Multi-Line Slot:**
   - 3 rila x 3 reda sa 5 fiksnih dobitnih linija (3 horizontalne i 2 dijagonalne).
   - Dinamički SVG iscrtavači dobitnih linija sa neonsko-zlatnim pulsiranjem preko dobitnih simbola.
   - Mogućnost ostvarivanja dobitaka na više linija istovremeno u jednom spinu.
3. **Full Focus 3x3 Režim:**
   - Maksimalno uvećan prikaz rila od ivice do ivice ekrana (bez ručice) za optimalno iskustvo na mobilnim uređajima.
4. **IGT Mines X (Zasebna Crash Arkada):**
   - Samostalna arkadna igra sa prilagodljivom mrežom (**3x3, 5x5, 7x7, 8x8**).
   - Podesiv broj mina (od 1 do 24) sa matematički izračunatom krivom multiplikatora.
   - Otkrivanje sigurnih polja, praćenje potencijalnog dobitka i instant isplata (Cashout).

---

### ⚡ 2. Glavne Mehanike i Napredne Funkcije

#### 👑 Golden Bet / Ante Bet (+25% Ulog)
- **Prekidač na automatu:** Dugme smešteno u komandnom bloku pored izbora uloga.
- **Cena:** Dodaje **+25% na trenutni ulog po spinu** (npr. ulog od 20 kredita košta 25 kredita).
- **Prednosti za igrača:**
  - **2x Brže Punjenje Metara za Bonus:** Sav obrt (turnover) za otključavanje Točka Sreće, Mina i Karata računa se duplo brže.
  - **1.6x Veća Šansa za Bonus Simbole:** Povećana verovatnoća padanja scatter simbola (`coin`, `diamond`, `wheel`) na rilovima.

#### ⚡ Kupi Bonus ("Buy Bonus")
- Direktan ulazak u željeni bonus bez čekanja na punjenje metara ili slučajan pad:
  - **🎡 Točak Sreće:** Kupovina za **45x Ulog**. Odmah otvara Točak Sreće sa novčanim dobicima, Super Free Spinovima i šansom za Diamond Džekpot.
  - **💣 IGT Mini-Mines:** Kupovina za **35x Ulog**. Pokreće interaktivno minsko polje sa sakupljanjem dragulja i rastućim multiplikatorima pre naplate.
  - **⚡ Super Besplatni Spinovi:** Kupovina za **50x Ulog**. Dodeljuje **10 Besplatnih Spinova sa stalnim 2x Multiplikatorom** na sve dobitne linije.
- Cene se automatski računaju u realnom vremenu na osnovu uloga i izabrane denominacije.

#### 🏆 Turnirski Režim (120 Sekundi Izazov)
- **Brzinsko takmičenje:** Vremenski izazov od 2 minuta u kome igrač sakuplja poene za plasman na tabelu šampiona.
- **Turnirski krediti:** Igrač dobija poseban bankroll od **5.000 turnirskih kredita**.
- **Potpuna zaštita stvarnog salda:** Stvarni novac/krediti igrača se bezbedno čuvaju i vraćaju u celosti (100%) po završetku turnira.
- **HUD Traka na Ekranu:** Prikazuje preostalo vreme (`MM:SS`), trenutne poene i projektovani rang.
- **Lokalna Rang Lista:** Pamti najbolje rezultate u `localStorage` memoriji.

#### 🃏 Kockanje Kartama (Duplanje / Gamble)
- Izbor Crvena ili Crna karta sa verovatnoćom 50/50.
- **Stroga Kazna za Promašaj:** Ukoliko igrač promaši boju, **gubi sav dobitak iz tog spina i svih prethodnih duplanja (0 RSD)**.
- Istorijat prethodno izvučenih karata.

#### 💣 Mini-Mines Bonus u Slotu
- Aktivira se obrtom u igri ili direktnom kupovinom.
- **Kazna za Eksploziju:** Ako igrač nagazi na skrivenu minu, runda se prekida i **sav sakupljeni bonus dobitak se gubi**. Igrač sam odlučuje kada je trenutak za isplatu (Cashout).

#### 🎡 Točak Sreće (Wheel of Fortune)
- Luksuzni točak sa animiranim klinovima i pokazivačem.
- Sadrži polja sa multiplikatorima uloga (od 5x do 100x), Super Besplatne Spinove i Grand Jackpote.

---

### 📊 3. Matematički Model i Volatilnost

Aparat poseduje 4 profila volatilnosti koja se mogu menjati u realnom vremenu putem menija:

| Profil Volatilnosti | Procenjeni RTP | Učestalost Dobitaka | Pravila Isplate i Karakteristike |
| :--- | :---: | :---: | :--- |
| **Casino Standard** | ~96.0% | ~25.0% (1 od 4) | Standardna kazino industrijska matematika. Isplata za 2 simbola važi isključivo za zlatnike; ostali simboli traže punu liniju od 3 simbola. |
| **Niska Volatilnost** | ~97.0% | ~40.0% (1 od 2.5) | Češći manji dobici za opuštenu sesiju. 2 simbola plaćaju za zlatnike, zvona i sedmice. Brže otključavanje bonusa (350–700 RSD obrt). |
| **Visoka Volatilnost** | ~94.5% | ~16.5% (1 od 6) | Visok rizik i veći dobici. Nema isplate za 2 simbola (isključivo puna linija od 3 simbola). Svaki dobitak od 3 simbola isplaćuje **+50% veći iznos (1.5x Multiplier)**! |
| **Demo Prezentacija** | 100% | 100.0% (Svaki spin) | Promo režim za demonstraciju automata klijentima. Garantovan dobitak na svakom spinu, munjevito punjenje bonusa. |

#### 💰 Mystery Progressive Jackpoti (Skriveni Pragovi)
- **Silver:** Početna vrednost 50.00 RSD | Aktivan od 80.00 RSD | **Mora pasti do 100.00 RSD**
- **Gold:** Početna vrednost 200.00 RSD | Aktivan od 250.00 RSD | **Mora pasti do 400.00 RSD**
- **Diamond:** Početna vrednost 500.00 RSD | Aktivan od 600.00 RSD | **Mora pasti do 900.00 RSD**
- Fondovi rastu pri svakom spinu. Kada fond pređe skriveni prag, džekpot automatski pada i isplaćuje se igraču.

#### 🎚️ Denominacija Kredita
- Brzi izbor vrednosti jednog kredita: **0.2 RSD, 0.5 RSD, 1 RSD, 2 RSD, 4 RSD**.
- Dvostruki prikaz na ekranu: Broj kredita i stvarna dinarska protivvrednost.

---

### 🔊 4. Web Audio API Zvučni Sistem

Celokupan zvuk se generiše sintetički u realnom vremenu bez eksternih audio fajlova:
- **Mehanički Zvuk Zaustavljanja Rilova:** Kombinacija niskofrekventnog udarca solenoida (130Hz -> 32Hz), metalnog škljocaja zubaca (1450Hz -> 260Hz) i opružnog odskoka.
- **Las Vegas Kazino Ambijent:** Sintetizovani žamor kazino sale sa propusnim filterom na 420Hz u kombinaciji sa povremenim dalekim zvoncima slot aparata.
- **Dobitni Fanfari:** Melodični arpeđa, zveckanje kovanica i muzika za velike dobitke.

---

### 🚀 5. Pokretanje Aplikacije

1. **Klonirajte repozitorijum:**
   ```bash
   git clone https://github.com/bojankenobi/igtdemo.git
   cd igtdemo
   ```
2. **Pokrenite lokalni server:**
   Putem Python-a:
   ```bash
   python -m http.server 8000
   ```
   Ili putem Node.js:
   ```bash
   npx serve .
   ```
3. **Otvorite u pretraživaču:**
   Posetite `http://localhost:8000`.
4. **Instalacija PWA:**
   Kliknite na dugme **"INSTALIRAJ APP"** u dnu ekrana kako biste instalirali igru kao desktop ili mobilnu aplikaciju.
