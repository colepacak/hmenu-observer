import BaseItem from './base-item';
import TopLevelList from './top-level-list';
import Container from './container';

class Menu extends BaseItem {
  constructor(id) {
    if (typeof id === 'undefined') {
      var e = new Error('Horizontal Menu: no id provided in Menu constructor');
      throw e.message;
    }
    super(id);
    this.parentClass = Container;
    this.childClass = TopLevelList;
    this.parentId = Menu.assignParentId(this.elem);
    this.childId = Menu.assignChildId(this.elem);
  }
  getChildOpenState() {
    // this isn't good enough, the child list - TopLevel - needs to have its own state
    return this.elem.find('ul[hm-list-open-state="open"]').length ? 'open' : 'closed';
  }
  registerParentObservers() {
    if (this.parentId !== null) {
      var parent = new Container('hm-container');
      this.addObserver(parent, 'ItemIsInactive');
      this.addObserver(parent, 'ItemIntendsToOpenChildList');
    }
  }
  registerChildObservers() {
    if (this.childId !== null) {
      var child = new TopLevelList(this.childId);
      this.addObserver(child, 'ListCanOpen');
      this.addObserver(child, 'ListMustClose');
    }
  }
  rnThatListIntendsToOpen(msg) {
    // this is equivalent to Item.handleClick
    // menu will notify parent that ItemIntendsToOpenChildList
    // no need to notify children of anything because this event is driven by the child
    var itemIntendsToOpenChildList = {
      channel: 'ItemIntendsToOpenChildList',
      signature: this.id,
      list: this.childId
    };
    // to parent
    this.init()
      .notifyObservers(itemIntendsToOpenChildList);
  }
  rnThatListCanOpen(msg) {
    //if (
    //  this.hasChild() &&
    //  this.getChildOpenState() === 'opening'
    //) {
      var newMsg = {
        channel: 'ListCanOpen',
        signature: this.id
      };
      this.init();
      this.notifyObservers(newMsg);
    //}
  }
  static assignParentId(elem) {
    return elem.closest('.hm-menu-container').attr('id');
  }
  static assignChildId(elem) {
    return elem.find('.hm-list-top-level').eq(0).attr('id');
  }
}

export default Menu;