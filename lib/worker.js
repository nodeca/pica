// Web Worker wrapper for image resize function

'use strict';

module.exports = function () {
  const MathLib = require('./mathlib');
  const supported_features = require('./supported_features');

  let mathLib;

  function resize_math(data, tileOpts) {
    if (!mathLib) mathLib = new MathLib(data.features);

    // Use multimath's sync auto-init. Avoid Promise use in old browsers,
    // because polyfills are not propagated to webworker.
    return mathLib.resizeAndUnsharp(tileOpts);
  }

  function resize(data) {
    let result = resize_math(data, data.opts);

    postMessage({ data: result }, [ result.buffer ]);
  }

  function resize_bitmap(data) {
    let tileOpts = data.opts;
    let srcCanvas = new OffscreenCanvas(tileOpts.width, tileOpts.height);
    let srcCtx = srcCanvas.getContext('2d');

    srcCtx.drawImage(tileOpts.srcBitmap, 0, 0);
    tileOpts.src = srcCtx.getImageData(0, 0, tileOpts.width, tileOpts.height).data;
    srcCanvas.width = srcCanvas.height = 0;
    srcCanvas = null;
    tileOpts.srcBitmap.close();
    tileOpts.srcBitmap = null;

    let result = resize_math(data, tileOpts);
    let canvas = new OffscreenCanvas(tileOpts.toWidth, tileOpts.toHeight);
    let ctx = canvas.getContext('2d');

    let toImageData = ctx.createImageData(tileOpts.toWidth, tileOpts.toHeight);
    toImageData.data.set(result);
    ctx.putImageData(toImageData, 0, 0);

    let bitmap = canvas.transferToImageBitmap();

    postMessage({ bitmap: bitmap }, [ bitmap ]);
  }

  const methods = {
    resize: resize,
    resize_bitmap: resize_bitmap,
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
          if (method === 'get_supported_features') postMessage({ data: result });
        },
        err => { postMessage({ err }); }
      );
  };
};
