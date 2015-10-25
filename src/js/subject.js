class Subject {

  constructor() {
    this.observerList = {};
  }
  // register observers to specific channels to avoid unnecessary communication
  addObserver(item, channel) {
    if (!this.observerList.hasOwnProperty(channel)) {
      this.observerList[channel] = [];
    }
    this.observerList[channel].push(item);
  }
  removeObserver(item, channel) {
    if (!this.observerList.hasOwnProperty(channel)) { return; }
    for (var i = 0; i < this.observerList[channel].length; i++) {
      if (this.observerList[channel][i]['id'] === item.id) {
        this.observerList[channel].splice(i, 1);
      }
    }
  }
  notifyObservers(msg) {
    if (this.observerList.hasOwnProperty(msg.channel)) {
      for (var i = 0; i < this.observerList[msg.channel].length; i++) {
        this.observerList[msg.channel][i].receiveNotification(msg);
      }
    } else {
      var e = new Error("Horizontal Menu: subject attempting to notify observers on channel that doesn't exist");
      throw e.message;
    }
  }
  receiveNotification(msg) {
    // add a check that method exists
    if (typeof this['rnThat' + msg.channel] !== 'undefined') {
      this['rnThat' + msg.channel](msg);
    } else {
      var e = new Error('Horizontal Menu: this object does not have the rnThat' + msg.channel + ' method');
      throw e;
    }
  }
  registerObservers() {
    this.registerParentObservers();
    this.registerChildObservers();
  }
  registerParentObservers() {}
  registerChildObservers() {}
}

export default Subject;