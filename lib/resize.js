// Proxy to simplify split between webworker/plain calls
'use strict';

var resize = require('./pure/resize');

module.exports = function (src, width, height, toWidth, toHeight, method, callback) {
  var output = resize(src, method, width, height, toWidth, toHeight);

  callback(null, output);
};
