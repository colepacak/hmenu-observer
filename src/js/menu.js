import Subject from './subject';
import List from './list';
import Item from './item';

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

export default Menu;