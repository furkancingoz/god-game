// src/faith/ProphetSystem.js

export class ProphetSkillTree {
  constructor() {
    this.unlockedSkills = new Set(['basic_preach']);
  }

  static SKILLS = {
    basic_preach: {
      id: 'basic_preach',
      name: 'Temel Vaaz',
      icon: '📜',
      cost: 0,
      description: 'Peygamber tapınakta vaaz vererek etrafındaki takipçilerin inancını yavaşça artırır.',
    },
    divine_charisma: {
      id: 'divine_charisma',
      name: 'İlahi Karizma',
      icon: '✨',
      cost: 50,
      req: 'basic_preach',
      description: 'Peygamberin vaaz yarıçapını 2 katına çıkarır ve din yayılma hızını %50 artırır.',
    },
    missionary_zeal: {
      id: 'missionary_zeal',
      name: 'Misyoner Şevki',
      icon: '🏃',
      cost: 100,
      req: 'divine_charisma',
      description: 'Peygamber ve elçileri komşu bölgelere seyahat ederek dinsiz kabileleri dine bağlar.',
    },
    holy_martyr: {
      id: 'holy_martyr',
      name: 'Kutsal Şehitlik',
      icon: '⚜️',
      cost: 200,
      req: 'missionary_zeal',
      description: 'Peygamber bir afet anında halkını koruduğunda din yayılma hızı kalıcı olarak 3 katına çıkar.',
    },
    holy_book: {
      id: 'holy_book',
      name: 'Kutsal Kitap Yazımı',
      icon: '📖',
      cost: 300,
      req: 'missionary_zeal',
      description: 'Dinin kurallarını kutsal kitaba döker. Halkın inancı sarsılmaz hale gelir.',
    }
  };

  unlockSkill(skillId, currentFaith) {
    const skill = ProphetSkillTree.SKILLS[skillId];
    if (!skill) return { success: false, reason: 'Geçersiz yetenek' };
    if (this.unlockedSkills.has(skillId)) return { success: false, reason: 'Zaten açık' };
    if (skill.req && !this.unlockedSkills.has(skill.req)) return { success: false, reason: 'Öncül yetenek kilitli' };
    if (currentFaith < skill.cost) return { success: false, reason: 'Yetersiz İnanç' };

    this.unlockedSkills.add(skillId);
    return { success: true, skill };
  }

  hasSkill(skillId) {
    return this.unlockedSkills.has(skillId);
  }
}
