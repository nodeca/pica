'use strict';

var webworkify = require('webworkify');
var resizeWorker = require('./js/worker.js');
/* global navigator */

function ResizerWW () {
  this.concurrency = navigator && navigator.hardwareConcurrency || 4;

  this.workers = [];
  for (var i = 0; i < this.concurrency; i++) {
    this.workers.push(webworkify(resizeWorker));
  }
  this.workerIndex = 0;
}

ResizerWW.prototype.resize = function (from, to, options, callback) {
  var ctxTo = to.getContext('2d');
  var imageDataTo, dest;
  var _opts = {
    src:      from.getContext('2d').getImageData(0, 0, options.width, options.height).data,
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
    unsharpAmount: options.unsharpAmount,
    unsharpRadius: options.unsharpRadius,
    unsharpThreshold: options.unsharpThreshold
  };

  var worker = this.workers.pop();
  var self = this;

  worker.onmessage = function (ev) {
    var i, l, output;

    self.workers.push(worker);

    if (ev.data.err) {
      callback(ev.data.err);
      return;
    }

    imageDataTo = ctxTo.createImageData(options.toWidth, options.toHeight);
    output = ev.data.output;
    dest = imageDataTo.data;

    if (dest.set) {
      dest.set(output);
    } else {
      for (i = 0, l = output.length; i < l; i++) {
        dest[i] = output[i];
      }
    }

    ctxTo.putImageData(imageDataTo, 0, 0);
    callback();
  };

  worker.postMessage(_opts, [ _opts.src.buffer ]);
};

ResizerWW.prototype.cleanup = function () {
  for (var i = 0; i < this.workers.length; i++) {
    this.workers[i].terminate();
  }
};

module.exports = ResizerWW;
