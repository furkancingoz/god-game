import { formatFaith } from '../faith/FaithSystem.js';

export class HUD {
  constructor(container, onSelectPower, onOpenSpellbook, onSpeedChange, onOpenReligion) {
    this.container = container;
    this.onSelectPower = onSelectPower;
    this.onOpenSpellbook = onOpenSpellbook;
    this.onSpeedChange = onSpeedChange;
    this.onOpenReligion = onOpenReligion;
    this.activePower = 'sculpt';

    this.container.innerHTML = `
      <!-- Top Header Dashboard -->
      <div id="hud-header">
        <div class="hud-card faith-card">
          <div class="stat-icon">✨</div>
          <div class="stat-info">
            <span class="stat-label">İNAÇ</span>
            <span class="stat-value" data-role="faith">0</span>
          </div>
        </div>

        <div class="hud-card res-card">
          <div class="res-item" title="Odun">🪵 <span data-role="wood">25</span></div>
          <div class="res-item" title="Yiyecek">🌾 <span data-role="food">30</span></div>
          <div class="res-item" title="Taş">🪨 <span data-role="stone">10</span></div>
        </div>

        <div class="hud-card level-card">
          <div class="stat-info">
            <span class="stat-label" data-role="tier-title">PEYGAMBER</span>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" data-role="tier-progress" style="width: 0%;"></div>
            </div>
          </div>
        </div>

        <div class="hud-card pop-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-label">NÜFUS</span>
            <span class="stat-value" data-role="population">0</span>
          </div>
        </div>

        <!-- Clock & Controls -->
        <div class="hud-card clock-card">
          <span class="clock-val" data-role="clock">12:00</span>
          <div class="time-btns">
            <button data-speed="0">⏸️</button>
            <button data-speed="1" class="active">▶️</button>
            <button data-speed="2">⏩</button>
          </div>
        </div>

        <button class="hud-card spellbook-btn" id="open-religion" title="Din & Peygamber Gelişimi (Plague Inc)">☣️</button>
        <button class="hud-card spellbook-btn" id="open-spellbook" title="Mucize Kitabı">📖</button>
      </div>

      <!-- Toast Notifications -->
      <div id="toast-banner"></div>

      <!-- Bottom Divine Action Bar -->
      <div id="hud-dock">
        <button class="dock-btn active" data-power="sculpt" title="Toprak Şekillendir (Kısayol: 1)">
          <span class="btn-icon">⛰️</span>
          <span class="btn-name">Şekillendir</span>
          <span class="btn-key">1</span>
        </button>

        <button class="dock-btn" data-power="rain" title="Bereket Yağmuru (Kısayol: 2)">
          <span class="btn-icon">🌧️</span>
          <span class="btn-name">Yağmur</span>
          <span class="btn-key">2</span>
        </button>

        <button class="dock-btn" data-power="sun" title="Kutsal Güneş (Kısayol: 3)">
          <span class="btn-icon">☀️</span>
          <span class="btn-name">Güneş</span>
          <span class="btn-key">3</span>
        </button>

        <button class="dock-btn" data-power="fire" title="İlahi Ateş (Kısayol: 4)">
          <span class="btn-icon">🔥</span>
          <span class="btn-name">Ateş</span>
          <span class="btn-key">4</span>
        </button>

        <button class="dock-btn" data-power="bless" title="Köy Kutsaması (Kısayol: 5)">
          <span class="btn-icon">🏠</span>
          <span class="btn-name">Kutsama</span>
          <span class="btn-key">5</span>
        </button>

        <button class="dock-btn" data-power="meteor" title="Göktaşı Çarpması (Kısayol: 6)">
          <span class="btn-icon">☄️</span>
          <span class="btn-name">Göktaşı</span>
          <span class="btn-key">6</span>
        </button>
      </div>
    `;

    this.faithEl = this.container.querySelector('[data-role="faith"]');
    this.woodEl = this.container.querySelector('[data-role="wood"]');
    this.foodEl = this.container.querySelector('[data-role="food"]');
    this.stoneEl = this.container.querySelector('[data-role="stone"]');
    this.populationEl = this.container.querySelector('[data-role="population"]');
    this.tierTitleEl = this.container.querySelector('[data-role="tier-title"]');
    this.tierProgressEl = this.container.querySelector('[data-role="tier-progress"]');
    this.clockEl = this.container.querySelector('[data-role="clock"]');
    this.toastEl = this.container.querySelector('#toast-banner');

    // Attach click listeners to dock buttons
    this.dockButtons = this.container.querySelectorAll('.dock-btn');
    this.dockButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const power = btn.getAttribute('data-power');
        this.setActivePower(power);
      });
    });

    // Time speed buttons
    const speedBtns = this.container.querySelectorAll('.time-btns button');
    speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        speedBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.getAttribute('data-speed'));
        if (this.onSpeedChange) this.onSpeedChange(speed);
      });
    });

    // Open Religion Evolution (Plague Inc mode)
    this.container.querySelector('#open-religion').addEventListener('click', () => {
      if (this.onOpenReligion) this.onOpenReligion();
    });

    // Open Spellbook
    this.container.querySelector('#open-spellbook').addEventListener('click', () => {
      if (this.onOpenSpellbook) this.onOpenSpellbook();
    });

    // Keyboard shortcuts 1-6
    window.addEventListener('keydown', (e) => {
      const keyToPower = { '1': 'sculpt', '2': 'rain', '3': 'sun', '4': 'fire', '5': 'bless', '6': 'meteor' };
      if (keyToPower[e.key]) {
        this.setActivePower(keyToPower[e.key]);
      }
    });

    this.showNotification("Adada yaşam başladı! Takipçilerini gözet.", 4000);
  }

  setActivePower(power) {
    this.activePower = power;
    this.dockButtons.forEach((btn) => {
      if (btn.getAttribute('data-power') === power) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (this.onSelectPower) this.onSelectPower(power);
  }

  showNotification(text, duration = 3000) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, duration);
  }

  update({ faith, population, worshippers, resources, timeString }) {
    this.faithEl.textContent = formatFaith(faith);
    this.populationEl.textContent = `${population} (${worshippers} İbadette)`;
    if (resources) {
      this.woodEl.textContent = Math.floor(resources.wood);
      this.foodEl.textContent = Math.floor(resources.food);
      this.stoneEl.textContent = Math.floor(resources.stone);
    }
    if (timeString) this.clockEl.textContent = timeString;

    // Tier calculation
    let tierName = 'PEYGAMBER';
    let progress = (faith / 200) * 100;
    if (faith >= 200 && faith < 1000) {
      tierName = 'YOL GÖSTERİCİ';
      progress = ((faith - 200) / 800) * 100;
    } else if (faith >= 1000) {
      tierName = 'YÜCE TANRI';
      progress = 100;
    }

    this.tierTitleEl.textContent = tierName;
    this.tierProgressEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }
}
