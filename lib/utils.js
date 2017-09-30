'use strict';


function objClass(obj) { return Object.prototype.toString.call(obj); }


module.exports.isCanvas = function isCanvas(element) {
  //return (element.nodeName && element.nodeName.toLowerCase() === 'canvas') ||
  let cname = objClass(element);

  return cname === '[object HTMLCanvasElement]'/* browser */ ||
         cname === '[object Canvas]'/* node-canvas */;
};


module.exports.isImage = function isImage(element) {
  //return element.nodeName && element.nodeName.toLowerCase() === 'img';
  return objClass(element) === '[object HTMLImageElement]';
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


module.exports.cib_support = function cib_support() {
  return Promise.resolve().then(() => {
    if (typeof createImageBitmap === 'undefined' ||
        typeof document === 'undefined') {
      return false;
    }

    let c = document.createElement('canvas');
    c.width = 100;
    c.height = 100;

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
