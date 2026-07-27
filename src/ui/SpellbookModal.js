export class SpellbookModal {
  constructor(container) {
    this.container = container;
    this.modal = document.createElement('div');
    this.modal.id = 'spellbook-modal';
    this.modal.style.display = 'none';

    this.modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h2>📖 İLAHİ MUCİZE KİTABI</h2>
          <button class="modal-close">&times;</button>
        </div>

        <div class="spell-grid">
          <div class="spell-card unlocked">
            <div class="spell-icon">🌧️</div>
            <div class="spell-info">
              <h3>Bereket Yağmuru</h3>
              <p>Toprağı canlandırır, tarlalarda buğday yetiştirir.</p>
            </div>
            <span class="spell-status">AÇIK</span>
          </div>

          <div class="spell-card unlocked">
            <div class="spell-icon">☀️</div>
            <div class="spell-info">
              <h3>Kutsal Güneş</h3>
              <p>İbadet oranını artırır ve enerjileri yeniler.</p>
            </div>
            <span class="spell-status">AÇIK</span>
          </div>

          <div class="spell-card unlocked">
            <div class="spell-icon">🔥</div>
            <div class="spell-info">
              <h3>İlahi Ateş</h3>
              <p>Hızlı inanç birikimi sağlar.</p>
            </div>
            <span class="spell-status">AÇIK</span>
          </div>

          <div class="spell-card unlocked">
            <div class="spell-icon">☄️</div>
            <div class="spell-info">
              <h3>Göktaşı Çarpması</h3>
              <p>Devasa bir göktaşı indirerek krater oluşturur.</p>
            </div>
            <span class="spell-status">AÇIK</span>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.modal);

    this.modal.querySelector('.modal-close').addEventListener('click', () => this.hide());
    this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.hide());
  }

  show() {
    this.modal.style.display = 'flex';
  }

  hide() {
    this.modal.style.display = 'none';
  }
}
