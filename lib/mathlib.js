// Collection of math functions
//
// 1. Combine components together
// 2. Has async init to load wasm modules
//
'use strict';


var inherits  = require('inherits');
var Multimath = require('multimath');

var mm_unsharp_mask = require('multimath/lib/unsharp_mask');
var mm_resize       = require('./mm_resize');


function MathLib(requested_features) {
  var __requested_features = requested_features || [];

  var features = {
    js:   __requested_features.indexOf('js') >= 0,
    wasm: __requested_features.indexOf('wasm') >= 0
  };

  Multimath.call(this, features);

  this.features = {
    js:   features.js,
    wasm: features.wasm && this.has_wasm
  };

  this.use(mm_unsharp_mask);
  this.use(mm_resize);
}


inherits(MathLib, Multimath);


MathLib.prototype.resizeAndUnsharp = function resizeAndUnsharp(options, cache) {
  var result = this.resize(options, cache);

  if (options.unsharpAmount) {
    this.unsharp_mask(
      result,
      options.toWidth,
      options.toHeight,
      options.unsharpAmount,
      options.unsharpRadius,
      options.unsharpThreshold
    );
  }

  return result;
};


module.exports = MathLib;
