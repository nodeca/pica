// Collection of math functions
//
// 1. Combine components together
// 2. Has async init to load wasm modules
//
'use strict';


function MathLib(requested_features) {
  this.__requested_features = requested_features;
  this.__initPromise = null;

  // List of supported features, according to options & browser/node.js
  this.features = {
    js:   false, // pure JS implementation, can be disabled for testing
    wasm: false  // webassembly implementation for heavy functions
  };
}


MathLib.prototype.init = function init() {
  this.__initPromise = Promise.resolve().then(() => {
    this.features.js = true;

    // Map supported implementations
    this.resize  = this.resize_js;
    this.unsharp = this.unsharp_js;

    return this;
  });

  return this.__initPromise;
};


MathLib.prototype.resizeAndUnsharp = function resizeAndUnsharp(options) {
  let result = this.resize(options);

  if (options.unsharpAmount) {
    this.unsharp(
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


// Pin implementations
MathLib.prototype.unsharp_js = require('./mathlib/unsharp_js');
MathLib.prototype.resize_js  = require('./mathlib/resize_js');


module.exports = MathLib;
