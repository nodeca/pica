'use strict';

var unsharp = require('../../../lib/js/unsharp');

exports.run = function(data) {
  var b;
  b = new Uint8Array(data.buffer.length);
  b.set(data.buffer);

  unsharp(b, data.width, data.height, 100, 1.0, 0);
  return b;
};
