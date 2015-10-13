import Menu from './menu.js';

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

$(function() {
  var menu = new Menu('.horizontal-menu');
  menu.init();
});