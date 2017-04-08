// Web Worker wrapper for image resize function

'use strict';

module.exports = function () {
  const MathLib = require('./mathlib');

  let mathLib;

  /* eslint-disable no-undef */
  onmessage = function (ev) {
    if (!mathLib) mathLib = new MathLib();

    var opts = ev.data;

    mathLib.init()
      .then(() => {
        let result = mathLib.resizeAndUnsharp(opts);
        postMessage({ result }, [ result.buffer ]);
      })
      .catch(err => {
        postMessage({ err });
      });
  };
};
