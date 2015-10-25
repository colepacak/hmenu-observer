import BaseList from './base-list';
import Item from './item';
import Menu from './menu';

class TopLevelList extends BaseList {
  constructor(id) {
    super(id);
    this.parentId = TopLevelList.assignParentId(this.elem);
    this.parentClass = Menu;
    this.childClass = Item;
  }
  registerParentObservers() {
    if (this.parentId !== null) {
      var parent = new this.parentClass(this.parentId);
      this.addObserver(parent, 'ListHasClosed');
      this.addObserver(parent, 'ListIntendsToOpen');
    }
  }
  static assignParentId(elem) {
    return elem.closest('hm-list').attr('id');
  }
}

export default TopLevelList;