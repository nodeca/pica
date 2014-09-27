// Proxy to simplify split between webworker/plain calls
'use strict';

var resize = require('./pure/resize');

module.exports = function (options, callback) {
  var output = resize(options);

  callback(null, output);
};
