import BaseList from './base-list';
import Item from './item';

class List extends BaseList {
  constructor(id) {
    super(id);
    this.parentId = List.assignParentId(this.elem);
    this.parentClass = Item;
    this.childClass = Item;
  }
  registerParentObservers() {
    if (this.parentId !== null) {
      var parent = new this.parentClass(this.parentId);
      this.addObserver(parent, 'ListHasClosed');
    }
  }
  open() {
    this.openState = 'open';
    var dur = this.getMenuSetting('hm-anim-duration');
    return this.elem.animate({
      bottom: -28
    }, dur);
  }
  close() {
    this.openState = 'closed';
    var dur = this.getMenuSetting('hm-anim-duration');
    return this.elem.animate({
      bottom: 0
    }, dur).promise();
  }
  static assignParentId(elem) {
    return elem.parent().attr('id');
  }
}

export default List;