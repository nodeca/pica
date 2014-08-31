/* pica 0.0.0 nodeca/pica */!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.pica=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./":[function(require,module,exports){
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
},{"./lib/resize":1,"./lib/resize_worker":2,"webworkify":3}],1:[function(require,module,exports){
// Resize RGBA buffer


'use strict';


module.exports = function resize(src, width, height, toWidth, toHeight, method, callback) {
  // TODO: stub - now crop corner instead of resize
  var i, j, srcOffset, dstOffset = 0,
      output = new Uint8Array(toWidth * toHeight * 4);

  for (i = 0; i < toHeight; i++) {
    srcOffset = width * 4 * i;

    for (j = 0; j < toWidth; j++) {
      // Just copy RGBA
      output[dstOffset++] = src[srcOffset++];
      output[dstOffset++] = src[srcOffset++];
      output[dstOffset++] = src[srcOffset++];
      output[dstOffset++] = src[srcOffset++];
    }
  }

  callback(null, output);
};
},{}],2:[function(require,module,exports){
// Web Worker wrapper for image resize function

'use strict';

module.exports = function(self) {
  var resize = require('./resize');

  self.onmessage = function (ev) {
    var d = ev.data;

    resize(d.src, d.width, d.height, d.toWidth, d.toHeight, d.method, function(err, output) {
      if (err) {
        self.postMessage({ err: err });
        return;
      }

      self.postMessage({ output: output });
    });
  };
};

},{"./resize":1}],3:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn) {
    var keys = [];
    var wkey;
    var cacheKeys = Object.keys(cache);
    
    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        if (cache[key].exports === fn) {
            wkey = key;
            break;
        }
    }
    
    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
    
    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'],'require(' + stringify(wkey) + ')(self)'),
        scache
    ];
    
    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;
    return new Worker(window.URL.createObjectURL(
        new Blob([src], { type: 'text/javascript' })
    ));
};

},{}]},{},[])("./")
});