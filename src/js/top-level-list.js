import BaseList from './base-list';
import Item from './item';
import Menu from './menu';

class TopLevelList extends BaseList {
  constructor(id) {
    if (typeof id === 'undefined') {
      var e = new Error('Horizontal Menu: no id provided in TopLevelList constructor');
      throw e.message;
    }
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
  rnThatItemIntendsToOpenChildList(msg) {
    // make sure an item hasn't already registered its intent to open
    if (this.hasItemWithIntentToOpen()) {
      var e = new Error('Horizontal Menu: item#' + msg.signature + ' cannot register intent to open because an item has already registered with this list');
      throw e.message;
    }

    this.itemIntendsToOpenChildList = msg.signature;
    this.init();
    // here is where top level lists need to first get clearance from parent menu before proceeding locally
    // perhaps this process needs to be stopped and continued later after clearance is received

    // local
    // tell all child items to close their lists, except for the one that just registered its intent
    var ListIntendsToOpen = {
      channel: 'ListIntendsToOpen',
      signature: this.id
    };
    this.notifyObservers(ListIntendsToOpen);

    this.closeChildrenWithoutIntentToOpen(msg);
  }
  rnThatListMustClose(msg) {
    var newMsg = {
      channel: 'ListMustClose',
      signature: this.id
    };
    this.init();
    this.notifyObservers(newMsg);
  }
  static assignParentId(elem) {
    return elem.closest('.hm-menu').attr('id');
  }
}

export default TopLevelList;