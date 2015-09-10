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
        .initChildComponents();
    }
    assignIds() {
      var uls = $('ul', this.elem);
      uls.each(function() {
        assignId.call(this, 'hm-list-');
      });

      var lis = $('li', this.elem);
      lis.each(function() {
        assignId.call(this, 'hm-item-');
      });

      function assignId(prefix) {
        $(this).attr('id', prefix + $.uuid());
      }

      return this;
    }
    initChildComponents() {
      var uls = $('ul', this.elem);
      this.lists = uls.map(function() {
        return new List($(this).attr('id'));
      });

      var lis = $('li', this.elem);
      this.items = lis.map(function() {
        return new Item($(this).attr('id'));
      });

      return this;
    }
    // register observers on child components
  }

  class List extends Subject {
    constructor(id) {
      super();
      this.id = id;
      this.elem = $('#' + id);
      //this.children = this.elem.children().map(function() {
      //
      //});
      //this.numChildren = this.elem.children().length;
    }
    registerObservers() {

    }
  }

  class Item extends Subject {
    constructor(id) {
      super();
      this.id = id;
      this.elem = $('#' + id);
    }
    registersObservers() {
      // use some sort of Subject interface that includes registerObservers method
    }
  }

  var menu = new Menu('.horizontal-menu');
  menu.init();

});