'use strict'

var pica = require('../../../index.js');

exports.run = function(data, level) {
  var buffer = data.buffer;
  var out_result;

  pica.resizeBuffer(buffer.data, buffer.width, buffer.height, 300, 225, 3, function(result) {
    out_result = result; 
  });

  return out_result;
}
