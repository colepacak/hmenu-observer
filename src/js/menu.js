import BaseItem from './base-item';

class Menu extends BaseItem {
  constructor(id) {
    super(id);
  }
  getChildOpenState() {}
  static assignParentId(elem) {}
  static assignChildId(elem) {}
}

export default Menu;