Array.prototype.contains = function(elem) {
  var contains;
  if (this.indexOf(elem) !== -1) {
    contains = true;
  } else {
    contains = true;
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
        .bindEvents();
    }
    assignDOMProperties() {
      var uls = $('ul', this.elem);
      uls.each(function() {
        //assignId.call(this, 'hm-list-');
        assignClass.call(this, ['hm-list']);
        assignAttr.call(this, 'list-open-state', 'closed');
        assignAttr.call(this, 'num-inactive-children', 0);
        assignAttr.call(this, 'item-intends-to-open-child-list', '');
      });

      var lis = $('li', this.elem);
      lis.each(function() {
        //assignId.call(this, 'hm-item-');
        assignClass.call(this, ['hm-item']);
        assignAttr.call(this, 'item-allows-message-forwarding', 'true');
      });

      function assignId(prefix) {
        $(this).attr('id', prefix + $.uuid());
      }

      function assignClass(arr) {
        arr.forEach(c => {
          $(this).addClass(c);
        });
      }

      function assignAttr(name, val) {
        $(this).attr('hm-' + name, val);
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
    bindEvents() {
      $('a', this.elem).on('click', function(e) {
        e.preventDefault();
        var item = new Item($(this).parent().attr('id'));
        // init, which registers observers, then notify observers
        item
          .init()
          .handleClick();
      });
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
    registerObservers() {
      // parent
      if (typeof this.parentId !== 'undefined') {
        var parent = Menu.loadComponent(this.parentId);
        this.addObserver(parent, 'list-has-closed');
      }
      // children
      this.childIds.forEach(id => {
      var child = Menu.loadComponent(id);
        this.addObserver(child, 'list-must-close');
        this.addObserver(child, 'list-can-open');
      }, this);

      return this;
    }
    receiveNotification(msg) {
      var newMsg = {};
      switch (msg.channel) {
        case 'list-is-opening':
          if (
            msg.signature === this.id &&
            this.openState === 'closed'
          ) {
            this.openState = 'opening';
          }
          break;
        case 'list-must-close':
          newMsg = {
            channel: 'list-must-close',
            signature: this.id
          };
          if (this.openState === 'open') {
            this.openState = 'closing';
            this.init();
            this.notifyObservers(newMsg);
          }
          break;
        case 'item-is-inactive':
          this.init();
          this.childIsInactive(msg);
          break;
        case 'item-intends-to-open-child-list':
          if (this.itemIntendsToOpenChildList === null) {
            this.itemIntendsToOpenChildList = msg.signature;

            newMsg = {
              channel: 'list-must-close',
              signature: msg.list
            };
            this.init();
            var itemWithIntent = new Item(msg.signature);
            this.removeObserver(itemWithIntent, 'list-must-close');
            this.notifyObservers(newMsg);
          } else {
            var e = new Error('Horizontal Menu: item#' + msg.signature + ' cannot register intent to open because an item has already registered with this list');
            throw e.message;
          }
          break;
        case 'list-can-open':
          if (
            this.openState === 'opening' &&
            msg.signature === this.parentId
          ) {
            this.openState = 'open';
            this.elem.animate({
              bottom: -30
            }, 500);
          }
          break;
      }
    }
    childIsInactive(msg) {
      if (msg.signature === this.itemIntendsToOpenChildList) {
        var e = new Error('Horizontal Menu: Signature of inactive item matches item intending to open');
        throw e.message;
      }

      // increment inactive children
      this.elem.attr('hm-num-inactive-children', increment);
      var numInactiveChildren = parseInt(this.elem.attr('hm-num-inactive-children'));
      var totalPossibleChildren = this.itemIntendsToOpenChildList === null ? this.childIds.length : this.childIds.length - 1;

      if (numInactiveChildren === totalPossibleChildren) {
        this.allPossibleChildrenInactive();
      }

      function increment(i, val) {
        var intVal = parseInt(val);
        return intVal + 1;
      }
    }
    allPossibleChildrenInactive() {
      var msg = {
        signature: this.id
      };
      var promise;

      if (this.itemIntendsToOpenChildList === null) {
        this.openState = 'closed';
        promise = this.elem.animate({
          bottom: 0
        }, 500).promise();
        msg.channel = 'list-has-closed';
      } else {
        var dfd = $.Deferred();
        promise = dfd.resolve();
        msg.channel = 'list-can-open';
      }

      promise.then(notifyCallback.bind(this));

      function notifyCallback() {
        this.elem.attr('hm-num-inactive-children', 0);
        this.itemIntendsToOpenChildList = '';
        this.notifyObservers(msg);
      }
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
        this.addObserver(parent, 'item-is-inactive');
        this.addObserver(parent, 'item-intends-to-open-child-list');
      }
      // child
      if (this.childId !== null) {
        var child = Menu.loadComponent(this.childId);
        this.addObserver(child, 'list-is-opening');
        this.addObserver(child, 'list-can-open');
        this.addObserver(child, 'list-must-close');
      }
      return this;
    }
    handleClick() {
      if (!this.hasChild()) { return; }

      var childOpenState = this.getChildOpenState();

      if (childOpenState === 'closed') {
        var listIsOpening = {
          channel: 'list-is-opening',
          signature: this.childId
        };

        var itemIntendsToOpenChildList = {
          channel: 'item-intends-to-open-child-list',
          signature: this.id,
          list: this.childId
        };
        // to child
        this.notifyObservers(listIsOpening);
        // to parent
        this.notifyObservers(itemIntendsToOpenChildList);
      } else if (childOpenState === 'open') {
        this.allowsMessageForwarding = 'false';
        var listMustClose = {
          channel: 'list-must-close',
          signature: this.id
        };
        // to child
        this.notifyObservers(listMustClose);
      }

    }
    receiveNotification(msg) {
      switch (msg.channel) {
        case 'list-must-close':
          var newMsg;
          // has no child
          if (!this.hasChild()) {
            newMsg = {
              channel: 'item-is-inactive',
              signature: this.id
            };
            this.init();
            return this.notifyObservers(newMsg);
          }

          // has child
          if (msg.signature === this.childId) {
            // signature is child's
            if (this.getChildOpenState() === 'closed') {
              this.init();
              this.notifyObservers(msg);
            }
          } else {
            // signature is not child's
            if (this.getChildOpenState() === 'closed') {
              newMsg = {
                channel: 'item-is-inactive',
                signature: this.id
              };
              this.init();
              this.notifyObservers(newMsg);
            } else if (this.getChildOpenState() === 'open') {
              this.init();
              this.notifyObservers(msg);
            }
          }
          break;
        case 'list-can-open':
          if (
            this.hasChild() &&
            this.getChildOpenState() === 'opening'
          ) {
            newMsg = {
              channel: 'list-can-open',
              signature: this.id
            };
            this.init();
            this.notifyObservers(newMsg);
          }
          break;
        case 'list-has-closed':
          if (msg.signature !== this.childId) {
            var e = new Error("Horizontal Menu: an item has been informed that a non-child list has closed");
            throw e.message;
          }

          if (this.allowsMessageForwarding === 'true') {
            newMsg = {
              channel: 'item-is-inactive',
              signature: this.id
            };
            this.init();
            this.notifyObservers(newMsg);
          } else {
            this.allowsMessageForwarding = 'true';
          }
          break;
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