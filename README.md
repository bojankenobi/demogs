# Grand Slot Club (GSC) - Luxury Multi-Game Casino Terminal & Slot Engine

[![Platform](https://img.shields.io/badge/Platform-HTML5%20%7C%20PWA-1a1107.svg)](#)
[![Design](https://img.shields.io/badge/Design-Grandslot%20Luxury%20Gold-ffd700.svg)](#)
[![Math](https://img.shields.io/badge/Math-IGT%20Certified%20RNG-f59e0b.svg)](#)
[![Performance](https://img.shields.io/badge/Performance-60--120%20FPS%20GPU-00e676.svg)](#)
[![Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API%20Synthesized-d4af37.svg)](#)

> 🌐 **Live Demo & Instant Play:** [https://bojankenobi.github.io/demogs/](https://bojankenobi.github.io/demogs/)  
> 🔐 **Operator Control Dashboard:** [https://bojankenobi.github.io/demogs/admin.html](https://bojankenobi.github.io/demogs/admin.html) *(Default PIN: `7777`)*  
> 📱 **Casino Staff Mobile QR Scanner:** [https://bojankenobi.github.io/demogs/scanner.html](https://bojankenobi.github.io/demogs/scanner.html)  
> 🔄 **CI/CD Deployment:** Automated via GitHub Actions workflow (`.github/workflows/deploy.yml`)  
> **Language / Jezik:** [English Documentation](#english-documentation) | [Srpska Dokumentacija](#srpska-dokumentacija)

---

<a name="english-documentation"></a>
## 🇬🇧 English Documentation

A high-performance Progressive Web Application (PWA) casino terminal engineered for land-based kiosks, desktop VIP screens, and mobile devices. The application synthesizes the prestige visual identity of **Grand Slot Club** (`#090a0f`, luxury dark obsidian, brushed brass, and polished 24K gold) with 100% authentic, certified **IGT slot mathematics, payout tables, RNG, and game mechanics**.

The software operates with **zero external dependencies** in native ES6+, featuring an authentic mechanical 3D slot cylinder with pull lever physics, customizable mathematical volatility profiles, dynamic mystery progressive jackpots, multi-tiered interactive bonus games, ante bet options, direct bonus buys, competitive 120s tournaments, a Web Push notification engine, and a live Monte Carlo RTP simulator.

---

### 🎰 1. Multigame Terminal Portfolio

The terminal features a VIP Multigame Cabinet Lobby accessible upon initial load or via the bottom navigation bar at any time:

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
4. **Grand Mines X (Standalone Arcade Crash Game):**
   - Arcade crash title with customizable grid sizes (**3x3, 5x5, 7x7, 8x8**).
   - Configurable mine density (1 to 24 mines) with mathematically calculated exponential multiplier ladders.
   - Safe tile picks, real-time potential win calculation, and one-click instant cashout.

---

### ⚡ 2. Core Game Mechanics & Advanced Features

#### 👑 Golden Bet / Ante Bet (+25% Stake)
- **Cabinet Switch:** Dedicated toggle located beside the bet controls.
- **Cost:** Adds **+25% to the current spin bet** (e.g., 20 credits base bet becomes 25 credits spin cost).
- **Player Advantage:**
  - **2x Accelerated Bonus Meter Charging:** Turnover contribution towards unlocking Točak Sreće, Mini-Mines, and Card Gamble accumulates at double speed.
  - **1.6x Boosted Scatter/Bonus Symbol Weights:** Higher probability of landing bonus symbols (`coin`, `diamond`, `wheel`).

#### ⚡ Buy Bonus Feature ("Kupi Bonus")
- Direct bonus purchases without waiting for meter fills or random reel drops:
  - **🎡 Točak Sreće (Wheel of Fortune):** Purchased for **45x Bet**. Instantly launches the Wheel of Fortune bonus modal with cash prizes, Super Free Spins, and jackpot eligibility.
  - **💣 Grand Mini-Mines Bonus:** Purchased for **35x Bet**. Launches the interactive minefield bonus where players uncover gems with escalating multipliers before cashing out.
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

#### 🎡 3D Wheel of Fortune (Točak Sreće)
- Luxury golden bezel wheel with authentic tick-peg pointer animation and flashing casino bulb surround.
- Segments include direct credit multipliers (5x to 100x), Super Free Spins, and Grand Jackpots.

#### 🔔 Push Notifications & In-App Retention
- Integrated Web Notifications API and Service Worker Push handlers (`sw.js`).
- Background away-timer: alerts players if they leave the tab for over 75 seconds with progressive jackpot reminders.
- Menu toggle with instant status indicator (`ON` / `OFF`).

#### 🏛️ Official Club Website Integration
- Direct link to Grand Slot Club's official web portal (`https://grandslotclub.rs/`) within the unified Casino Menu (`target="_blank"`), keeping the player's gaming session intact.

---

### 📊 3. Mathematical Model & RNG Volatility Engine

The math engine (`SlotMathManager`) provides four switchable profiles, each governing hit frequencies, symbol weight distributions, multiplier boosts, and bonus meter accumulation:

| Volatility Profile | Target RTP | Hit Frequency | Mathematical Characteristics & Rules |
| :--- | :---: | :---: | :--- |
| **Casino Standard** | ~96.0% | ~25.0% (1 in 4) | Authentic Vegas casino balance. 2-symbol payouts allowed exclusively for Gold Coins; all other symbols strictly require full 3-symbol lines. Turnover required: Cards 450 RSD, Mines 600 RSD, Wheel 850 RSD. |
| **Low Volatility** | ~97.0% | ~40.0% (1 in 2.5) | Frequent small payouts for relaxed gameplay. 2-symbol payouts active for coins, bells, and sevens. Lower bonus turnover requirements (Cards 350 RSD, Mines 500 RSD, Wheel 700 RSD). |
| **High Volatility** | ~94.5% | ~16.5% (1 in 6) | High adrenal tension. Strict requirement of 3 matching symbols on active paylines (no 2-symbol pays). Winning 3-matches award **+50% boosted payouts (1.5x Multiplier)**! Turnover: Cards 650 RSD, Mines 850 RSD, Wheel 1200 RSD. |
| **Demo Presentation** | 100% | 100.0% (Every spin) | Tailored for marketing showcases and client demos. Every spin is guaranteed to produce a winning combination. Ultra-fast meter charging (Cards 70 RSD, Mines 90 RSD, Wheel 130 RSD). |

#### ⚖️ Base Symbol Payouts & Standard Weights

| Symbol | Pay 3x | Pay 2x | Standard Weight | Low Weight | High Weight | Demo Weight |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Zlatni Cvet (Jackpot)** | 200x | — | 3 | 5 | 2 | 8 |
| **Kruna (Crown)** | 100x | — | 4 | 7 | 3 | 10 |
| **Zlatna Poluga (Bar)** | 50x | — | 6 | 8 | 5 | 12 |
| **Potkovica (Horseshoe)** | 30x | — | 8 | 11 | 7 | 14 |
| **Srećna Sedmica (Seven)** | 20x | 4x | 9 | 14 | 8 | 16 |
| **Zlatno Zvono (Bell)** | 15x | 3x | 12 | 18 | 12 | 18 |
| **Zlatnik (Coin)** | 10x | 2x | 16 | 22 | 24 | 20 |
| **Dijamant (Diamond Scatter)**| 25x | — | 10 | 14 | 6 | 16 |
| **Točak Sreće (Wheel Scatter)**| 15x | — | 3 | 4 | 2 | 8 |

#### 💰 Mystery Progressive Jackpots (Must-Drop-By Pragovi)
The jackpot manager (`CasinoJackpots`) implements a 3-tier mystery progressive system funded by a fractional turnover contribution on each paid spin:
- **Silver Tier:** Seeds at 50.00 RSD | Activates at 80.00 RSD | **Must Drop by 100.00 RSD**
- **Gold Tier:** Seeds at 200.00 RSD | Activates at 250.00 RSD | **Must Drop by 400.00 RSD**
- **Diamond Tier:** Seeds at 500.00 RSD | Activates at 600.00 RSD | **Must Drop by 900.00 RSD**

#### 🎚️ Dynamic Denomination Engine
- Selectable credit values: **0.2 RSD, 0.5 RSD, 1 RSD, 2 RSD, 4 RSD** per credit.
- Dual HUD display presenting both game Credits and real currency (RSD) equivalents.

#### ⚡ Real-Time Monte Carlo RTP Simulator
Built directly into the Operator Admin Panel, allowing casino operators to execute **10,000 to 100,000 spins in milliseconds** directly in the browser to verify exact mathematical RTP, hit rate, and maximum multiplier output under any custom symbol weight configuration.

---

### 🔊 4. Web Audio API Procedural Sound Engine

All audio effects are generated in real-time through the browser's Web Audio API with zero external sound files:
- **Mechanical Solenoid Stops:** Dual-layer acoustic synthesis simulating physical solenoid punch (low-frequency triangle drop, 130Hz -> 32Hz) combined with metallic ratchet pawl latch (sawtooth, 1450Hz -> 260Hz) and damped rebound oscillation.
- **Las Vegas Casino Floor Ambience:** Procedural pink noise filtered through bandpass room resonance (420Hz, Q 1.2) layered with periodic distant bell chimes simulating a lively casino floor.
- **Win Chimes & Cascades:** Harmonically tuned arpeggios, coin drops, and victory fanfares.

---

### 📁 5. Directory Structure

```
gsc/
├── api/                       # Vercel Serverless Function API endpoints
│   ├── _db.js                 # Neon Serverless PostgreSQL connector with demo fallback
│   ├── db/init.js             # One-click schema & index initializer
│   ├── players/sync.js        # Automatic player telemetry & push token upsert
│   ├── players/list.js        # Segmented player CRM directory & VIP status toggle
│   ├── push/send.js           # Smart Web Push dispatcher targeting segments or players
│   └── vouchers/              # Omnichannel O2O QR voucher & venue redemption API
│       ├── claim.js           # Interactive promo opt-in & personal voucher generator
│       ├── my.js              # Active & redeemed player voucher list
│       ├── redeem.js          # Staff scanner preview & atomic voucher redemption
│       └── scans.js           # Real-time venue audit log of redeemed club vouchers
├── assets/
│   ├── icons/                 # PWA icons (192x192, 512x512, maskable, favicon)
│   ├── symbols/               # SVG symbols (Flower, Bell, Bar, Seven, Crown, Coin, Diamond, Bomb)
│   └── logo.svg               # Official Grand Slot horizontal luxury logo
├── css/
│   ├── admin.css              # Standalone admin dashboard & CRM stylesheet
│   ├── scanner.css            # Casino staff mobile QR scanner stylesheet & reticle
│   └── style.css              # Grand Slot luxury player terminal stylesheet
├── js/
│   ├── core/
│   │   ├── admin.js           # Legacy embedded modal engine (backward compatibility)
│   │   ├── admin-bridge.js    # Decoupled zero-latency BroadcastChannel telemetry bridge
│   │   ├── bonus-features.js  # Free Spins manager, celebration FX, Buy Bonus engine
│   │   ├── gamble.js          # Red/Black card gamble game engine
│   │   ├── jackpots.js        # Progressive & mystery jackpot logic
│   │   ├── lobby.js           # Multi-game terminal switcher & carousel
│   │   ├── math-manager.js    # Volatility presets & payout configuration
│   │   ├── meters.js          # Dual turnover-based bonus meters
│   │   ├── notifications.js   # Web Push & in-app background retention manager
│   │   ├── player-tracker.js  # Player profile, persistent ID & backend auto-sync
│   │   ├── tournament.js      # 120s tournament engine, leaderboard & HUD
│   │   ├── wallet.js          # RSD / Credit wallet, Golden Bet toggle, denomination
│   │   └── wheel.js           # Wheel of Fortune bonus engine
│   ├── games/
│   │   ├── classic/           # 1-Line Classic retro stepper game
│   │   ├── royal3x3/          # Royal 3x3 multi-line game & SVG paylines
│   │   └── mines/             # Standalone Mines X & in-slot Mini-Mines bonus
│   ├── lib/
│   │   ├── peerjs.min.js      # P2P WebRTC data connection library
│   │   └── qrcode.min.js      # In-browser luxury VIP QR code generator
│   ├── admin-dashboard.js     # Standalone operator control dashboard & CRM controller
│   ├── app.js                 # Central orchestrator & promo voucher hub listener
│   ├── audio.js               # Web Audio API synthesizer & Vegas ambient engine
│   ├── i18n.js                # Bilingual localization (English / Serbian)
│   └── particles.js           # Canvas particle celebration burst FX
├── scripts/
│   └── generate-vapid.js      # Standalone Node.js script for generating VAPID keypairs
├── schema.sql                 # Neon PostgreSQL schema definition with performance indexes
├── package.json               # Backend dependencies (@neondatabase/serverless, web-push)
├── vercel.json                # Vercel serverless routing and headers configuration
├── .env.example               # Environment variables template for database & VAPID keys
├── index.html                 # Main player single-page slot terminal
├── admin.html                 # Standalone luxury operator control dashboard & CRM
├── scanner.html               # Standalone mobile QR scanner for casino staff
├── manifest.webmanifest       # PWA configuration manifest
├── sw.js                      # Service Worker for offline play & push notifications
├── start.bat                  # One-click Windows local server launcher
└── README.md                  # Comprehensive platform documentation
```

---

### 🚀 6. Installation & How to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bojankenobi/demogs.git
   cd demogs
   ```
2. **Launch the local server:**
   - **On Windows:** Double-click [`start.bat`](file:///c:/Users/marko/Downloads/GSC/start.bat) to automatically start a local server and launch your default browser.
   - **Using Python:**
     ```bash
     python -m http.server 8000
     ```
   - **Using Node.js:**
     ```bash
     npx serve .
     ```
3. **Open Player Terminal in browser:**
   Navigate to `http://localhost:8000` (or `http://localhost:8000/index.html`).
4. **Access Standalone Operator Admin Dashboard:**
   - **Direct URL:** Open `http://localhost:8000/admin.html` in a separate tab or on a secondary operator display.
   - **Cabinet Shortcut:** Press the **`~`** (Backquote) key or click the **Grand Slot logo 5 times** within 2.5 seconds on the slot screen. An in-game luxury PIN modal will prompt for operator authorization before opening the dashboard.
   - **Dual-Layer Operator PIN Security Suite:**
     - **Default Factory PIN:** `7777`
     - **Touch & Keyboard Keypad:** 4-digit luxury golden PIN pad with interactive dot indicators.
     - **Brute-Force Lockout:** Automatically imposes a **30-second lockout** after 5 consecutive incorrect attempts.
     - **5-Minute Auto-Lock Watchdog:** Automatically locks operator sessions upon 5 minutes of inactivity.
     - **Custom PIN Management:** Operators can change the 4-digit PIN directly in the "System & Settings" tab (`admin.html`) with instant cross-tab synchronization.
   - **Real-Time Cross-Tab Telemetry:** The operator dashboard and player terminal communicate bidirectionally with zero latency via `BroadcastChannel('grandslot_admin_channel')` and fallback `localStorage` synchronization:
     - Real-time balance, game mode, and progressive jackpot telemetry.
     - Live volatility presets & custom reel symbol weight updates.
     - Ultra-fast Monte Carlo RTP simulation (up to 100,000 spins/sec).
     - Remote triggers: instant jackpot drops, bonus launches, balance modifications, and remote game switching.
     - Marketing push notification broadcasts.

---

### 🌐 7. Free Cloud Hosting on GitHub Pages

The repository includes an automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

To activate your free online link:
1. Open the repository on GitHub: [https://github.com/bojankenobi/demogs](https://github.com/bojankenobi/demogs)
2. Go to **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment** > **Source**, choose **"GitHub Actions"**.
4. GitHub will automatically deploy your live links:
   - **Player Terminal:** [https://bojankenobi.github.io/demogs/](https://bojankenobi.github.io/demogs/)
   - **Operator Dashboard:** [https://bojankenobi.github.io/demogs/admin.html](https://bojankenobi.github.io/demogs/admin.html) *(Default PIN: `7777`)*

---


### 📱 8. Mobile & Cross-Device Remote Control (WebRTC PeerJS & QR Pairing)

Control physical slot terminals or remote screen displays directly from a mobile phone or tablet over the internet or local Wi-Fi:

1. **Access Operator Hub on the Slot Screen:**
   - Press **`~`** (Backquote) or click the **Grand Slot logo 5 times**.
   - Enter your 4-digit PIN (default: `7777`).
2. **Scan the Dynamic QR Code:**
   - The screen renders an on-screen QR code and a unique 6-character Room Code (e.g. `GSC-7842`).
   - Scan the QR code using any smartphone camera. It opens `admin.html?room=GSC-7842`.
3. **Instant Real-Time Control (<50ms):**
   - The phone connects directly to the slot terminal via an encrypted **WebRTC DataChannel** (PeerJS).
   - The operator can close the modal on the slot terminal so players continue playing, while the operator drops jackpots, triggers bonus rounds, tunes RTP, or monitors telemetry in real-time from anywhere in the venue!

---

### 👥 9. Central Player CRM Database & Smart Push Marketing Hub ("One Admin Changes All")

The platform features an enterprise-grade Serverless Marketing & CRM infrastructure designed on a **"one admin controls all"** principle, combining **Neon Serverless PostgreSQL** with **Vercel Serverless Functions** and the standard **W3C Web Push Protocol (RFC 8292 / VAPID)**.

#### 🏛️ Architecture & Database Design
- **Persistent Player Profiles (`players` table):**
  - Unique persistent player identity (`gsc_usr_XXXX`) preserved in device storage across browser sessions.
  - Automatically records turnover, spin count, total wins, favorite game, and device telemetry.
  - Stores standard W3C PushSubscription JSON payloads for real-time mobile and desktop notifications.
  - Tracks VIP loyalty membership (`STANDARD` vs `VIP`).
- **Marketing Push Logs (`push_campaigns` table):**
  - Keeps full audit logs of sent promotional campaigns, targeted segments, recipient counts, and timestamps.
- **Serverless API Layer (`api/`):**
  - `POST /api/players/sync`: Real-time player profile upsert and token sync.
  - `GET /api/players/list`: Live directory query with segmentation filtering (`all`, `vip`, `active_today`, `inactive`) and search.
  - `POST /api/players/list`: Instant operator toggle of player VIP status.
  - `POST /api/push/send`: Multi-targeted Web Push dispatch engine with cryptographic VAPID signing.
  - `POST /api/db/init`: Idempotent schema initialization tool creating tables and indexes in Neon.

#### 🎯 Smart Promotional Push Rewards (Direct In-Game Action)
Unlike ordinary static notifications, Grand Slot Club push notifications are actionable and can deliver real rewards directly into the player's session when clicked:
- **🎰 Free Spins Rewards (`free_spins:10` / `free_spins:25`):** Clicking the notification automatically opens the game and activates a 10 or 25 Free Spins session with a persistent **2x Win Multiplier** and celebratory particle fireworks.
- **🎁 Instant Credit Bonuses (`credit_bonus:200` / `credit_bonus:500` / `credit_bonus:1000`):** Automatically credits the bonus amount in RSD directly into the player's wallet balance with coin drop sound effects.
- **Dual Delivery System:** Works seamlessly via Service Worker `postMessage` if the player already has a slot window open, or via secure URL query parameters (`?promo_action=...&promo_val=...`) if launched afresh from a locked phone screen.

#### ⚙️ Quick Setup Guide (Neon & Vercel)
1. **Neon PostgreSQL:**
   - Create a free serverless database at [Neon.tech](https://neon.tech).
   - Copy your connection string (`postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).
2. **Generate VAPID Keys:**
   ```bash
   node scripts/generate-vapid.js
   ```
3. **Deploy on Vercel:**
   - Import the repository into [Vercel](https://vercel.com).
   - In **Project Settings > Environment Variables**, add:
     - `DATABASE_URL`: Your Neon connection string
     - `VAPID_PUBLIC_KEY`: Generated public key
     - `VAPID_PRIVATE_KEY`: Generated private key
     - `VAPID_EMAIL`: `mailto:support@grandslotclub.rs`
4. **Initialize Database:**
   - Call `/api/db/init` (or execute `schema.sql` directly in the Neon SQL console).
   - The system includes a realistic demo fallback mode, ensuring zero crashes even when running locally without active cloud database credentials!

---

### 🎫 10. Omnichannel O2O Marketing: Interactive Promotions, VIP QR Vouchers & Club Mobile Scanner

To seamlessly bridge online mobile/desktop gameplay with physical Grand Slot Club casino locations, the platform features a complete **Online-to-Offline (O2O) Omnichannel Marketing Suite**:

#### 📱 1. Interactive Promotional Opt-In & VIP Voucher Issuance
- **Rich Push / In-Game Promotion Modal:**
  - Players receive targeted push campaigns with luxury banners, descriptions, and opt-in buttons (`[ PRIJAVI SE ZA PROMOCIJU ]`).
  - Opting in triggers `/api/vouchers/claim` to generate a personalized cryptographic VIP voucher with a unique alphanumeric identifier (`GSC-VOUCH-XXXX`).
- **Luxury Personalized VIP Voucher Card (`#vip-voucher-modal`):**
  - **Player Identity:** Automatically stamps the player's alias, VIP tier, and issue date.
  - **Dynamic In-Browser QR Code:** Generated locally with zero external network requests using `qrcode.min.js`.
  - **Live Countdown Expiry Timer:** Displays active remaining hours, minutes, and seconds until the voucher expires.
  - **Venue & Reward Info:** Shows the exact club location (e.g. *Grand Slot Club - Glavna Filijala*) and reward details (e.g. *1.000 RSD za slot aparate*, *VIP Welcome Drink na šanku*, or *Turnirska ulaznica*).
  - **Player Voucher Hub:** Players can reopen their active voucher at any time via the top HUD button (`[ 🎫 Vaučer ]`) or Casino Menu (`[ 🎫 Moji VIP Vaučeri & Promocije ]`).

#### 📷 2. Casino Staff Mobile Scanner (`scanner.html`)
- **Dedicated Light-Weight Web App:**
  - Venue hosts, bartenders, and floor operators navigate to `scanner.html` on their smartphones or casino floor tablets.
  - **Shift Authorization:** Quick sign-in with Operator Name (e.g. *Marko - Šank 1*) and Club Location.
  - **Hardware Camera Viewfinder:** High-performance video scanner utilizing the browser's native `BarcodeDetector` API with continuous framing reticle and gold laser sweep animation.
  - **Manual Barcode Gun / Keyboard Fallback:** Instant alphanumeric input field supporting handheld 2D Bluetooth/USB laser scanners or manual entry when camera access is restricted.
  - **Web Audio Sound Effects:** Real-time dual-tone synthesizer feedback:
    - *Success Tone (C5 -> G5 chord)*: Valid voucher detected.
    - *Error Tone (low tritone drop)*: Expired, duplicate, or invalid voucher.

#### 🛡️ 3. Two-Step Verification & Anti-Fraud Database Redemption
1. **Inspection Step (`confirm: false`):** The scanner reads the QR code and instantly fetches voucher status from Neon PostgreSQL without marking it as spent. The staff screen displays a green verification card with player name, VIP status, reward value, and location.
2. **Atomic Execution Step (`confirm: true`):** The operator taps the prominent green button `[ ✅ POTVRDI IZDAVANJE VAUČERA ]`. The backend atomically updates the voucher:
   ```sql
   UPDATE vouchers
   SET status = 'REDEEMED',
       redeemed_at = NOW(),
       redeemed_by_operator = 'Marko - Šank 1',
       redeemed_location = 'Grand Slot Club - Glavna Filijala'
   WHERE voucher_code = '...' AND status = 'ACTIVE';
   ```
3. **Double-Spend Prevention:** Once redeemed, scanning the voucher again immediately triggers a red `🔴 ODBIJENO / NEVAŽEĆI` alert detailing when and by whom it was previously claimed.

#### 📊 4. Central Admin Panel Live Audit Log (`admin.html`)
- **VIP Campaign Presets:** Operator can dispatch one-click promotions:
  - 🎁 *VIP Promo Tiket 1.000 RSD za aparate u klubu*
  - 🍸 *VIP Welcome Drink & Koktel na šanku*
  - 🏆 *VIP Ulaznica za 120s Kazino Turnir*
  - 🎂 *Rođendanski Keš Poklon u Kazinu (2.000 RSD)*
  - 🎨 *Prilagođena kampanja (Custom image URL, copy, and venue location)*
- **Live Scans Audit Log Table:** Real-time log displaying verified club visits (`/api/vouchers/scans`):
  - Timestamp, Player Name & ID, Voucher Code, Reward Type/Value, Staff Member, Club Location, and Status.
  - Provides club management with complete visibility into customer foot traffic driven by online marketing campaigns.

---
---

<a name="srpska-dokumentacija"></a>
## 🇷🇸 Srpska Dokumentacija

Visokoperformantna web i PWA (Progressive Web Application) slot platforma dizajnirana za kazino terminale, touch kabinete, računare i mobilne uređaje. Aplikacija objedinjuje prepoznatljivi luksuzni vizuelni identitet **Grand Slot Club-a** (duboki opsidijan, tople jantarne nijanse i 24K polirano zlato) sa 100% autentičnom, sertifikovanom **IGT slot matematikom, isplatnim tabelama, RNG generatorom i proverenim mehaničkim funkcijama**.

Sistem radi **bez eksternih biblioteka i zavisnosti** (čist ES6+ JavaScript), poseduje verni mehanički 3D cilindar automata sa fizikom povlačenja ručice, 4 fabrička matematička profila volatilnosti, progresivne Mystery džekpote sa zagarantovanim pragom pada, interaktivne bonus igre, opciju uloga sa ubrzanim punjenjem (Golden Bet), direktnu kupovinu bonusa (Buy Bonus), brzinski 120s turnirski režim, push notifikacije i integrisan Monte Carlo RTP simulator.

---

### 🎰 1. Multigame Portfolio Igara

Terminal poseduje VIP Casino lobi za izbor igara, dostupan pri startu ili u bilo kom trenutku preko donjeg menija:

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
4. **Grand Mines X (Zasebna Crash Arkada):**
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
  - **💣 Grand Mini-Mines:** Kupovina za **35x Ulog**. Pokreće interaktivno minsko polje sa sakupljanjem dragulja i rastućim multiplikatorima pre naplate.
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

#### 🎡 3D Točak Sreće (Wheel of Fortune)
- Luksuzni točak sa animiranim klinovima, iglom i treptućim perimeter sijalicama.
- Sadrži polja sa multiplikatorima uloga (od 5x do 100x), Super Besplatne Spinove i Grand Jackpote.

#### 🔔 Push Notifikacije i Angažovanje Igrača
- Integrisan Web Notifications API i Service Worker podrška (`sw.js`).
- Pozadinski tajmer neaktivnosti (75s): diskretno šalje obaveštenje igraču ukoliko se udalji od taba kako bi se vratio na rastući džekpot fond.
- Podešavanje unutar Glavnog Menija (`ON` / `OFF`).

#### 🏛️ Zvanični Portal Kluba
- Direktan link ka zvaničnom web portalu Grand Slot Club-a (`https://grandslotclub.rs/`) unutar Glavnog Menija (`target="_blank"`), bez prekidanja sesije na slotu.

---

### 📊 3. Matematički Model i Volatilnost

Matematički modul (`SlotMathManager`) definiše četiri matematička profila koji precizno diktiraju hit rate, težine simbola, obrt za punjenje bonusa i isplate:

| Profil Volatilnosti | Procenjeni RTP | Učestalost Dobitaka | Pravila Isplate i Karakteristike |
| :--- | :---: | :---: | :--- |
| **Casino Standard** | ~96.0% | ~25.0% (1 od 4) | Standardna kazino industrijska matematika. Isplata za 2 simbola važi isključivo za zlatnike; ostali simboli traže punu liniju od 3 simbola. Potreban obrt: Karte 450 RSD, Mine 600 RSD, Točak 850 RSD. |
| **Niska Volatilnost** | ~97.0% | ~40.0% (1 od 2.5) | Češći manji dobici za opuštenu sesiju. 2 simbola plaćaju za zlatnike, zvona i sedmice. Brže otključavanje bonusa (Karte 350 RSD, Mine 500 RSD, Točak 700 RSD). |
| **Visoka Volatilnost** | ~94.5% | ~16.5% (1 od 6) | Visok adrenalinski rizik. Nema isplate za 2 simbola (isključivo puna linija od 3 simbola). Svaki dobitak od 3 simbola isplaćuje **+50% veći iznos (1.5x Multiplier)**! Potreban obrt: Karte 650 RSD, Mine 850 RSD, Točak 1200 RSD. |
| **Demo Prezentacija** | 100% | 100.0% (Svaki spin) | Promo režim za demonstraciju automata klijentima. Garantovan dobitak na svakom spinu, munjevito punjenje bonusa (Karte 70 RSD, Mine 90 RSD, Točak 130 RSD). |

#### ⚖️ Isplatne Vrednosti i Težine Simbola (Weights)

| Simbol | Isplata 3x | Isplata 2x | Standard Težina | Low Težina | High Težina | Demo Težina |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Zlatni Cvet (Jackpot)** | 200x | — | 3 | 5 | 2 | 8 |
| **Kruna (Crown)** | 100x | — | 4 | 7 | 3 | 10 |
| **Zlatna Poluga (Bar)** | 50x | — | 6 | 8 | 5 | 12 |
| **Potkovica (Horseshoe)** | 30x | — | 8 | 11 | 7 | 14 |
| **Srećna Sedmica (Seven)** | 20x | 4x | 9 | 14 | 8 | 16 |
| **Zlatno Zvono (Bell)** | 15x | 3x | 12 | 18 | 12 | 18 |
| **Zlatnik (Coin)** | 10x | 2x | 16 | 22 | 24 | 20 |
| **Dijamant (Scatter)** | 25x | — | 10 | 14 | 6 | 16 |
| **Točak Sreće (Scatter)** | 15x | — | 3 | 4 | 2 | 8 |

#### 💰 Mystery Progressive Jackpoti (Skriveni Pragovi)
Džekpot sistem (`CasinoJackpots`) radi po principu akumulacije procenta uloga sa skrivenim gornjim pragom pada:
- **Silver:** Početna vrednost 50.00 RSD | Aktivan od 80.00 RSD | **Mora pasti do 100.00 RSD**
- **Gold:** Početna vrednost 200.00 RSD | Aktivan od 250.00 RSD | **Mora pasti do 400.00 RSD**
- **Diamond:** Početna vrednost 500.00 RSD | Aktivan od 600.00 RSD | **Mora pasti do 900.00 RSD**

#### 🎚️ Denominacija Kredita
- Brzi izbor vrednosti jednog kredita: **0.2 RSD, 0.5 RSD, 1 RSD, 2 RSD, 4 RSD**.
- Dvostruki prikaz na ekranu: Broj kredita i stvarna dinarska protivvrednost.

#### ⚡ Monte Carlo RTP Simulator
Ugrađen u tajni Admin Panel: operater može pokrenuti **10.000 do 100.000 spinova u sekundi** kako bi matematički verifikovao stvarni realizovani RTP i frekvenciju pogodaka.

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
   git clone https://github.com/bojankenobi/demogs.git
   cd demogs
   ```
2. **Pokrenite lokalni server:**
   - **Na Windows-u:** Dvaput kliknite na fajl [`start.bat`](file:///c:/Users/marko/Downloads/GSC/start.bat) — automatski se podiže lokalni server i otvara igra u podrazumevanom pretraživaču.
   - **Putem Python-a:**
     ```bash
     python -m http.server 8000
     ```
   - **Ili putem Node.js:**
     ```bash
     npx serve .
     ```
3. **Otvorite slot terminal u pretraživaču:**
   Posetite `http://localhost:8000` (ili `http://localhost:8000/index.html`).
4. **Pristup Zasebnom Operaterskom Admin Panelu:**
   - **Direktna adresa:** Otvorite `http://localhost:8000/admin.html` u posebnom tabu, prozoru ili na sekundarnom operaterskom ekranu.
   - **Prečica sa aparata:** Pritisnite taster **`~`** (tilda) na tastaturi ili kliknite **5 puta na Grand Slot logo** unutar 2.5 sekunde na ekranu slota — slot mašina otvara luksuzni modalni PIN pad za autorizaciju pre pristupa dashboardu.
   - **Dvoslojni Bezbednosni PIN Sistem:**
     - **Fabrički podrazumevani PIN:** `7777`
     - **Interaktivni PIN Pad:** Zlatna numerička tastatura na dodir i tastaturu sa 4 tačkasta indikatora.
     - **Zaštita od pogađanja (Brute-Force):** Nakon 5 netačnih unosa, sistem uvodi **privremenu blokadu od 30 sekundi** sa odbrojavanjem.
     - **Auto-Lock neaktivnosti:** Automatsko zaključavanje sesije nakon 5 minuta neaktivnosti.
     - **Promena PIN koda:** Operater može u svakom trenutku promeniti 4-cifreni PIN u tabu "Sistem & Povezivanje" (`admin.html`), uz trenutnu sinhronizaciju sa slotom.
   - **Dvosmerna telemetrija u realnom vremenu:** Zasebni admin panel i slot igra komuniciraju u realnom vremenu bez kašnjenja preko `BroadcastChannel('grandslot_admin_channel')` mehanizma (uz automatsku sinhronizaciju kroz `localStorage`):
     - **Telemetrija uživo:** Prikaz statusa konekcije, stanja kredita igrača, aktivne igre, profila volatilnosti i trenutnih iznosa Silver/Gold/Diamond džekpota.
     - **Profili i težine simbola:** Menjanje RTP profila u letu i fino podešavanje verovatnoća simbola na rilovima.
     - **Brzinski Monte Carlo simulator:** Testiranje od 1.000 do 100.000 spinova u sekundi za trenutnu proveru ostvarenog RTP-a i frekvencije pogodaka.
     - **Daljinsko forsiranje (Triggers):** Trenutno okidanje pada džekpota, aktivacija Točka Sreće, Mini-Mina ili Super Besplatnih Spinova, promena stanja novčanika i daljinsko prebacivanje igre igraču.
     - **Slanje push notifikacija:** Slanje promotivnih i sistemskih obaveštenja povezanim igračima.

---

### 🌐 6. Besplatno Online Pokretanje na GitHub Pages

Repozitorijum sadrži pripremljen GitHub Actions workflow (`.github/workflows/deploy.yml`) za automatski deploy.

Za aktivaciju javnog online linka potrebno je samo:
1. Otvorite repozitorijum na GitHub-u: [https://github.com/bojankenobi/demogs](https://github.com/bojankenobi/demogs)
2. Uđite u **Settings** > **Pages** (u levom meniju).
3. Pod stavkom **Build and deployment** > **Source**, izaberite **"GitHub Actions"**.
4. GitHub će automatski objaviti sajt na javnim linkovima:
   - **Igra za igrače:** [https://bojankenobi.github.io/demogs/](https://bojankenobi.github.io/demogs/)
   - **Operaterski Admin Dashboard:** [https://bojankenobi.github.io/demogs/admin.html](https://bojankenobi.github.io/demogs/admin.html) *(PIN: `7777`)*

---

### 📱 7. Daljinsko Upravljanje sa Telefona i Tableta (WebRTC & QR Kod)

Upravljajte slot terminalom ili javnim ekranom direktno sa mobilnog telefona ili tableta preko interneta ili Wi-Fi mreže bez ikakvog servera:

1. **Otvorite Operaterski Hub na slotu:**
   - Pritisnite **`~`** (tilda) na tastaturi ili kliknite **5 puta na logo**.
   - Unesite 4-cifreni PIN (fabrički: `7777`).
2. **Skenirajte dinamički QR kod:**
   - Na ekranu slota pojavljuje se veliki QR kod i 6-cifrena šifra sobe (npr. `GSC-7842`).
   - Skenirajte QR kod kamerom bilo kog pametnog telefona — otvara se admin panel povezan na taj aparat.
3. **Trenutna dvosmerna kontrola uživo (<50ms):**
   - Telefon uspostavlja direktnu enkriptovanu **WebRTC DataChannel** vezu (PeerJS) sa slot mašinom.
   - Operater može zatvoriti prozor na slotu kako bi igrači nesmetano igrali, dok sa svog telefona u realnom vremenu prati stanje, daljinski pušta džekpote, aktivira Točak Sreće ili menja profile volatilnosti!

---

### 👥 8. Centralna Baza Korisnika (CRM) i Smart Push Marketing ("Jedan Admin Menja Sve")

Platforma implementira naprednu Serverless CRM i Web Push marketing infrastrukturu zasnovanu na principu **"jedan centralni admin menja sve"**, povezujući **Neon Serverless PostgreSQL** bazu podataka, **Vercel Serverless Functions** i standardni **W3C Web Push protokol (RFC 8292 / VAPID)**.

#### 🏛️ Arhitektura i Baza Podataka
- **Stalni Profili Igrača (`players` tabela):**
  - Svaki uređaj/igrač dobija trajni identifikator (`gsc_usr_XXXX`) koji se čuva u memoriji pretraživača.
  - Automatski beleži ukupan obrt (turnover), broj spinova, dobitke, omiljenu igru i tehničke podatke uređaja.
  - Čuva standardne W3C PushSubscription tokene za isporuku obaveštenja na telefone i računare.
  - Podržava VIP lojaliti status (`STANDARD` i `VIP`).
- **Istorijat Marketinških Kampanja (`push_campaigns` tabela):**
  - Beleži sve poslate push kampanje, ciljane segmente korisnika, broj primalaca i tačan datum slanja.
- **Serverless API Sloj (`api/`):**
  - `POST /api/players/sync`: Automatska sinhronizacija metrike igrača i push tokena pri spinovima.
  - `GET /api/players/list`: Brza pretraga i segmentacija korisnika (`all`, `vip`, `active_today`, `inactive`).
  - `POST /api/players/list`: Jednim klikom operater dodeljuje ili ukida VIP status igraču.
  - `POST /api/push/send`: Sistem za slanje Web Push notifikacija sa kriptografskim VAPID potpisivanjem.
  - `POST /api/db/init`: Automatska inicijalizacija tabela i indeksa u Neon PostgreSQL bazi.

#### 🎯 Smart Promotivne Push Nagrade (Direktna Akcija u Igri)
Za razliku od klasičnih tekstualnih obaveštenja, Grand Slot Club notifikacije nose interaktivne promotivne nagrade koje se aktiviraju samim klikom igrača na poruku:
- **🎰 Poklon Besplatni Spinovi (`free_spins:10` / `free_spins:25`):** Klik na notifikaciju automatski otvara igru i pokreće sesiju od 10 ili 25 Besplatnih Spinova sa trajnim **2x Množiocem dobitka** i konfetama.
- **🎁 Instant Keš Bonusi (`credit_bonus:200` / `credit_bonus:500` / `credit_bonus:1000`):** Automatski dopunjuje dinarski račun igrača (+200, +500 ili +1.000 RSD) uz prateći zvučni efekat kovanica.
- **Dvostruka Isporuka:** Radi trenutno preko Service Worker `postMessage` mehanizma ukoliko je igraču igra već otvorena, ili preko bezbednih URL parametara (`?promo_action=...&promo_val=...`) ukoliko igrač klikne na notifikaciju dok mu je telefon bio zaključan.

#### ⚙️ Uputstvo za Podešavanje (Neon & Vercel)
1. **Neon PostgreSQL Baza:**
   - Napravite besplatan nalog i bazu na [Neon.tech](https://neon.tech).
   - Kopirajte connection string (`postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).
2. **Generisanje VAPID Ključeva:**
   ```bash
   node scripts/generate-vapid.js
   ```
3. **Objavljivanje na Vercel:**
   - Povežite repozitorijum sa [Vercel](https://vercel.com) platformom.
   - U sekciji **Project Settings > Environment Variables** dodajte:
     - `DATABASE_URL`: Vaš Neon connection string
     - `VAPID_PUBLIC_KEY`: Generisani javni VAPID ključ
     - `VAPID_PRIVATE_KEY`: Generisani privatni VAPID ključ
     - `VAPID_EMAIL`: `mailto:support@grandslotclub.rs`
4. **Inicijalizacija Baze:**
   - Pokrenite `/api/db/init` (ili unesite upite iz `schema.sql` direktno u Neon SQL konzoli).
   - Sistem sadrži ugrađeni realistični simulacioni režim koji garantuje nesmetan rad čak i u lokalnom razvoju pre unosa cloud ključeva!

---

### 🎫 9. Omnichannel (O2O) Marketing: Interaktivne Promocije, VIP QR Vaučeri i Mobilni Skener za Osoblje Kluba

Kako bi se premostio jaz između online igranja na mobilnim telefonima/računarima i fizičkih lokacija Grand Slot Club kazina, razvijen je kompletan **Online-to-Offline (O2O) Omnichannel sistem**:

#### 📱 1. Interaktivna Prijava za Promociju i VIP Vaučer Karta
- **Push Notifikacija i Promotivni Prozor u Igri:**
  - Igrači dobijaju obaveštenje sa slikom promocije i dugmetom za prijavu (`[ PRIJAVI SE ZA PROMOCIJU ]`).
  - Klikom na prijavu poziva se `/api/vouchers/claim` koji igraču generiše personalizovani kriptografski VIP vaučer (`GSC-VOUCH-XXXX`).
- **Luksuzna VIP Vaučer Karta (`#vip-voucher-modal`):**
  - **Podaci o Igraču:** Automatski ispisuje nadimak igrača, VIP status i datum izdavanja.
  - **Dinamički QR Kod:** Generisan u samom pretraživaču preko biblioteke `qrcode.min.js` bez spoljnih servera.
  - **Odbrojavanje Uživo (Countdown Timer):** Prikazuje sate, minute i sekunde do isteka važenja vaučera.
  - **Lokacija i Nagrada:** Navodi tačan klub gde se nagrada preuzima (npr. *Grand Slot Club - Glavna Filijala*) i vrstu nagrade (npr. *1.000 RSD promo tiket*, *VIP Welcome Drink* ili *Turnirska ulaznica*).
  - **Brzi Pristup:** Igrač može otvoriti svoj vaučer u svakom trenutku preko svetlećeg dugmeta u gornjoj traci (`[ 🎫 Vaučer ]`) ili kroz Kazino Meni (`[ 🎫 Moji VIP Vaučeri & Promocije ]`).

#### 📷 2. Mobilni Skener za Osoblje i Šankere Kazina (`scanner.html`)
- **Samostalna Web Aplikacija za Telefone:**
  - Domaćini, šankeri i blagajnici otvaraju `scanner.html` na svom pametnom telefonu ili tabletu.
  - **Prijava Smene:** Brz unos imena operatera (npr. *Marko - Šank 1*) i lokacije kluba.
  - **Kamera sa Ciljnikom i Zlatnim Laserom:** Koristi brzi `BarcodeDetector` API za trenutno automatsko očitavanje QR koda sa ekrana telefona gosta.
  - **Ručni Unos i Podrška za Barcode Pištolje:** Polje za ručni unos koda ili povezivanje sa USB/Bluetooth skenerom.
  - **Sintetizovani Zvučni Signali (Web Audio API):**
    - *Prijatan akord (C5 -> G5)*: Vaučer je validan.
    - *Duboki ton upozorenja*: Vaučer je istekao, neispravan ili već iskorišćen.

#### 🛡️ 3. Dvoetapna Verifikacija i Sprečavanje Zloupotreba
1. **Pregled bez poništavanja (`confirm: false`):** Skener prvo samo proverava status vaučera u Neon PostgreSQL bazi. Operateru se prikazuje zelena kartica sa podacima igrača i iznosom.
2. **Zvanična Overa (`confirm: true`):** Operater pritiska veliko zeleno dugme `[ ✅ POTVRDI IZDAVANJE VAUČERA ]`. Sistem u bazi trajno menja status:
   ```sql
   UPDATE vouchers
   SET status = 'REDEEMED',
       redeemed_at = NOW(),
       redeemed_by_operator = 'Marko - Šank 1',
       redeemed_location = 'Grand Slot Club - Glavna Filijala'
   WHERE voucher_code = '...' AND status = 'ACTIVE';
   ```
3. **Zaštita od Duplog Korišćenja:** Ukoliko igrač ponovo pokuša da prikaže isti vaučer, skener odmah prikazuje crveno upozorenje `🔴 ODBIJENO / NEVAŽEĆI` uz tačno vreme kada je i kod kog operatera vaučer već iskorišćen.

#### 📊 4. Dnevnik Uživo u Centralnom Admin Panelu (`admin.html`)
- **VIP Šabloni Promocija:** Operater jednim klikom bira unapred definisane akcije:
  - 🎁 *VIP Promo Tiket 1.000 RSD za aparate u klubu*
  - 🍸 *VIP Welcome Drink & Koktel na šanku*
  - 🏆 *VIP Ulaznica za 120s Kazino Turnir*
  - 🎂 *Rođendanski Keš Poklon u Kazinu (2.000 RSD)*
  - 🎨 *Prilagođena kampanja (Custom slika, tekst i lokacija)*
- **Tabela Overenih Dolazaka (Audit Log):** Pregled svih realizovanih poseta kazinu (`/api/vouchers/scans`):
  - Vreme overe, Ime i ID igrača, Kod vaučera, Nagrada/Iznos, Ime operatera, Lokacija kluba i Status.
  - Menadžment kluba u svakom trenutku ima jasan uvid u to koliko je gostiju privučeno iz online aplikacije u fizičke objekte.

