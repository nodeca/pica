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

var resize_js     = require('./lib/resize_js');
var resize_js_ww  = require('./lib/resize_js_ww');
var resize_webgl  = require('./lib/resize_webgl');
var assign        = require('object-assign');

////////////////////////////////////////////////////////////////////////////////
// Helpers
function _class(obj) { return Object.prototype.toString.call(obj); }
function isFunction(obj) { return _class(obj) === '[object Function]'; }

////////////////////////////////////////////////////////////////////////////////
// API methods

// Canvas async resize
//
function resizeCanvas(from, to, options, callback) {
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

    var id = resize_webgl(from, to, options, function (err) {
      if (err) {
        exports.debug('WebGL resize failed, do fallback and cancel next attempts');
        exports.debug(err);

        WEBGL = false;
        resizeCanvas(from, to, assign({}, options, { _id: id }), callback);
      } else {
        callback();
      }
    });
    return id;
  }

  // Force flag reset to simplify status check
  if (!WORKER) { exports.WW = false; }

  if (WORKER && exports.WW) {
    exports.debug('Resize buffer in WebWorker');

    return resize_js_ww(from, to, options, callback);
  }

  // Fallback to sync call, if WebWorkers not available
  exports.debug('Resize buffer sync (freeze event loop)');

  return resize_js(from, to, options, callback);
}

function terminate(id) {
  resize_js.terminate(id);
  resize_js_ww.terminate(id);
  resize_webgl.terminate(id);
}

exports.resizeCanvas = resizeCanvas;
exports.terminate = terminate;
exports.WW = WORKER;
exports.WEBGL = false; // WEBGL;
exports.debug = function () {};
