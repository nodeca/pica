'use strict';

/*global window, document*/
/*eslint space-infix-ops:0*/

// Feature detect
var WORKER = (typeof window !== 'undefined') && ('Worker' in window);
if (WORKER) {
  // IE don't allow to create webworkers from string. We should check it.
  // https://connect.microsoft.com/IE/feedback/details/801810/web-workers-from-blob-urls-in-ie-10-and-11
  try {
    var wkr = require('webworkify')(function () {});
    wkr.terminate();
  } catch (__) {
    WORKER = false;
  }
}

var WEBGL = false,
    __cvs;
try {
  if (typeof document !== 'undefined' &&
      typeof window !== 'undefined' &&
      window.WebGLRenderingContext) {

    __cvs = document.createElement('canvas');

    if (__cvs.getContext('webgl') || __cvs.getContext('experimental-webgl')) {
      WEBGL = true;
    }
  }
} catch (__) {
} finally {
  __cvs = null;
}

var resize       = require('./lib/resize');
var resizeWorker = require('./lib/resize_worker');
var resizeWebgl  = require('./lib/resize_webgl');


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
    dest:     null,
    width:    options.width|0,
    height:   options.height|0,
    toWidth:  options.toWidth|0,
    toHeight: options.toHeight|0,
    quality:  options.quality,
    alpha:    options.alpha,
    unsharpAmount:    options.unsharpAmount,
    unsharpRadius:    options.unsharpRadius,
    unsharpThreshold: options.unsharpThreshold
  };

  // Force flag reset to simplify status check
  if (!WORKER) { exports.WW = false; }

  if (WORKER && exports.WW) {
    exports.debug('Resize buffer in WebWorker');

    wr = require('webworkify')(resizeWorker);

    wr.onmessage = function(ev) {
      var i, l,
          dest = options.dest,
          output = ev.data.output;

      // If we got output buffer by reference, we should copy data,
      // because WW returns independent instance
      if (dest) {
        // IE ImageData can return old-style CanvasPixelArray
        // without .set() method. Copy manually for such case.
        if (dest.set) {
          dest.set(output);
        } else {
          for (i = 0, l = output.length; i < l; i++) {
            dest[i] = output[i];
          }
        }
      }
      callback(ev.data.err, output);
      wr.terminate();
    };

    if (options.transferable) {
      wr.postMessage(_opts, [ options.src.buffer ]);
    } else {
      wr.postMessage(_opts);
    }
    // Expose worker when available, to allow early termination.
    return wr;
  }

  // Fallback to sync call, if WebWorkers not available
  exports.debug('Resize buffer sync (freeze event loop)');

  _opts.dest = options.dest;
  resize(_opts, callback);
  return null;
}


// Canvas async resize
//
function resizeCanvas(from, to, options, callback) {
  var w = from.width,
      h = from.height,
      w2 = to.width,
      h2 = to.height;
  var ctxTo, imageDataTo;

  if (isFunction(options)) {
    callback = options;
    options = {};
  }

  if (!isNaN(options)) {
    options = { quality: options, alpha: false };
  }

  // Force flag reset to simplify status check
  if (!WEBGL) { exports.WEBGL = false; }

  if (WEBGL && exports.WEBGL) {
    exports.debug('Resize canvas with WebGL');

    return resizeWebgl(from, to, options, function (err, data) {
      if (err) {
        exports.debug('WebGL resize failed, do fallback and cancel next attempts');
        exports.debug(err);

        WEBGL = false;
        return resizeCanvas(from, to, options, callback);
      }

      ctxTo = to.getContext('2d');
      imageDataTo = ctxTo.getImageData(0, 0, w2, h2);

      // copy flipped y

      var i, j, p0, p1;

      for (j = 0; j < h2; j++) {
        for (i = 0; i < w2; i++) {
          p0 = (i + j*w2)*4;
          p1 = (i + (h2 - j)*w2)*4;
          imageDataTo.data[p0] = data[p1];
          imageDataTo.data[p0+1] = data[p1+1];
          imageDataTo.data[p0+2] = data[p1+2];
          imageDataTo.data[p0+3] = data[p1+3];
        }
      }

      ctxTo.putImageData(imageDataTo, 0, 0);
      callback();
    });

  }

  exports.debug('Resize canvas: prepare data');

  ctxTo = to.getContext('2d');
  imageDataTo = ctxTo.getImageData(0, 0, w2, h2);

  var _opts = {
    src:      from.getContext('2d').getImageData(0, 0, w, h).data,
    dest:     imageDataTo.data,
    width:    from.width,
    height:   from.height,
    toWidth:  to.width,
    toHeight: to.height,
    quality:  options.quality,
    alpha:    options.alpha,
    unsharpAmount:    options.unsharpAmount,
    unsharpRadius:    options.unsharpRadius,
    unsharpThreshold: options.unsharpThreshold,
    transferable: true
  };

  return resizeBuffer(_opts, function (err/*, output*/) {
    if (err) {
      callback(err);
      return;
    }

    ctxTo.putImageData(imageDataTo, 0, 0);
    callback();
  });
}


exports.resizeBuffer = resizeBuffer;
exports.resizeCanvas = resizeCanvas;
exports.WW = WORKER;
exports.WEBGL = false; // WEBGL;
exports.debug = function () {};
