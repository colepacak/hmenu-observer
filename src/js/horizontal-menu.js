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
        assignClass.call(this, 'hm-list');
      });

      var lis = $('li', this.elem);
      lis.each(function() {
        assignId.call(this, 'hm-item-');
        assignClass.call(this, 'hm-item');
      });

      function assignId(prefix) {
        $(this).attr('id', prefix + $.uuid());
      }

      function assignClass(name) {
        $(this).addClass(name);
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
      this._openState = 'closed';
    }
    init() {
      this.elem.addClass('hm-list-closed');
      this.registerObservers();
      // todo: handle active trail
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
            this.openState = 'opening'
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
  }

  class Item extends Subject {
    constructor(id) {
      super();
      this.id = id;
      this.elem = $('#' + id);
      this.parentId = Item.assignParentId(this.elem);
      this.childId = Item.assignChildId(this.elem);
      this.siblingIds = Item.assignSiblingIds.call(this, this.elem);
    }
    init() {
      this.registerObservers();
      return this;
    }
    hasChild() {
      return this.childId ? true : false;
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
      child.init();
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

          if (this.hasChild()) {
            var child = new List(this.childId);
            child.init();
            if (child.openState === 'open') {
              newMsg = msg;
            }
          }
          this.notifyObservers(newMsg);
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