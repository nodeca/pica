'use strict'

var pica = require('../../../');

exports.run = function(data, level) {
  var out_result;

  pica.resizeBuffer(
    data.buffer,
    data.width,
    data.height,
    data.width * data.scale,
    data.height * data.scale,
    3,
    function(result) {
      out_result = result;
  });

  return out_result;
}
