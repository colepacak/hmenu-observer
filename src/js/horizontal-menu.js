$(function() {

  class Subject {

    constructor() {
      this.observerList =[];
    }
    addObserver(item) {
      this.observerList.push(item);
    }
    removeObserver(item) {
      for (var i = 0; i < this.observerList.length; i++) {
        if (this.observerList[i] == item) {
          this.observerList.splice(i, 1);
        }
      }
    }
    notifyObservers(msg) {
      for (var i = 0; i < this.observerList.length; i++) {
        this.observerList[i].receiveNotification(msg);
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
        .assignIds()
        .bindEvents();
    }
    assignIds() {
      var uls = $('ul', this.elem);
      uls.each(function() {
        assignId.call(this, 'hm-list-');
        assignClass.call(this, ['hm-list', 'hm-list-closed']);
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
      var observerIds = [];

      observerIds.push(this.parentId);
      this.childIds.forEach(id => {
        observerIds.push(id);
      });

      observerIds.forEach(id => {
      var obj = Menu.loadComponent(id);
        this.addObserver(obj);
      }, this);

      return this;
    }
    receiveNotification(msg) {
      switch (msg.title) {
        case 'list-is-opening':
          if (this.openState === 'open') {
            this.openState === 'closing';
            this.notifyObservers(msg);
          } else if (
            this.openState === 'closed' &&
            msg.signature === this.parentId
          ) {
            this.openState = 'opening';
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
  }

  class Item extends Subject {
    constructor(id) {
      super();
      this.id = id;
      this.elem = $('#' + id);
      this.parentId = Item.assignParentId(this.elem);
      this.childId = Item.assignChildId(this.elem);
      this.siblingIds = Item.assignSiblingIds.call(this, this.elem);
      this._numInactiveSiblings = 0;
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
      var observerIds = [];

      observerIds.push(this.parentId, this.childId);
      this.siblingIds.forEach(id => {
        observerIds.push(id);
      });

      observerIds.forEach(id => {
        var obj = Menu.loadComponent(id);
        this.addObserver(obj);
      }, this);

      return this;
    }
    handleClick() {
      if (!this.hasChild()) { return; }

      var child = new List(this.childId);
      if (child.openState === 'closed') {
        var msg = {
          title: 'list-is-opening',
          signature: this.id
        };
        this.notifyObservers(msg);
      }
    }
    receiveNotification(msg) {
      switch (msg.title) {
        case 'list-is-opening':
          if (this.id === msg.signature) { return; }

          // default message if child has no children OR if child state is 'closed'
          var newMsg = {
            title: 'item-is-inactive',
            signature: this.id
          };

          if (
            this.hasChild() &&
            this.getChildOpenState() === 'open'
          ) {
            newMsg = msg;
          }
          this.init();
          this.notifyObservers(newMsg);
          break;
        case 'item-is-inactive':
          if (
            this.siblingIds.find(id => id === msg.signature) &&
            this.getChildOpenState() === 'opening'
          ) {
            this.init();
            this.siblingIsInactive();
          }
          break;
      }
    }
    siblingIsInactive() {
      this._numInactiveSiblings++;
      if (this._numInactiveSiblings === this.siblingIds.length) {
        var msg = {
          title: 'list-can-open',
          signature: this.id
        };
        this.notifyObservers(msg);
        this._numInactiveSiblings = 0;
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
    static assignSiblingIds(elem) {
      var siblings = elem.siblings('li');
      return siblings.map(function() {
        return $(this).attr('id');
      }).get();
    }
  }

  var menu = new Menu('.horizontal-menu');
  menu.init();

});