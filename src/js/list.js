import Subject from './subject';
import Menu from './menu';
import Item from './item';

class List extends Subject {
  constructor(id) {
    super();
    this.id = id;
    this.elem = $('#' + id);
    this.parentId = List.assignParentId(this.elem);
    this.childIds = List.assignChildIds(this.elem);
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
  registerObservers() {
    // parent
    if (typeof this.parentId !== 'undefined') {
      var parent = Menu.loadComponent(this.parentId);
      this.addObserver(parent, 'ListHasClosed');
    }
    // children
    this.childIds.forEach(id => {
      var child = Menu.loadComponent(id);
      this.addObserver(child, 'ListMustClose');
      this.addObserver(child, 'ListCanOpen');
    }, this);

    return this;
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
  rnThatItemIntendsToOpenChildList(msg) {
    // make sure an item hasn't already registered its intent to open
    if (this.hasItemWithIntentToOpen()) {
      var e = new Error('Horizontal Menu: item#' + msg.signature + ' cannot register intent to open because an item has already registered with this list');
      throw e.message;
    } else {
      this.itemIntendsToOpenChildList = msg.signature;

      var newMsg = {
        channel: 'ListMustClose',
        signature: this.id
      };
      this.init();
      // tell all child items to close their lists, except for the one that just registered its intent
      var itemWithIntent = new Item(msg.signature);
      this.removeObserver(itemWithIntent, 'ListMustClose');
      this.notifyObservers(newMsg);
    }
  }
  rnThatListCanOpen(msg) {
    if (
      //this.openState === 'opening' &&
    msg.signature === this.parentId
    ) {
      return this.open();
    }
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
  open() {
    this.openState = 'open';
    return this.elem.animate({
      bottom: -28
    }, 500);
  }
  close() {
    this.openState = 'closed';
    return this.elem.animate({
      bottom: 0
    }, 500).promise();
  }
  static assignParentId(elem) {
    return elem.parent().attr('id');
  }
  static assignChildIds(elem) {
    var children = elem.children('li');
    return children.map(function() {
      return $(this).attr('id');
    }).get();
  }
}

export default List;