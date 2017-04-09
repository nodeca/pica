pica - high quality image resize in browser
===========================================

[![Build Status](https://travis-ci.org/nodeca/pica.svg?branch=master)](https://travis-ci.org/nodeca/pica)
[![NPM version](https://img.shields.io/npm/v/pica.svg)](https://www.npmjs.org/package/pica)

`pica` is one more experiment with high speed javascript, from authors of
[paco](https://github.com/nodeca/pako). It does high quality image resize
in browser as fast as possible.

[__demo__](http://nodeca.github.io/pica/demo/)

When you resize images using modern browsers' `canvas` low quality
interpolation algorythms are used by default. That's why we wrote `pica`.

- It's not as fast as canvas, but still reasonably fast. With Lanczos filter
  and `window=3` big image resize (5000x3000px) inpure JS takes ~0.5s on
  desktop and ~2s on mobile.
- In modern browsers pica automatically uses
  [Webworkers](http://caniuse.com/#feat=webworkers), to avoid interface freeze
  and use multiple CPU cores in parallel.
- Pica selects the best resize method of available:
  - `createImageBitmap()`
  - WebAssembly
  - pure JavaScript

Why it's useful:

- reduces upload size for large images to pre-process in browser, saving time
  and bandwidth
- saves server resources on image processing
- [HiDPI image technique](http://www.html5rocks.com/en/mobile/high-dpi/#toc-tech-overview) for responsive and retina
- use single image for both thumbnail and detailed view


Prior to use
------------

Pica is a low level library that does math with minimal wrappers. If you need to
resize binary image, you should take care to load it into canvas first (and to
save it back to blob). Here is a short list of problems you can face:

- Loading image:
  - Due to JS security restrictions, you can load to canvas only images from same
    domain or local files. If you load images from remote domain use proper
    `Access-Control-Allow-Origin` header.
  - iOS has resource limits for canvas size & image size.
    Look [here](https://github.com/stomita/ios-imagefile-megapixel) for details
    and possible solutions.
  - If you plan to show images on screen after load, you must parse `exif` header
    to get proper orientation. Images can be rotated.
- Saving image:
  - Some ancient browsers do not support `.toBlob()` method, use
    https://github.com/blueimp/JavaScript-Canvas-to-Blob if needed.
  - It's a good idea to keep `exif` data, to avoid palette & rotation info
    loss. The most simple way is to cut original header and glue it to resized
    result. Look [here](https://github.com/nodeca/nodeca.users/blob/master/client/users/uploader/uploader.js)
    for examples.
- Quality
  - JS canvas does not support access to info about gamma correction. Bitmaps
    have 8 bits per channel. That causes some quality loss, because with gamma
    correction precision could be 12 bits per channel.
  - Precision loss will not be noticeable for ordinary images like kittens,
    selfies and so on. But we don't recommend this library for resizing professional quality images.


Install
-------

node.js (to develop, build via browserify and so on):

bower:

```bash
bower install pica
```

```bash
npm install pica
```

__Attention!__. Compiled files are in `/dist` folder! If you wish to load module
in node.js style as `require('pica')` - your project MUST be compiled
with `Broserify` to properly use Web Workers. In other case - use
`require('pica/dist/pica')`.



API
---

### new Pica(config)

Create resizer instance with given config

```js
const pica = require('pica')({
  tile:     768,        // Tile size.

  features: [ 'all' ],  // Mostly for testing, restricts
                        // available features. Can be:
                        // 'js', 'wasm', 'cib', 'ww' or 'all'

  idle: 2000,           // Cache timeout, ms. Webworkers create
                        // is not fast. This option allow reuse
                        // webworkers effectively.

  concurrency: 4        // Max webworkers pool size. Default is
                        // autodetected CPU count, but not more than 4.
});


// Resize from Camvas/Image to another Canvas
pica.resize(from, to)
  .then(result => console.log('resize done!'));


// Resize & convert to blob
pica.resize(from, to)
  .then(result => pica.toBlob(result, 'image/jpeg', 90))
  .then(blob => console.log('resized to canvas & created blob!'));
```

### .resize(from, to, options) -> Promise

Resize image from one canvas (or image) to another. Sizes are taken from
source and destination objects.

- __from__ - source canvas or image.
- __to__ - destination canvas.
- __options__ - quality (number) or object:
  - __quality__ - 0..3. Default = `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default = `false`.
  - __unsharpAmount__ - >=0, in percents. Default = `0` (off). Usually
    between 50 to 100 is good.
  - __unsharpRadius__ - 0.5..2.0. Radius of Gaussian blur.
    If it is less than 0.5, Unsharp Mask is off. Big values are clamped to 2.0.
  - __unsharpThreshold__ - 0..255. Default = `0`. Threshold for applying
    unsharp mask.
  - __cancelToken__ - Promise instance. If defined, current operation will be
    termitated on rejection.

__(!)__ If you need to process multiple images, do it sequentially to optimize
CPU & memory use. Pica already knows how to use multiple cores (if browser
allows).

Result is Promise, resolved with `to` param on success.


### .toBlob(canvas, mimeType [, quality]) -> Promise

Convenience method, similar to `canvas.toBlob()`, but with promise
interface & polyfill for old browsers.


### .resizeBuffer(options) -> Promise

Supplementary method, not recommended for direct use. Resize Uint8Array with
raw RGBA bitmap (don't confuse with jpeg / png  / ... binaries). It does not
use tiles & webworkers. Left for special cases when you really need to process
raw binary data (for example, if you decode jpeg files "manually").

- __options:__
  - __src__ - Uint8Array with source data.
  - __width__ - src image width.
  - __height__ - src image height.
  - __toWidth__ - output width.
  - __toHeigh__ - output height.
  - __quality__ - 0..3. Default = `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default = `false`.
  - __unsharpAmount__ - >=0, in percents. Default = `0` (off). Usually
    between 50 to 100 is good.
  - __unsharpRadius__ - 0.5..2.0. Radius of Gaussian blur.
    If it is less than 0.5, Unsharp Mask is off. Big values are clamped to 2.0.
  - __unsharpThreshold__ - 0..255. Default = `0`. Threshold for applying
    unsharp mask.
  - __dest__ - Optional. Output buffer to write data (callback will return
    result buffer anyway).

Result it Promise, resolved with resized rgba buffer.


### What is quality

Pica has presets, to adjust speed/quality ratio. Simply use `quality` option
param:

- 0 - Box filter, window 0.5px
- 1 - Hamming filter, window 1.0px
- 2 - Lanczos filter, window 2.0px
- 3 - Lanczos filter, window 3.0px

In real world you will never need to change default (max) quality. All this
variations were implemented to better understand resize math :)


### Unsharp mask

Pica has built-in unsharp mask. Set `unsharpAmount` to positive number to
activate the filter.

The parameters of it are similar to ones from Photoshop. We recommend to start
with `unsharpAmount = 80`, `unsharpRadius = 0.6`, `unsharpThreshold = 2`.
There is [a correspondence between UnsharpMask parameters in popular graphics
software](https://github.com/nodeca/pica/wiki#editing-unsharp-mask-params-relations-in-pupular-softare).


Browser support
----------------

We didn't have time to test all possible combinations, but in general:

- Top level API should work in all browsers,
  supporting [canvas](http://caniuse.com/#feat=canvas)
  and [typed arrays](http://caniuse.com/#feat=typedarrays).
- [Webworkers](http://caniuse.com/#feat=webworkers) support is not required,
  but they will be used if available.
- If you plan to use only pure math core,
  then [typed arrays support](http://caniuse.com/#feat=typedarrays) will be enougth.

__Note.__ Though you can run this package on `node.js`, browsers are the main
target platform. On server side we recommend to use
[sharp](https://github.com/lovell/sharp).


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

- Vitaly Puzrin [@puzrin](https://github.com/puzrin)
- Alexander Rodin [@a-rodin](https://github.com/a-rodin)
- Loïc Faure-Lacroix [@llacroix](https://github.com/llacroix)


Licence
-------

[MIT](https://github.com/nodeca/pica/blob/master/LICENSE)
