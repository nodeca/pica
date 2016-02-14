'use strict';

var resize = require('../../../lib/js/resize_array');

exports.run = function(data) {
  var out_result;

  resize({
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
