export class FaithSystem {
  constructor() {
    this.faith = 0;
  }

  addFaith(amount) {
    this.faith = Math.max(0, this.faith + amount);
    return this.faith;
  }

  tick(worshipperCount, dt, faithPerWorshipperPerSecond = 0.5) {
    return this.addFaith(worshipperCount * faithPerWorshipperPerSecond * dt);
  }
}

export function formatFaith(value) {
  return Math.floor(value).toLocaleString('tr-TR');
}
