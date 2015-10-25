import BaseItem from './base-item';

class Menu extends BaseItem {
  constructor(id) {
    super(id);
  }
  init() {
    this.registerObservers();
    return this;
  }
  registerObservers() {}
  getChildOpenState() {}
  static assignParentId(elem) {}
  static assignChildId(elem) {}
}

export default Menu;