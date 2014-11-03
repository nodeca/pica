'use strict';

var pica = require('./1.0.4/');

exports.run = function(data) {
  var out_result;

  pica.resizeBuffer({
    src: data.buffer,
    width: data.width,
    height: data.height,
    toWidth: (data.width * data.scale)|0,
    toHeight: (data.height * data.scale)|0,
    quality: 3
  }, function(result) {
    out_result = result;
  });

  return out_result;
};
