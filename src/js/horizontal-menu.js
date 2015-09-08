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

  //var testObserver = $('.horizontal-menu');
  $('.horizontal-menu').on('woof', function() {
    console.log('crikey, ive been woofed');
  });

  var s = new Subject();
  s.addObserver($('.horizontal-menu'));
  s.notifyObservers('woof');
});