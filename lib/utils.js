'use strict';


function objClass(obj) { return Object.prototype.toString.call(obj); }


module.exports.isCanvas = function isCanvas(element) {
  let cname = objClass(element);

  return cname === '[object HTMLCanvasElement]'/* browser */ ||
         cname === '[object OffscreenCanvas]' ||
         cname === '[object Canvas]'/* node-canvas */;
};


module.exports.isImage = function isImage(element) {
  return objClass(element) === '[object HTMLImageElement]';
};


module.exports.isImageBitmap = function isImageBitmap(element) {
  return objClass(element) === '[object ImageBitmap]';
};


module.exports.limiter = function limiter(concurrency) {
  let active = 0,
      queue  = [];

  function roll() {
    if (active < concurrency && queue.length) {
      active++;
      queue.shift()();
    }
  }

  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        fn().then(
          result => {
            resolve(result);
            active--;
            roll();
          },
          err => {
            reject(err);
            active--;
            roll();
          }
        );
      });

      roll();
    });
  };
};


module.exports.cib_quality_name = function cib_quality_name(num) {
  switch (num) {
    case 0: return 'pixelated';
    case 1: return 'low';
    case 2: return 'medium';
  }
  return 'high';
};


module.exports.cib_support = function cib_support(createCanvas) {
  return Promise.resolve().then(() => {
    if (typeof createImageBitmap === 'undefined') {
      return false;
    }

    let c = createCanvas(100, 100);

    return createImageBitmap(c, 0, 0, 100, 100, {
      resizeWidth: 10,
      resizeHeight: 10,
      resizeQuality: 'high'
    })
    .then(bitmap => {
      let status = (bitmap.width === 10);

      // Branch below is filtered on upper level. We do not call resize
      // detection for basic ImageBitmap.
      //
      // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap
      // old Crome 51 has ImageBitmap without .close(). Then this code
      // will throw and return 'false' as expected.
      //
      bitmap.close();
      c = null;
      return status;
    });
  })
  .catch(() => false);
};


module.exports.worker_offscreen_canvas_support = function worker_offscreen_canvas_support() {
  return new Promise((resolve, reject) => {
    function workerPayload(self) {
      Promise.resolve()
        .then(() => {
          let canvas = new OffscreenCanvas(10, 10);
          // test that 2d context can be used in worker
          let ctx = canvas.getContext('2d');
          ctx.rect(0, 0, 1, 1);
          // test that cib can be used to return image bitmap from worker
          return createImageBitmap(canvas, 0, 0, 1, 1);
        })
        .then(
          () => self.postMessage(true),
          () => self.postMessage(false)
        );
    }

    let code = btoa(`(${workerPayload.toString()})(self);`);
    let w = new Worker(`data:text/javascript;base64,${code}`);
    w.onmessage = ev => (ev.data ? resolve() : reject());
    w.onerror = reject;
  });
};
