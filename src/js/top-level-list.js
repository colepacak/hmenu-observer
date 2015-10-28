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

    // notify parent menu
    var listIntendsToOpen = {
      channel: 'ListIntendsToOpen',
      signature: this.id
    };
    this.notifyObservers(listIntendsToOpen);
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
  rnThatListCanOpen(msg) {
    if (msg.signature === this.parentId) {
      this.init();
      this.itemIntendsToOpenChildList = '';
      this.notifyObservers(msg);
    }
  }
  allPossibleChildrenInactive() {
    var msg = {
      signature: this.id
    };

    if (this.hasItemWithIntentToOpen()) {
      // notify child item that list can open
      msg.channel = 'ListCanOpen';
    } else {
      // notify parent menu, usually when a list within another menu is opening
      msg.channel = 'ListHasClosed';
    }

    this.elem.attr('hm-num-inactive-children', 0);
    this.itemIntendsToOpenChildList = '';
    this.notifyObservers(msg);
  }
}

export default TopLevelList;