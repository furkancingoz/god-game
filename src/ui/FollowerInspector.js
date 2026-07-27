export class FollowerInspector {
  constructor(container, onMakeProphet) {
    this.container = container;
    this.onMakeProphet = onMakeProphet;
    this.currentFollower = null;

    this.panel = document.createElement('div');
    this.panel.id = 'follower-inspector';
    this.panel.className = 'hud-card inspector-card';
    this.panel.style.display = 'none';

    this.panel.innerHTML = `
      <div class="inspector-header">
        <span class="follower-name" data-role="name">Takipçi</span>
        <button class="close-btn">&times;</button>
      </div>
      <div class="follower-role" data-role="role">İbadet Eden</div>

      <div class="stat-bar-group">
        <label>Açlık</label>
        <div class="mini-progress-bg"><div class="mini-progress-fill" data-role="hunger" style="width: 100%;"></div></div>
      </div>
      <div class="stat-bar-group">
        <label>Enerji</label>
        <div class="mini-progress-bg"><div class="mini-progress-fill" data-role="energy" style="width: 100%;"></div></div>
      </div>

      <button class="prophet-btn" data-role="prophet-btn">👑 Mesih / Peygamber İlan Et</button>
    `;

    this.container.appendChild(this.panel);

    this.nameEl = this.panel.querySelector('[data-role="name"]');
    this.roleEl = this.panel.querySelector('[data-role="role"]');
    this.hungerEl = this.panel.querySelector('[data-role="hunger"]');
    this.energyEl = this.panel.querySelector('[data-role="energy"]');
    this.prophetBtn = this.panel.querySelector('[data-role="prophet-btn"]');

    this.panel.querySelector('.close-btn').addEventListener('click', () => this.hide());

    this.prophetBtn.addEventListener('click', () => {
      if (this.currentFollower && this.onMakeProphet) {
        this.onMakeProphet(this.currentFollower);
        this.inspect(this.currentFollower);
      }
    });
  }

  inspect(follower) {
    this.currentFollower = follower;
    if (!follower) return this.hide();

    this.nameEl.textContent = follower.name;
    this.roleEl.textContent = follower.isProphet ? '✨ PEYGAMBER / MESİH' : follower.role;
    this.hungerEl.style.width = `${follower.hunger}%`;
    this.energyEl.style.width = `${follower.energy}%`;

    if (follower.isProphet) {
      this.prophetBtn.style.display = 'none';
    } else {
      this.prophetBtn.style.display = 'block';
    }

    this.panel.style.display = 'flex';
  }

  hide() {
    this.currentFollower = null;
    this.panel.style.display = 'none';
  }
}
