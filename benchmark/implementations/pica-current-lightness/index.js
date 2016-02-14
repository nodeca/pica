'use strict';

var lightness = require('../../../lib/js/unsharp').lightness;

exports.run = function(data) {
  var buffer = data.buffer;

  return lightness(buffer, data.width, data.height);
};
