'use strict';

var IDLE = 2000;
var TIMEOUT = 500;

function Pool(create) {
  this.create = create;

  this.available = [];
  this.acquired = {};
  this.lastId = 1;

  this.timeoutId = 0;
}

Pool.prototype.acquire = function () {
  var self = this;
  var resource;
  if (this.available.length !== 0) {
    resource = this.available.pop();
  } else {
    resource = this.create();
    resource.id = this.lastId++;
    resource.release = function () {
      self.release(resource);
    };
  }
  this.acquired[resource.id] = resource;
  return resource;
};

Pool.prototype.release = function (resource) {
  delete this.acquired[resource.id];
  resource.lastUsed = Date.now();
  this.available.push(resource);

  if (this.timeoutId === 0) {
    this.timeoutId = setTimeout(this.gc.bind(this), TIMEOUT);
  }
};

Pool.prototype.gc = function () {
  var now = Date.now();

  this.available = this.available.filter(function (resource) {
    if (now - resource.lastUsed > IDLE) {
      resource.destroy();
      return false;
    }
    return true;
  });

  if (this.available.length !== 0) {
    this.timeoutId = setTimeout(this.gc.bind(this), TIMEOUT);
  } else {
    this.timeoutId = 0;
  }
};

module.exports = Pool;
