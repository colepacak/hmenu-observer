import MenuManager from './menu-manager.js';

(function($) {
  $.fn.horizontalMenu = function(options) {

    var settings = $.extend({
      animDuration: 500
    }, options);

    return this.each(function() {
      var menu = new MenuManager(this, settings);
      menu.init();
    });
  }
})(jQuery);