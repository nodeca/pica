// Web Worker wrapper for image resize function

'use strict';

module.exports = function (self) {
  var resize = require('./resize_array');
  var unsharp = require('./unsharp');

  self.onmessage = function (ev) {
    var options = ev.data;
    options.dest = new Uint8Array(options.toWidth * options.toHeight * 4);

    resize(options);

    if (options.unsharpAmount) {
      unsharp(options.dest, options.toWidth, options.toHeight,
        options.unsharpAmount, options.unsharpRadius, options.unsharpThreshold);
    }

    self.postMessage({ output: options.dest }, [ options.dest.buffer ]);
  };
};
