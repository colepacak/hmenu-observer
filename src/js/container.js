import BaseList from './base-list';
import Menu from './menu';

class Container extends BaseList {
  constructor(id) {
    super(id);
    this.parentId = Container.assignParentId(this.elem);
    this.childIds = Container.assignChildIds(this.elem);
    this.childClass = Menu;
  }
  init() {
    this.registerObservers();
    return this;
  }
  registerObservers() {
    // parent
    if (typeof this.parentId !== 'undefined') {
      var parent = MenuManager.loadComponent(this.parentId);
      this.addObserver(parent, 'ListHasClosed');
    }
    // children
    this.childIds.forEach(id => {
      var child = MenuManager.loadComponent(id);
      this.addObserver(child, 'ListMustClose');
      this.addObserver(child, 'ListCanOpen');
    }, this);

    return this;
  }

  open() {}
  close() {}
  static assignParentId(elem) {}
  static assignChildIds(elem) {}
}

export default Container;