'use strict';

/*global window:true*/

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
function resizeBuffer(src, width, height, toWidth, toHeight, method, callback) {
  var wr;

  if (isFunction(method)) {
    callback = method;
    method = 3;
  }

  if (WORKER) {
    // TODO: rewrite to allocate worker only once
    wr = require('webworkify')(resizeWorker);

    wr.onmessage = function(ev) {
      callback(ev.data.err, ev.data.output);
      wr.terminate();
    };

    wr.postMessage({
      src: src,
      width: width,
      height: height,
      toWidth: toWidth,
      toHeight: toHeight,
      method: method
    });

  } else {
    resize(src, width, height, toWidth, toHeight, method, callback);
  }
}


// Canvas async resize
//
function resizeCanvas(from, to, method, callback) {
  var w = from.width,
      h = from.height,
      w2 = to.width,
      h2 = to.height;

  if (isFunction(method)) {
    callback = method;
    method = 3;
  }

  var src = from.getContext('2d').getImageData(0, 0, w, h).data;

  resizeBuffer(src, w, h, w2, h2, method, function (err, output) {
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