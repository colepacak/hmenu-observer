import Subject from './subject';
//import Subject from './subject';

class BaseList extends Subject {
  constructor(id) {
    if (typeof id === 'undefined') {
      var e = new Error('Horizontal Menu: no id provided in BaseList constructor');
      throw e.message;
    }
    super();
    this.id = id;
    this.elem = $('#' + id);
    this.parentId = null;
    this.childIds = BaseList.assignChildIds(this.elem);
    this.childClass = null;
  }
  init() {
    this.registerObservers();
    return this;
  }
  get openState() {
    return this.elem.attr('hm-list-open-state');
  }
  set openState(newVal) {
    this.elem.attr('hm-list-open-state', newVal);
  }
  get itemIntendsToOpenChildList() {
    var state = this.elem.attr('hm-item-intends-to-open-child-list');
    return state !== '' ? state : null;
  }
  set itemIntendsToOpenChildList(newVal) {
    this.elem.attr('hm-item-intends-to-open-child-list', newVal);
  }
  hasItemWithIntentToOpen() {
    return this.itemIntendsToOpenChildList !== null;
  }
  registerChildObservers() {
    this.childIds.forEach(id => {
      var child = new this.childClass(id);
      this.addObserver(child, 'ListMustClose');
      this.addObserver(child, 'ListCanOpen');
    }, this);

    return this;
  }
  rnThatItemIntendsToOpenChildList(msg) {
    // make sure an item hasn't already registered its intent to open
    if (this.hasItemWithIntentToOpen()) {
      var e = new Error('Horizontal Menu: item#' + msg.signature + ' cannot register intent to open because an item has already registered with this list');
      throw e.message;
    }

    this.itemIntendsToOpenChildList = msg.signature;
    this.init();

    this.closeChildrenWithoutIntentToOpen(msg);
  }
  rnThatListIsOpening(msg) {
    if (
      msg.signature === this.id &&
      this.openState === 'closed'
    ) {
      this.openState = 'opening';
    }
  }
  rnThatListMustClose(msg) {
    if (this.openState === 'open') {
      this.openState = 'closing';

      var newMsg = {
        channel: 'ListMustClose',
        signature: this.id
      };
      this.init();
      this.notifyObservers(newMsg);
    }
  }
  rnThatItemIsInactive(msg) {
    this.init();
    this.childIsInactive(msg);
  }
  rnThatListCanOpen(msg) {
    if (msg.signature === this.parentId) {
      return this.open();
    }
  }
  closeChildrenWithoutIntentToOpen(msg) {
    var newMsg = {
      channel: 'ListMustClose',
      signature: this.id
    };
    var itemWithIntent = new this.childClass(msg.signature);

    this.removeObserver(itemWithIntent, 'ListMustClose');
    this.notifyObservers(newMsg);
    return this;
  }
  childIsInactive(msg) {
    // ensure that the child item that is not inactive isn't also the one that wants to open
    if (msg.signature === this.itemIntendsToOpenChildList) {
      var e = new Error('Horizontal Menu: Signature of inactive item matches item intending to open');
      throw e.message;
    }

    // increment inactive children until all are inactive, excluding the one that intends to open
    this.elem.attr('hm-num-inactive-children', increment);
    var numInactiveChildren = parseInt(this.elem.attr('hm-num-inactive-children'));
    var totalPossibleChildren = this.hasItemWithIntentToOpen() ? this.childIds.length - 1 : this.childIds.length;

    if (numInactiveChildren === totalPossibleChildren) {
      this.allPossibleChildrenInactive();
    }

    function increment(i, val) {
      var intVal = parseInt(val);
      return intVal + 1;
    }
  }
  allPossibleChildrenInactive() {
    var promise;
    var msg = {
      signature: this.id
    };

    if (this.hasItemWithIntentToOpen()) {
      var dfd = $.Deferred();
      promise = dfd.resolve();
      msg.channel = 'ListCanOpen';
    } else {
      promise = this.close();
      msg.channel = 'ListHasClosed';
    }

    promise.then(notifyCallback.bind(this, msg));

    function notifyCallback(msg) {
      // reset tracking attributes and notify
      this.elem.attr('hm-num-inactive-children', 0);
      this.itemIntendsToOpenChildList = '';
      this.notifyObservers(msg);
    }
  }
  getMenuSetting(s) {
    var setting = this.elem
      .closest('.hm-menu')
      .attr(s);

    if (typeof setting !== 'undefined') {
      return setting;
    } else {
      var e = new Error('Horizontal Menu: setting ' + s + ' does not exist on menu');
      throw e.message;
    }
  }
  static assignChildIds(elem) {
    var children = elem.children('li');
    return children.map(function() {
      return $(this).attr('id');
    }).get();
  }
}

export default BaseList;