'use strict';

var resize = require('./js/resize_array');
var unsharp = require('./js/unsharp');

function Resizer () {
  this.concurrency = 1;
}

Resizer.prototype.resize = function (from, to, options, callback) {
  var ctxTo = to.getContext('2d');
  var imageDataTo = ctxTo.createImageData(options.toWidth, options.toHeight);
  var _opts = {
    src:      from.getContext('2d').getImageData(0, 0, options.width, options.height).data,
    dest:     imageDataTo.data,
    width:    options.width,
    height:   options.height,
    toWidth:  options.toWidth,
    toHeight: options.toHeight,
    scaleX:   options.scaleX,
    scaleY:   options.scaleY,
    offsetX:  options.offsetX,
    offsetY:  options.offsetY,
    quality:  options.quality,
    alpha:    options.alpha,
    transferable: true
  };

  resize(_opts);
  if (options.unsharpAmount) {
    unsharp(_opts.dest, _opts.toWidth, _opts.toHeight,
      options.unsharpAmount, options.unsharpRadius, options.unsharpThreshold);
  }

  ctxTo.putImageData(imageDataTo, 0, 0);
  callback();
};

Resizer.prototype.cleanup = function () {};

module.exports = Resizer;
