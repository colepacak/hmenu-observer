Array.prototype.contains = function(item) {
  var contains = false;
  for (var i = 0; i < this.length; i++) {
    if (this[i] === item) {
      contains = true;
      break;
    }
  }
  return contains;
};

$(function() {

  class Subject {

    constructor() {
      this.observerList = {};
    }
    // register observers to specific channels to avoid unnecessary communication
    addObserver(item, channel) {
      if (!this.observerList.hasOwnProperty(channel)) {
        this.observerList[channel] = [];
      }
      this.observerList[channel].push(item);
    }
    removeObserver(item, channel) {
      if (!this.observerList.hasOwnProperty(channel)) { return; }
      for (var i = 0; i < this.observerList[channel].length; i++) {
        if (this.observerList[channel][i]['id'] === item.id) {
          this.observerList[channel].splice(i, 1);
        }
      }
    }
    notifyObservers(msg) {
      if (this.observerList.hasOwnProperty(msg.channel)) {
        for (var i = 0; i < this.observerList[msg.channel].length; i++) {
          this.observerList[msg.channel][i].receiveNotification(msg);
        }
      } else {
        var e = new Error("Horizontal Menu: subject attempting to notify observers on channel that doesn't exist");
        throw e.message;
      }
    }
    receiveNotification(msg) {
      // add a check that method exists
      if (this.constructor.prototype.hasOwnProperty('rnThat' + msg.channel)) {
        this['rnThat' + msg.channel](msg);
      } else {
        var e = new Error('Horizontal Menu: this object does not have the rnThat' + msg.channel + ' method');
        throw e;
      }
    }
  }

  class Menu {
    constructor(elem) {
      this.elem = $(elem);
      this.lists = null;
      this.items = null;
    }
    init() {
      this
        .assignDOMProperties()
        .setActiveTrail()
        .bindEvents();
    }
    assignDOMProperties() {
      var uls = $('ul', this.elem);
      uls.each(function() {
        //assignId.call(this, 'hm-list-');
        assignClass.call(this, ['hm-list']);
        assignAttr.call(this, [
          { name: 'list-open-state', val: 'closed' },
          { name: 'num-inactive-children', val: 0 },
          { name: 'item-intends-to-open-child-list', val: '' }
        ]);
      });

      var lis = $('li', this.elem);
      lis.each(function() {
        //assignId.call(this, 'hm-item-');
        assignClass.call(this, ['hm-item']);
        assignAttr.call(this, [
          { name: 'item-allows-message-forwarding', val: 'true' }
        ]);
      });

      function assignId(prefix) {
        $(this).attr('id', prefix + $.uuid());
      }

      function assignClass(arr) {
        arr.forEach(c => {
          $(this).addClass(c);
        });
      }

      function assignAttr(arr) {
        arr.forEach(o => {
          $(this).attr('hm-' + o.name, o.val);
        });
      }

      return this;
    }
    static loadComponent(id) {
      var obj;
      var elem = $('#' + id);

      if (!elem.length) { return; }

      var tag = elem.prop('tagName');

      if (tag === 'LI' && elem.hasClass('hm-item')) {
        obj = new Item(id);
      } else if (tag === 'UL' && elem.hasClass('hm-list')) {
        obj = new List(id);
      }
      return obj;
    }
    setActiveTrail() {
      // first, remove open lists that do not have an active trail parent item
      // next, open the child lists of any active trail items that aren't open
      var activeTrailIds = $('li.active-trail', this.elem).map(function() {
        return $(this).attr('id');
      }).get();
      var openListIds = $('ul[hm-list-open-state="open"]', this.elem).map(function() {
        return $(this).attr('id');
      }).get().reverse();

      closeNonActiveTrailLists(openListIds, 0)
        .then(openClosedActiveTrailLists.bind(this, activeTrailIds, openListIds, 0));

      function closeNonActiveTrailLists(list, i) {
        var dfd = $.Deferred();
        if (i >= list.length) {
          return dfd.resolve();
        }

        var id = list[i];
        var openList = new List(id);
        // if open list does NOT have a parent item that is active state
        if (activeTrailIds.contains(openList.parentId)) {
          // stop loop once a parent item is found that is active state
          return dfd.resolve();
        } else {
          return openList.close().then(function() {
            i++;
            return closeNonActiveTrailLists(list, i);
          });
        }
      }

      function openClosedActiveTrailLists(activeIds, openIds, i) {
        var dfd = $.Deferred();
        if (i >= activeIds.length) {
          return dfd.resolve();
        }

        var promise;
        var activeTrailItem = new Item(activeIds[i]);

        if (openIds.contains(activeTrailItem.childId)) {
          promise = dfd.resolve();
        } else {
          var list = new List(activeTrailItem.childId);
          promise = list.open().promise();
        }

        return promise.then(function() {
          i++;
          return openClosedActiveTrailLists(activeIds, openIds, i);
        });
      }

      return this;
    }
    bindEvents() {
      $('a', this.elem).on('click', function(e) {
        e.preventDefault();
        var item = new Item($(this).parent().attr('id'));

        item
          .init()
          .handleClick();
      });

      this.elem.hover(handleMouseenter, handleMouseleave.bind(this));

      function handleMouseenter(e) {
        $(e.currentTarget).addClass('hm-is-hovered');
      }

      function handleMouseleave(e) {
        var mouseleaveTimer;

        $(e.currentTarget).removeClass('hm-is-hovered');
        mouseleaveTimer = setTimeout(resetActiveTrail.bind(this), 1000);

        function resetActiveTrail() {
          if (!this.elem.hasClass('hm-is-hovered')) {
            this.setActiveTrail();
          }
          clearTimeout(mouseleaveTimer);
        }
      }
      return this;
    }
  }

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

  var menu = new Menu('.horizontal-menu');
  menu.init();
});