// src/faith/ReligionTransmission.js

export class ReligionTransmission {
  constructor() {
    this.totalWorldPopulation = 500;
    this.convertedBelievers = 24;
    this.skeptics = 400;
    this.heretics = 76;

    this.transmissionRate = 0.5; // Base infectivity/transmission rate
    this.faithStrength = 1.0;     // Faith resistance/power
    this.devotionLevel = 25;      // Global Devotion %
  }

  update(dt, prophetSystem, worshipperCount) {
    let infectivity = this.transmissionRate * (worshipperCount * 0.1);

    if (prophetSystem && prophetSystem.hasSkill('divine_charisma')) {
      infectivity *= 1.5;
    }
    if (prophetSystem && prophetSystem.hasSkill('missionary_zeal')) {
      infectivity *= 2.0;
    }
    if (prophetSystem && prophetSystem.hasSkill('holy_book')) {
      infectivity *= 2.5;
    }

    // Spread religion to skeptics
    if (this.skeptics > 0) {
      const converted = Math.min(this.skeptics, infectivity * dt * 2);
      this.skeptics -= converted;
      this.convertedBelievers += converted;
    }

    // Convert heretics with holy book or miracles
    if (this.heretics > 0 && prophetSystem && prophetSystem.hasSkill('holy_book')) {
      const convertedHeretics = Math.min(this.heretics, infectivity * dt * 0.8);
      this.heretics -= convertedHeretics;
      this.convertedBelievers += convertedHeretics;
    }

    this.devotionLevel = Math.round((this.convertedBelievers / this.totalWorldPopulation) * 100);
  }

  getStats() {
    return {
      total: Math.round(this.totalWorldPopulation),
      believers: Math.round(this.convertedBelievers),
      skeptics: Math.round(this.skeptics),
      heretics: Math.round(this.heretics),
      percentage: this.devotionLevel,
    };
  }
}
