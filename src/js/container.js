import BaseList from './base-list';
import Menu from './menu';

class Container extends BaseList {
  constructor(id) {
    if (typeof id === 'undefined') {
      var e = new Error('Horizontal Menu: no id provided in Container constructor');
      throw e.message;
    }
    super(id);
    this.childIds = Container.assignChildIds(this.elem);
    this.childClass = Menu;
  }
  static assignChildIds(elem) {
    var children = elem.find('.hm-menu');
    return children.map(function() {
      return $(this).attr('id');
    }).get();
  }
}

export default Container;