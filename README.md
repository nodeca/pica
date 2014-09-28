pica - high quality image resize in browser
===========================================

[![Build Status](https://travis-ci.org/nodeca/pica.svg?branch=master)](https://travis-ci.org/nodeca/pica)
[![NPM version](https://img.shields.io/npm/v/pica.svg)](https://www.npmjs.org/package/pica)

`pica` is one more experiment with high speed javascript, from authors of
[paco](https://github.com/nodeca/pako). It does high quality images resize
in browser as fast as possible.

[__demo__](http://nodeca.github.io/pica/demo/)

If you need to resize image in modern browser, you will note, that canvas uses
low quality interpolation algorythms. That's why we did `pica`.

- It's not as fast as canvas, but still reasonable fast. With Lanczos filter and
  window=3, and huge image 5000x3000px resize takes ~1s on desktop and ~3s on
  mobile.
- If you browser supports Webworkers, pica automatically use it to avoid
  interface freeze.

Why it's useful:

- reduce upload size for big images - save time and traffic
- save server resources for image processing


Install
-------

node.js (to develop, build via browserify and so on):

```bash
npm install pica
```

bower:

```bash
bower install pica
```


API
---

### .resizeBuffer(options, callback)

Async resize Uint8Array with RGBA image.

- __options:__
  - __src__ - Uint8Array with source data.
  - __width__ - src image width.
  - __height__ - src image height.
  - __toWidth__ - output width.
  - __toHeigh__ - output height.
  - __quality__ - 0..3. Default - `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default - `false`.
  - __unsharpAmount - 0..500. Default - `0` (off). Usually 50..100 is good.
  - __unsharpThreshold__ - 0..100. Default - `0`. Try 10 for begibing.
  - __dest__ - Optional. Output buffer to write data. Help to avoid data copy
    if no WebWorkers available. Callback will return result buffer anyway.
- __callback(err, output)__ - function to call after resize complete:
  - __err__ - error if happened.
  - __output__ - Uint8Array with resized RGBA image data.


### .resizeCanvas(options, callback)

Resize image from one canvas to another. Sizes are taken from canvas.

- __from__ - source canvas.
- __to__ - destination canvas.
- __options__ - quality (number) or object:
  - __quality__ - 0..3. Default - `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default - `false`.
  - __unsharpAmount - 0..500. Default - `0` (off). Usually 50..100 is good.
  - __unsharpThreshold__ - 0..100. Default - `0`. Try 10 for begining.
- __callback(err)__ - function to call after resize complete:
  - __err__ - error if happened


### .WW - true/false

`true` if webworkers supported. You can use it for capabilities detection.
Also, you can set it `false` for debug, and pica will use direct function calls.


### What is quality

Pica has presets, to vary speed/quality ratio. To simplify interface, you can
select this presets with `quality` option param:

- 0 - Box filter, window 0.5px
- 1 - Hamming filter, window 1.0px
- 2 - Lanczos filter, window 2.0px
- 3 - Lanczos filter, window 3.0px


### Unsharp mask

Pica has built in unsharp mask, similar to photoshop, but limited with
radius 1.0. It's off by default. Set `unsharpAmount` and `unsharpThresold`
to activate filter.


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

- Loïc Faure-Lacroix [@llacroix](https://github.com/llacroix)
- Vitaly Puzrin [@puzrin](https://github.com/puzrin)


Licence
-------

[MIT](https://github.com/nodeca/pica/blob/master/LICENSE)