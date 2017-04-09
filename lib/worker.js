// Web Worker wrapper for image resize function

'use strict';

module.exports = function () {
  const MathLib = require('./mathlib');

  let mathLib;
  let cache = {};

  /* eslint-disable no-undef */
  onmessage = function (ev) {
    let opts = ev.data.opts;

    if (!mathLib) mathLib = new MathLib(ev.data.features, ev.data.preload);

    mathLib.init()
      .then(() => {
        let result = mathLib.resizeAndUnsharp(opts, cache);
        postMessage({ result }, [ result.buffer ]);
      })
      .catch(err => {
        postMessage({ err });
      });
  };
};
