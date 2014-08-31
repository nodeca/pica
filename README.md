_In progress. Coming soon._


pica - fast client side image processor
=======================================

[![Build Status](https://travis-ci.org/nodeca/pica.svg?branch=master)](https://travis-ci.org/nodeca/pica)
[![NPM version](https://img.shields.io/npm/v/pica.svg)](https://www.npmjs.org/package/pica)

`pica` is one more experiment with high speed javascript, from authors of
[paco](https://github.com/nodeca/pako).

If you need to resize image in modern browser (for example, to save traffic
prior server upload), you will note, that canvas uses low quality interpolation
algorythms. We could not find modern javascript implementation with good
quality, fast speed and low memory requirements in the same time. That's why we
did `pica`.

`pica` is modular, and provides simple wrappers in top level API. But if you
need something special, use sourses from `./lib` folder directly.

Install
-------

node.js (to develop, build via browserify and so on):

```bash
npm install pica
```

bower:

```
bower install pica
```


API
---

### resizeBuffer(src, width, height, toWidth, toHeight, method, callback)

Async resize Uint8Array with RGBA image.

- __src__ - Uint8Array with source data
- __width__ - src image width
- __heigh__ - src image height
- __toWidth__ - output width
- __toHeigh__ - output height
- __method__ - lanczos3 by default
  - String: "_haming1_", "_lanczos2_" or "_lanczos3_" (first is fastest,
    last has the best quality)
  - or Number 1, 2 or 3.
- __callback(err, output)__ - function to call after resize complete
  - __err__ - error if happened
  - __output__ - Uint8Array with resized RGBA image data.

### resizeCanvas(from, to, method, callback)

Resize image from one canvas to another. Sizes are taken from canvas.

- __from__ - source canvas
- __to__ - destination canvas
- __method__ - lanczos3 by default
  - String: "_haming1_", "_lanczos2_" or "_lanczos3_" (first is fastest,
    last has the best quality)
  - or Number 1, 2 or 3.
- __callback(err)__ - function to call after resize complete
  - __err__ - error if happened


References
----------

You can find this links useful:

- discussions on stackoverflow:
  [1](http://stackoverflow.com/questions/943781/),
  [2](http://stackoverflow.com/questions/18922880/),
  [3](http://stackoverflow.com/questions/2303690/).
- chromium skia sources:
  [image_operations.cc](http://src.chromium.org/svn/trunk/src/skia/ext/image_operations.cc),
  [convolver.cc](http://src.chromium.org/svn/trunk/src/skia/ext/convolver.cc).


Authors
-------

- Andrey Tupitsin [@anrd83](https://github.com/andr83)
- Vitaly Puzrin [@puzrin](https://github.com/puzrin)


Licence
-------

MIT