import { formatFaith } from '../faith/FaithSystem.js';

export class HUD {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="hud-stat" data-role="faith"></div>
      <div class="hud-stat" data-role="population"></div>
    `;
    this.faithEl = this.container.querySelector('[data-role="faith"]');
    this.populationEl = this.container.querySelector('[data-role="population"]');
  }

  update({ faith, population, worshippers }) {
    this.faithEl.textContent = `İnanç: ${formatFaith(faith)}`;
    this.populationEl.textContent = `Nüfus: ${population} (${worshippers} ibadet ediyor)`;
  }
}
