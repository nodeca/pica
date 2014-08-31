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
