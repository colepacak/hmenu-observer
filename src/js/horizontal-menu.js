import Menu from './menu.js';

(function($) {
  $.fn.horizontalMenu = function(options) {

    var settings = $.extend({
      animDuration: 500
    }, options);

    return this.each(function() {
      var menu = new Menu(this, settings);
      menu.init();
    });
  }
})(jQuery);