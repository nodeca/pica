pica - high quality image resize in browser
===========================================

[![Build Status](https://travis-ci.org/nodeca/pica.svg?branch=master)](https://travis-ci.org/nodeca/pica)
[![NPM version](https://img.shields.io/npm/v/pica.svg)](https://www.npmjs.org/package/pica)

`pica` is one more experiment with high speed javascript, from authors of
[paco](https://github.com/nodeca/pako). It does high quality images resize
in browser as fast as possible.

[__demo__](http://nodeca.github.io/pica/demo/)

If you need to resize images in modern browsers, by default, use canvas'
low quality interpolation algorythms. That's why we wrote `pica`.

- It's not as fast as canvas, but still reasonably fast. With Lanczos filter and
  `window=3`, and huge image 5000x3000px resize takes ~1s on desktop and ~3s on
  mobile.
- If your [browser supports Webworkers](http://caniuse.com/#feat=webworkers), pica automatically uses it to avoid
  interface freeze.

Why it's useful:

- reduce upload size for big images to pre-process in browser, saving time and bandwidth
- save server resources for image processing
- [HiDPI image technique](http://www.html5rocks.com/en/mobile/high-dpi/#toc-tech-overview) for responsive and retna
- download single image for both thumbnail and detail-zoom


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
  - __quality__ - 0..3. Default = `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default = `false`.
  - __unsharpAmount__ - 0..500. Default = `0` (off). Usually between 50 to 100 is good.
  - __unsharpThreshold__ - 0..100. Default = `0`. Try 10 as starting point.
  - __dest__ - Optional. Output buffer to write data. Help to avoid data copy
    if no WebWorkers available. Callback will return result buffer anyway.
  - __transferable__ - Optional. Default = `false`. Whether to use
    [transferable objects](http://updates.html5rocks.com/2011/12/Transferable-Objects-Lightning-Fast).
    with webworkers. Can be faster sometime, but you cannot use the source buffer afterward.
- __callback(err, output)__ - function to call after resize complete:
  - __err__ - error if happened.
  - __output__ - Uint8Array with resized RGBA image data.

__(!)__ If WebWorker available, it's returned as function result (not via
  callback) to allow early termination.


### .resizeCanvas(options, callback)

Resize image from one canvas to another. Sizes are taken from canvas.

- __from__ - source canvas.
- __to__ - destination canvas.
- __options__ - quality (number) or object:
  - __quality__ - 0..3. Default = `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default = `false`.
  - __unsharpAmount__ - 0..500. Default = `0` (off). Usually between 50 to 100 is good.
  - __unsharpThreshold__ - 0..100. Default = `0`. Try 10 as starting point.
- __callback(err)__ - function to call after resize complete:
  - __err__ - error if happened

__(!)__ If WebWorker available, it's returned as function result (not via
  callback) to allow early termination.


### .WW - true/false

`true` if [webworkers are supported](http://caniuse.com/#feat=webworkers).  You can use it for capabilities detection.
Also, you can set it `false` for debuging, so pica will use direct function calls.


### What is quality

Pica has presets, to adjust speed/quality ratio. Simply use `quality` option param:

- 0 - Box filter, window 0.5px
- 1 - Hamming filter, window 1.0px
- 2 - Lanczos filter, window 2.0px
- 3 - Lanczos filter, window 3.0px


### Unsharp mask

Pica has built in unsharp mask, similar to photoshop, but limited with
radius 1.0. It's off by default. Set `unsharpAmount` and `unsharpThresold`
to activate filter.


Browsers support
----------------

We had no time to test all possible combinations, but in general:

- Top level API should work in all browsers, [supporing canvas](http://caniuse.com/#feat=canvas)
  and [typed arrays](http://caniuse.com/#feat=typedarrays).
- [Webworkers support](http://caniuse.com/#feat=webworkers) is not needed, but those will be used if available.
- If you plan to use only pure math core, then [typed arrays support](http://caniuse.com/#feat=typedarrays)
  will be enougth.

__Note.__ Though you can run this package on `node.js`, browsers are the main target platform.
On server side we recommend to use GraphicsMagick or ImageMagick for better speed.


References
----------

You can find these links useful:

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
