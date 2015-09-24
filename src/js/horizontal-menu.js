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
        assignId.call(this, 'hm-list-');
        assignClass.call(this, ['hm-list', 'hm-list-closed']);
        assignAttr.call(this, 'num-inactive-children', 0);
      });

      var lis = $('li', this.elem);
      lis.each(function() {
        assignId.call(this, 'hm-item-');
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
        var parent = Menu.loadComponent(parentId);
        this.addObserver(parent, 'list-has-closed');
      }
      // children
      this.childIds.forEach(id => {
      var child = Menu.loadComponent(id);
        this.addObserver(child, 'list-is-opening');
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
          if (this.childIntendsToOpen === null) {
            this.childIsInactive(this.childIds.length);
          } else {
            if (msg.signature === this.childIntendsToOpen) {
              var e = new Error('Horizontal Menu: Signature of inactive item matches item intending to open');
              throw e.message;
            }
          }
          break;
        //
        //  // todo: make more elegant
        //  // bail if open and signature belongs to child
        //  if (
        //    this.openState === 'open' &&
        //    this.childIds.indexOf(msg.signature) !== -1
        //  ) {
        //    return;
        //  }
        //
        //  if (this.openState === 'open') {
        //    this.openState = 'closing';
        //    this.init();
        //    this.notifyObservers(msg);
        //  } else if (
        //    // closed and signature is parent's
        //    this.openState === 'closed' &&
        //    msg.signature === this.parentId
        //  ) {
        //    this.openState = 'opening';
        //  }
        //  break;
        //case 'item-is-inactive':
        //  if (this.openState === 'closing') {
        //    this.childIsInactive();
        //  }
        //  break;
        //case 'list-can-open':
        //  if (
        //    this.openState === 'opening' &&
        //    msg.signature === this.parentId
        //  ) {
        //    this.openState = 'open';
        //  }
        //  break;
      }
    }
    childIsInactive() {
      // increment inactive children
      this.elem.attr('hm-num-inactive-children', increment);
      var numInactiveChildren = parseInt(this.elem.attr('hm-num-inactive-children'));

      // differnt total based on val of this.childItendsToOpen
      // as a result, different messsage

      if (numInactiveChildren === this.childIds.length) {
        var msg = {
          channel: 'list-has-closed',
          signature: this.id
        };
        this.init();
        this.openState = 'closed';
        this.elem.attr('hm-num-inactive-children', 0);
        this.notifyObservers(msg);
      }

      function increment(i, val) {
        var intVal = parseInt(val);
        return intVal + 1;
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
      var attrVal = elem.attr('hm-child-intends-to-open');
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
        child.init();
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
      }
      return this;
    }
    handleClick() {
      if (!this.hasChild()) { return; }

      var msg = {
        channel: 'list-is-opening',
        signature: this.childId
      };
      this.notifyObservers(msg);
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
              this.notifyObservers(newMsg);
            } else if (this.getChildOpenState() === 'open') {
              this.notifyObservers(msg);
            }
          }
          break;
        //case 'list-is-opening':
        //  if (
        //    this.id === msg.signature ||
        //    (this.hasChild() &&
        //    this.getChildOpenState() === 'closing')
        //  ) {
        //    return;
        //  }
        //
        //  // default message if child has no children OR if child state is 'closed'
        //  newMsg = {
        //    channel: 'item-is-inactive',
        //    signature: this.id
        //  };
        //
        //  // forward message along if child is open
        //  if (
        //    this.hasChild() &&
        //    this.getChildOpenState() === 'open'
        //  ) {
        //    newMsg = msg;
        //  }
        //  this.init();
        //  this.notifyObservers(newMsg);
        //  break;
        //case 'item-is-inactive':
        //  if (
        //    this.siblingIds.indexOf(msg.signature) !== -1 &&
        //    this.hasChild() &&
        //    this.getChildOpenState() === 'opening'
        //  ) {
        //    this.init();
        //    this.siblingIsInactive();
        //  }
        //  break;
        //case 'list-has-closed':
        //  if (msg.signature === this.childId) {
        //    newMsg = {
        //      channel: 'item-is-inactive',
        //      signature: this.id
        //    };
        //    this.init();
        //    this.notifyObservers(newMsg);
        //  }
        //  break;
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