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
    notifyObservers(event, messageObj) {
      for (var i = 0; i < this.observerList.length; i++) {
        this.observerList[i].trigger(event);
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
      this.openState = 'closed';
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
    // what if family props are added in the constructor so that full objects are able to be added as observers?
    // that way the subject doens't need to mess with passing in ids and class names
    // and then when child state is needed, get child, run init (which adds observers) if necessary
    // when is registering observers necessary? outside object shouldn't have to fuss
    // but i think it's reasonble that when notifying observers, the subject can call init (use interface) and then
    // run common method

    // in order to avoid each object have a fully loaded version of all objects, now we have ids
    // at some point, these ids will be needed to init objects
    // a DB approach could be taken where a unique id is provided and the corresponding class is returned
    // that could be better than making subjects know too much about their observers

    // also, how should observers we stored, as ids or objects?
    // options are:
    // #1 store as ids, when notified, init object
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
      if (child.openState === 'closed') {
        // notify observers 'list-is-opening';
        var test = 1;
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