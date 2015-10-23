import Subject from './subject';
import Container from './container';
import List from './list';
import Item from './item';

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

class Menu extends Subject {
  constructor(elem, settings) {
    super();
    this.elem = $(elem);
    this.settings = settings;
  }
  init() {
    this.registerObservers();
  }
  assignDOMProperties() {
    // menu
    addSettingAttrs(this.settings, this.elem);

    // uls
    var uls = $('ul', this.elem);
    uls.each(function(i) {
      //assignId.call(this, 'hm-list-');
      if (i === 0) {
        assignClass.call(this, ['hm-list-top-level']);
      }
      assignClass.call(this, ['hm-list']);
      assignAttr.call(this, [
        { name: 'list-open-state', val: 'closed' },
        { name: 'num-inactive-children', val: 0 },
        { name: 'item-intends-to-open-child-list', val: '' }
      ]);
      // ul width matches that of menu set from css
      var menuWidth = $(this).closest('.horizontal-menu').outerWidth();
      var parentItemPosLeft = $(this).parent().position().left;
      $(this).css({
        left: -1 * parentItemPosLeft,
        width: menuWidth
      });
    });

    setStripeClass.call(this, uls.eq(0), 'even');

    // lis
    var lis = $('li', this.elem);
    lis.each(function() {
      //assignId.call(this, 'hm-item-');
      assignClass.call(this, ['hm-item']);
      assignAttr.call(this, [
        { name: 'item-allows-message-forwarding', val: 'true' }
      ]);
    });

    function setStripeClass(elem, c) {
      elem.addClass('hm-list-' + c);
      // get next elem
      // either next child ul or start back at the top with the first child of the top-level ul that doesn't have a stripe class
      var nextElem = elem.find('ul').not('.hm-list-even, .hm-list-odd').eq(0);
      var newC = c === 'even' ? 'odd' : 'even';

      if (!nextElem.length) {
        nextElem = $('ul', this.elem).eq(0).find('ul').not('.hm-list-even, .hm-list-odd').eq(0);
        newC = 'odd';
        if (!nextElem.length) { return; }
      }

      return setStripeClass.call(this, nextElem, newC);
    }

    // set plugin settings as attrs on DOM element, convert from camel case to spinal case for use in html
    function addSettingAttrs(settings, target) {
      for (var s in settings) {
        var matchIndexes = [];
        var reg = /([A-Z])/g;
        var matches;
        while ((matches = reg.exec(s)) !== null) {
          matchIndexes.push(matches.index);
        }

        var attrName = s.toLowerCase();
        matchIndexes.forEach((m, i) => {
          // consider the addition of previous dashs by adding the current index to the match index
          attrName = attrName.slice(0, m + i) + '-' + attrName.slice(m + i);
        });

        target.attr('hm-' + attrName, settings[s]);
      }
    }

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

      if (
        openIds.contains(activeTrailItem.childId) ||
        !activeTrailItem.hasChild()
      ) {
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

    $(window).on('resize', setResponsiveULWidth.bind(this));

    this.elem.hover(handleMouseenter, handleMouseleave.bind(this));

    function setResponsiveULWidth() {
      var menuWidth = this.elem.outerWidth();
      $('ul', this.elem).css({
        width: menuWidth
      });
    }

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
  registerObservers() {
    // parent
    var container = ('#horinzontal-menu-container');
    if (container.length === 1) {
      var parent = new Container('#horinzontal-menu-container');
      this.addObserver(parent, 'ListIntendsToOpen');
      this.addObserver(parent, 'ListHasClosed');
    }
    // children
    var childId = $('.hm-list-top-level', this.elem).attr('id');
    var child = new List(childId);
    this.addObserver(child, 'ListTopLevelCanOpen');
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
    } else if (elem.hasClass('horizontal-menu')) {
      obj = new Menu(elem);
    }
    return obj;
  }
  static getSettings(s) {
    return this.settings[s];
  }
}

export default Menu;