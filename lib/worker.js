// Web Worker wrapper for image resize function

'use strict';

module.exports = function () {
  const MathLib = require('./mathlib');
  const supported_features = require('./supported_features');

  let mathLib;

  function resize(data) {
    let tileOpts = data.opts;
    let returnBitmap = false;

    if (!tileOpts.src && tileOpts.srcBitmap) {
      let canvas = new OffscreenCanvas(tileOpts.width, tileOpts.height);
      let ctx = canvas.getContext('2d');
      ctx.drawImage(tileOpts.srcBitmap, 0, 0);
      tileOpts.src = ctx.getImageData(0, 0, tileOpts.width, tileOpts.height).data;
      canvas.width = canvas.height = 0;
      canvas = null;
      tileOpts.srcBitmap.close();
      tileOpts.srcBitmap = null;
      // Temporary force out data to typed array, because Chrome have artefacts
      // https://github.com/nodeca/pica/issues/223
      // returnBitmap = true;
    }

    if (!mathLib) mathLib = new MathLib(data.features);

    // Use multimath's sync auto-init. Avoid Promise use in old browsers,
    // because polyfills are not propagated to webworker.
    let result = mathLib.resizeAndUnsharp(tileOpts);

    if (returnBitmap) {
      let toImageData = new ImageData(new Uint8ClampedArray(result), tileOpts.toWidth, tileOpts.toHeight);
      let canvas = new OffscreenCanvas(tileOpts.toWidth, tileOpts.toHeight);
      let ctx = canvas.getContext('2d');

      ctx.putImageData(toImageData, 0, 0);

      createImageBitmap(canvas).then(bitmap => {
        postMessage({ bitmap }, [ bitmap ]);
      });
    } else {
      postMessage({ data: result }, [ result.buffer ]);
    }
  }

  const methods = {
    resize: resize,
    get_supported_features: supported_features.get_supported_features
  };

  /* eslint-disable no-undef */
  onmessage = function (ev) {
    let method = ev.data.method || 'resize';

    if (!methods[method]) {
      postMessage({ err: `Unknown worker method: ${method}` });
      return;
    }

    Promise.resolve()
      .then(() => methods[method](ev.data))
      .then(
        result => {
          if (method !== 'resize') postMessage({ data: result });
        },
        err => { postMessage({ err }); }
      );
  };
};
