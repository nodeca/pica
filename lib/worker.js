// Web Worker wrapper for image resize function

'use strict';

module.exports = function () {
  const MathLib = require('./mathlib');

  let mathLib;

  /* eslint-disable no-undef */
  onmessage = function (ev) {
    let opts = ev.data.opts;

    if (!mathLib) mathLib = new MathLib(ev.data.features);

    // Use multimath's sync auto-init. Avoid Promise use in old browsers,
    // because polyfills are not propagated to webworker.
    let result = mathLib.resizeAndUnsharp(opts);

    postMessage({ result }, [ result.buffer ]);
  };
};
