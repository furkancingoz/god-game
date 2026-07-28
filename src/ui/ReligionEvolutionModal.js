// src/ui/ReligionEvolutionModal.js
import { ProphetSkillTree } from '../faith/ProphetSystem.js';

export class ReligionEvolutionModal {
  constructor(container, prophetSkillTree, onUnlockSkill) {
    this.container = container;
    this.skillTree = prophetSkillTree;
    this.onUnlockSkill = onUnlockSkill;

    this.modal = document.createElement('div');
    this.modal.id = 'religion-modal';
    this.modal.style.display = 'none';

    this.render();
    this.container.appendChild(this.modal);
  }

  render() {
    this.modal.innerHTML = `
      <div class="modal-overlay" style="
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(5, 7, 15, 0.85); backdrop-filter: blur(12px); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 20px; width: 700px; max-width: 90vw; padding: 28px;
          color: #f8fafc; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 28px;">☣️📜</span>
              <div>
                <h2 style="margin: 0; color: #fbbf24; font-size: 22px;">DİN & PEYGAMBER GELİŞİMİ (EVOLVE)</h2>
                <div style="font-size: 12px; color: #94a3b8;">Plague Inc Tarzı İnanç & Doktrin Ağacı</div>
              </div>
            </div>
            <button id="close-rel-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 24px; cursor: pointer;">&times;</button>
          </div>

          <!-- World Religion Transmission Progress -->
          <div style="margin: 20px 0; background: rgba(0,0,0,0.4); padding: 16px; border-radius: 12px; display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 11px; color: #94a3b8;">DÜNYA NÜFUSU</div>
              <div style="font-size: 20px; font-weight: bold; color: #38bdf8;" id="stat-total">500</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #94a3b8;">MÜMİNLER (INFACTED)</div>
              <div style="font-size: 20px; font-weight: bold; color: #22c55e;" id="stat-believers">24</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #94a3b8;">ŞÜPHECİLER</div>
              <div style="font-size: 20px; font-weight: bold; color: #eab308;" id="stat-skeptics">400</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #94a3b8;">SAPKINLAR (HERETICS)</div>
              <div style="font-size: 20px; font-weight: bold; color: #ef4444;" id="stat-heretics">76</div>
            </div>
          </div>

          <!-- Skill Tree Grid -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 20px;" id="skill-grid">
            ${Object.values(ProphetSkillTree.SKILLS).map((skill) => {
              const isUnlocked = this.skillTree.hasSkill(skill.id);
              return `
                <div class="skill-card ${isUnlocked ? 'unlocked' : ''}" data-id="${skill.id}" style="
                  background: ${isUnlocked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)'};
                  border: 1px solid ${isUnlocked ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.1)'};
                  border-radius: 12px; padding: 14px; display: flex; gap: 12px; align-items: center;
                  cursor: ${isUnlocked ? 'default' : 'pointer'}; transition: all 0.2s;
                ">
                  <div style="font-size: 32px;">${skill.icon}</div>
                  <div style="flex: 1;">
                    <div style="font-weight: bold; color: ${isUnlocked ? '#4ade80' : '#f8fafc'}; font-size: 15px;">${skill.name}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${skill.description}</div>
                    <div style="font-size: 11px; color: #fbbf24; font-weight: bold; margin-top: 6px;">
                      ${isUnlocked ? '✓ AÇILDI' : `Maliyet: ${skill.cost} İnanç`}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.modal.querySelector('#close-rel-modal').addEventListener('click', () => this.hide());
    this.modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) this.hide();
    });

    const cards = this.modal.querySelectorAll('.skill-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (this.onUnlockSkill) this.onUnlockSkill(id);
      });
    });
  }

  updateStats(stats) {
    if (!this.modal) return;
    const t = this.modal.querySelector('#stat-total');
    const b = this.modal.querySelector('#stat-believers');
    const s = this.modal.querySelector('#stat-skeptics');
    const h = this.modal.querySelector('#stat-heretics');

    if (t) t.textContent = stats.total;
    if (b) b.textContent = stats.believers;
    if (s) s.textContent = stats.skeptics;
    if (h) h.textContent = stats.heretics;
  }

  show() {
    this.modal.style.display = 'flex';
  }

  hide() {
    this.modal.style.display = 'none';
  }
}
