import BaseList from './base-list';
import Item from './item';

class List extends BaseList {
  constructor(id) {
    super(id);
    this.parentId = List.assignParentId(this.elem);
    this.childIds = List.assignChildIds(this.elem);
    this.childClass = Item;
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
  static assignChildIds(elem) {
    var children = elem.children('li');
    return children.map(function() {
      return $(this).attr('id');
    }).get();
  }
}

export default List;