import Subject from './subject';
import Menu from './menu';
import List from './list';

class Item extends Subject {
  constructor(id) {
    super();
    this.id = id;
    this.elem = $('#' + id);
    this.parentId = Item.assignParentId(this.elem);
    this.childId = Item.assignChildId(this.elem);
  }
  init() {
    this.registerObservers();
    return this;
  }
  hasChild() {
    return this.childId ? true : false;
  }
  getChildOpenState() {
    if (this.hasChild()) {
      var child = new List(this.childId);
      return child.openState;
    } else {
      var e = Error('item with id ' + this.id + ' has no child');
      throw e.message;
    }
  }
  get allowsMessageForwarding() {
    return this.elem.attr('hm-item-allows-message-forwarding');
  }
  set allowsMessageForwarding(newVal) {
    this.elem.attr('hm-item-allows-message-forwarding', newVal);
  }
  registerObservers() {
    // parent
    if (this.parentId !== null) {
      var parent = Menu.loadComponent(this.parentId);
      this.addObserver(parent, 'ItemIsInactive');
      this.addObserver(parent, 'ItemIntendsToOpenChildList');
    }
    // child
    if (this.childId !== null) {
      var child = Menu.loadComponent(this.childId);
      this.addObserver(child, 'ListIsOpening');
      this.addObserver(child, 'ListCanOpen');
      this.addObserver(child, 'ListMustClose');
    }
    return this;
  }
  handleClick() {
    if (!this.hasChild()) { return; }

    var childOpenState = this.getChildOpenState();

    if (childOpenState === 'closed') {
      var listIsOpening = {
        channel: 'ListIsOpening',
        signature: this.childId
      };

      var itemIntendsToOpenChildList = {
        channel: 'ItemIntendsToOpenChildList',
        signature: this.id,
        list: this.childId
      };
      // to child,
      this.notifyObservers(listIsOpening);
      // to parent
      this.notifyObservers(itemIntendsToOpenChildList);
    } else if (childOpenState === 'open') {
      // tell children to close but prevent communication from traveling further up the tree
      this.allowsMessageForwarding = 'false';
      var listMustClose = {
        channel: 'ListMustClose',
        signature: this.id
      };
      // to child
      this.notifyObservers(listMustClose);
    }
  }
  rnThatListMustClose(msg) {
    var newMsg;

    if (
      !this.hasChild() ||
      this.getChildOpenState() === 'closed'
    ) {
      newMsg = {
        channel: 'ItemIsInactive',
        signature: this.id
      };
      this.init();
      return this.notifyObservers(newMsg);
    }

    if (this.getChildOpenState() === 'open') {
      this.init();
      this.notifyObservers(msg);
    }
  }
  rnThatListCanOpen(msg) {
    if (
      this.hasChild() &&
      this.getChildOpenState() === 'opening'
    ) {
      var newMsg = {
        channel: 'ListCanOpen',
        signature: this.id
      };
      this.init();
      this.notifyObservers(newMsg);
    }
  }
  rnThatListHasClosed(msg) {
    if (msg.signature !== this.childId) {
      var e = new Error("Horizontal Menu: an item has been informed that a non-child list has closed");
      throw e.message;
    }

    if (this.allowsMessageForwarding === 'true') {
      var newMsg = {
        channel: 'ItemIsInactive',
        signature: this.id
      };
      this.init();
      this.notifyObservers(newMsg);
    } else {
      this.allowsMessageForwarding = 'true';
    }
  }
  static assignParentId(elem) {
    return elem.parent().attr('id');
  }
  static assignChildId(elem) {
    var id = null;

    if (elem.children('ul').length === 1) {
      id = elem.children('ul').attr('id');
    }
    return id;
  }
}

export default Item;