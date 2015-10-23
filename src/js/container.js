import BaseList from './base-list';
import Menu from './menu';

class Container extends BaseList {
  constructor(id) {
    super(id);
    this.parentId = Container.assignParentId(this.elem);
    this.childIds = Container.assignChildIds(this.elem);
    this.childClass = Menu;
  }
  open() {}
  close() {}
  static assignParentId(elem) {}
  static assignChildIds(elem) {}
}

export default Container;