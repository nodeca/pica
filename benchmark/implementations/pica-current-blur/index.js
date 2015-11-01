'use strict';

var glurMono16 = require('glur/mono16');

exports.run = function(data) {
  var buffer = data.buffer;
  var size = buffer.length >> 2;
  var b = new Uint16Array(size);
  for (var i = 0; i < size; i++) {
    b[i] = buffer[4 * i] * 257;
  }

  glurMono16(b, data.width, data.height, 100, 1.0, 0);
  return b;
};
