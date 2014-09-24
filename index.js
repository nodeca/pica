'use strict';

/*global window:true*/
/*eslint space-infix-ops:0*/

// Feature detect
var WORKER = (typeof window !== 'undefined') && ('Worker' in window);
//var WORKER_OK = false;

var resize       = require('./lib/resize');
var resizeWorker = require('./lib/resize_worker');


////////////////////////////////////////////////////////////////////////////////
// Helpers
function _class(obj) { return Object.prototype.toString.call(obj); }
function isFunction(obj) { return _class(obj) === '[object Function]'; }


////////////////////////////////////////////////////////////////////////////////
// API methods


// RGBA buffer async resize
//
function resizeBuffer(options, callback) {
  var wr;

  var _opts = {
    src:      options.src,
    width:    options.width|0,
    height:   options.height|0,
    toWidth:  options.toWidth|0,
    toHeight: options.toHeight|0,
    quality:  options.quality,
    alpha:    options.alpha
  };

  if (WORKER & exports.WW) {
    // TODO: rewrite to allocate worker only once
    wr = require('webworkify')(resizeWorker);

    wr.onmessage = function(ev) {
      callback(ev.data.err, ev.data.output);
      wr.terminate();
    };

    wr.postMessage(_opts);

  } else {
    resize(_opts, callback);
  }
}


// Canvas async resize
//
function resizeCanvas(from, to, options, callback) {
  var w = from.width,
      h = from.height,
      w2 = to.width,
      h2 = to.height;

  if (isFunction(options)) {
    callback = options;
    options = {};
  }

  if (!isNaN(options)) {
    options = { quality: options, alpha: false };
  }

  var _opts = {
    src:      from.getContext('2d').getImageData(0, 0, w, h).data,
    width:    from.width,
    height:   from.height,
    toWidth:  to.width,
    toHeight: to.height,
    quality:  options.quality,
    alpha:    options.alpha
  };

  resizeBuffer(_opts, function (err, output) {
    if (err) {
      callback(err);
      return;
    }

    var ctxTo = to.getContext('2d');

    var imageData = ctxTo.getImageData(0, 0, w2, h2);

    imageData.data.set(output);
    ctxTo.putImageData(imageData, 0, 0);

    callback();
  });
}


exports.resizeBuffer = resizeBuffer;
exports.resizeCanvas = resizeCanvas;
exports.WW = true;
