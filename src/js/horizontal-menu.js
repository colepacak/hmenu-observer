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
        assignClass.call(this, ['hm-list', 'hm-list-closed']);
        assignAttr.call(this, 'num-inactive-children', 0);
      });

      var lis = $('li', this.elem);
      lis.each(function() {
        //assignId.call(this, 'hm-item-');
        assignClass.call(this, ['hm-item']);
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
      this._openState = List.assignOpenState(this.elem);
      this.childIntendsToOpen = List.assignChildIntendsToOpen(this.elem);
    }
    init() {
      this.registerObservers();
      return this;
    }
    get openState() {
      return this._openState;
    }
    set openState(newState) {
      this._openState = newState;
      var classes = this.elem.attr('class').split(' ');

      var matches = classes.filter(c => c.match('hm-list-') !== null);

      matches.forEach(m => {
        this.elem.removeClass(m);
      });

      this.elem.addClass('hm-list-' + newState);
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
        this.addObserver(child, 'list-is-opening');
        this.addObserver(child, 'list-can-open');
      }, this);

      return this;
    }
    receiveNotification(msg) {
      switch (msg.channel) {
        case 'list-is-opening':
          if (msg.signature === this.id) {
            // signature is mine
            if (this.openState === 'closed') {
              this.openState = 'opening';
            }
          } else {
            // signature is not mine
            if (this.openState === 'open') {
              this.openState = 'closing';
              this.notifyObservers(msg);
            }
          }
          break;
        case 'item-is-inactive':
          this.init();
          this.childIsInactive(msg);
          break;
        case 'item-intends-to-open-child-list':
          if (typeof this.elem.attr('hm-item-intends-to-open-child-list') === 'undefined') {
            // change to getter/setter
            this.elem.attr('hm-item-intends-to-open-child-list', msg.signature);
            this.childIntendsToOpen = msg.signature;
            //

            var newMsg = {
              channel: 'list-is-opening',
              signature: msg.list
            };
            this.init();
            var itemWithIntent = new Item(msg.signature);
            this.removeObserver(itemWithIntent, 'list-is-opening');
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
          }
          break;
      }
    }
    childIsInactive(msg) {
      if (msg.signature === this.childIntendsToOpen) {
        var e = new Error('Horizontal Menu: Signature of inactive item matches item intending to open');
        throw e.message;
      }

      // increment inactive children
      this.elem.attr('hm-num-inactive-children', increment);
      var numInactiveChildren = parseInt(this.elem.attr('hm-num-inactive-children'));
      var totalPossibleChildren = this.childIntendsToOpen === null ? this.childIds.length : this.childIds.length - 1;

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

      if (this.childIntendsToOpen === null) {
        this.openState = 'closed';
        msg.channel = 'list-has-closed';
      } else {
        msg.channel = 'list-can-open';
      }

      this.elem.attr('hm-num-inactive-children', 0);
      this.notifyObservers(msg);
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
    static assignOpenState(elem) {
      var classes = elem.attr('class').split(' ');

      var matches = classes.filter(c => c.match('hm-list-') !== null);

      if (matches.length === 1) {
        var m = matches[0];
        return m.replace('hm-list-', '');
      } else {
        var e = new Error('horizontal menu: too many open state classes on list element');
        throw e.message;
      }
    }
    static assignChildIntendsToOpen(elem) {
      var attrVal = elem.attr('hm-item-intends-to-open-child-list');
      return typeof attrVal !== 'undefined' ? attrVal : null;
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
      }
      return this;
    }
    handleClick() {
      if (!this.hasChild()) { return; }

      var listIsOpening = {
        channel: 'list-is-opening',
        signature: this.childId
      };

      var itemIntendsToOpenChildList = {
        channel: 'item-intends-to-open-child-list',
        signature: this.id,
        list: this.childId
      };
      this.notifyObservers(listIsOpening);
      this.notifyObservers(itemIntendsToOpenChildList);
    }
    receiveNotification(msg) {
      switch (msg.channel) {
        case 'list-is-opening':
          var newMsg;
          // has no child
          if (!this.hasChild()) {
            newMsg = {
              channel: 'item-is-inactive',
              signature: this.id
            };
            return this.notifyObservers(newMsg);
          }

          // has child
          if (msg.signature === this.childId) {
            // signature is child's
            if (this.getChildOpenState() === 'closed') {
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
              this.notifyObservers(msg);
            }
          }
          break;
        case 'list-can-open':
          if (this.getChildOpenState() === 'opening') {
            newMsg = {
              channel: 'list-can-open',
              signature: this.id
            };
            this.init();
            this.notifyObservers(newMsg);
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