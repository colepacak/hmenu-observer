import Subject from './subject';
import MenuManager from './menu-manager';

class BaseItem extends Subject {
  constructor(id) {
    if (typeof id === 'undefined') {
      var e = new Error('Horizontal Menu: no id provided in BaseItem constructor');
      throw e.message;
    }
    super();
    this.id = id;
    this.elem = $('#' + id);
    this.parentId = null;
    this.childId = null;
  }
  init() {
    this.registerObservers();
    return this;
  }
  hasChild() {
    return this.childId ? true : false;
  }
  get allowsMessageForwarding() {
    return this.elem.attr('hm-item-allows-message-forwarding');
  }
  set allowsMessageForwarding(newVal) {
    this.elem.attr('hm-item-allows-message-forwarding', newVal);
  }
  getChildOpenState() {}
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
}

export default BaseItem;