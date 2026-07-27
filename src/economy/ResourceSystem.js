export class ResourceSystem {
  constructor() {
    this.wood = 25;
    this.food = 30;
    this.stone = 10;
  }

  addWood(amount) {
    this.wood = Math.max(0, this.wood + amount);
    return this.wood;
  }

  addFood(amount) {
    this.food = Math.max(0, this.food + amount);
    return this.food;
  }

  addStone(amount) {
    this.stone = Math.max(0, this.stone + amount);
    return this.stone;
  }

  canAfford({ wood = 0, food = 0, stone = 0 }) {
    return this.wood >= wood && this.food >= food && this.stone >= stone;
  }

  consume({ wood = 0, food = 0, stone = 0 }) {
    if (!this.canAfford({ wood, food, stone })) return false;
    this.wood -= wood;
    this.food -= food;
    this.stone -= stone;
    return true;
  }
}
