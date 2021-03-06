import BaseItem from './base-item';
import List from './list';
import TopLevelList from './top-level-list';

class Item extends BaseItem {
  constructor(id) {
    if (typeof id === 'undefined') {
      var e = new Error('Horizontal Menu: no id provided in Item constructor');
      throw e.message;
    }
    super(id);
    this.parentId = Item.assignParentId(this.elem);
    this.childId = Item.assignChildId(this.elem);
  }
  registerParentObservers() {
    if (this.parentId !== null) {
      var parent;
      var parentElem = $('#' + this.parentId);
      var parentListIsTopLevel = parentElem.hasClass('hm-list-top-level');

      if (parentListIsTopLevel) {
        parent = new TopLevelList(this.parentId);
      } else {
        parent = new List(this.parentId);
      }
      this.addObserver(parent, 'ItemIsInactive');
      this.addObserver(parent, 'ItemIntendsToOpenChildList');
    }
  }
  registerChildObservers() {
    if (this.childId !== null) {
      var child = new List(this.childId);
      this.addObserver(child, 'ListIsOpening');
      this.addObserver(child, 'ListCanOpen');
      this.addObserver(child, 'ListMustClose');
    }
    return this;
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