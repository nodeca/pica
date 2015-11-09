pica - high quality image resize in browser
===========================================

[![Build Status](https://travis-ci.org/nodeca/pica.svg?branch=master)](https://travis-ci.org/nodeca/pica)
[![NPM version](https://img.shields.io/npm/v/pica.svg)](https://www.npmjs.org/package/pica)

`pica` is one more experiment with high speed javascript, from authors of
[paco](https://github.com/nodeca/pako). It does high quality image resize
in browser as fast as possible.

[__demo__](http://nodeca.github.io/pica/demo/)

When you resize images using modern browsers' `canvas`
low quality interpolation algorythms are used by default. That's why we wrote `pica`.

- It's not as fast as canvas, but still reasonably fast. With Lanczos filter and
  `window=3` huge image resize (5000x3000px) takes ~1s on desktop and ~3s on
  mobile.
- If your browser supports [Webworkers](http://caniuse.com/#feat=webworkers), `pica` automatically uses it to avoid
  interface freeze.

Why it's useful:

- reduces upload size for large images to pre-process in browser, saving time and bandwidth
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
    Look [here](https://github.com/stomita/ios-imagefile-megapixel) for details and possible
    solutions.
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

```bash
npm install pica
```

bower:

```bash
bower install pica
```


API
---

### .resizeCanvas(from, to, options, callback)

Resize image from one canvas to another. Sizes are taken from canvas.

- __from__ - source canvas.
- __to__ - destination canvas.
- __options__ - quality (number) or object:
  - __quality__ - 0..3. Default = `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default = `false`.
  - __unsharpAmount__ - >=0, in percents. Default = `0` (off). Usually between 50 to 100 is good.
  - __unsharpRadius__ - >=0.5. Radius of Gaussian blur. If it is less than 0.5, Unsharp Mask is off.
  - __unsharpThreshold__ - 0..255. Default = `0`. Threshold for applying unsharp mask.
- __callback(err)__ - function to call after resize complete:
  - __err__ - error if happened

__(!)__ If WebWorker available, it's returned as function result (not via
  callback) to allow early termination.


### .resizeBuffer(options, callback)

Async resize Uint8Array with raw RGBA bitmap (don't confuse with jpeg / png  / ...
binaries).

- __options:__
  - __src__ - Uint8Array with source data.
  - __width__ - src image width.
  - __height__ - src image height.
  - __toWidth__ - output width.
  - __toHeigh__ - output height.
  - __quality__ - 0..3. Default = `3` (lanczos, win=3).
  - __alpha__ - use alpha channel. Default = `false`.
  - __unsharpAmount__ - >=0, in percents. Default = `0` (off). Usually between 50 to 100 is good.
  - __usnharpRadius__ - >=0.5. Radius of Gaussian blur. If it is less than 0.5, Unsharp Mask is off.
  - __unsharpThreshold__ - 0..255. Default = `0`. Threshold for applying unsharp mask.
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


### .WW - true/false

`true` if webworkers are [supported](http://caniuse.com/#feat=webworkers).  You can use it for 
browser capabilities detection.
Also, you can set it to `false` for debuging, so `pica` will use direct function calls.


### What is quality

Pica has presets, to adjust speed/quality ratio. Simply use `quality` option param:

- 0 - Box filter, window 0.5px
- 1 - Hamming filter, window 1.0px
- 2 - Lanczos filter, window 2.0px
- 3 - Lanczos filter, window 3.0px


### Unsharp mask

Pica has built-in unsharp mask. Set `unsharpAmount` to positive number to activate the filter.

The parameters of it are similar to ones from Photoshop. We recommend to start from
`unsharpAmount = 80`, `unsharpRadius = 0.6`, `unsharpThreshop = 2`.
There is [a correspondence between UnsharpMask parameters in popular graphics
software](https://github.com/nodeca/pica/wiki#editing-unsharp-mask-params-relations-in-pupular-softare).

Browser support
----------------

We didn't have time to test all possible combinations, but in general:

- Top level API should work in all browsers, supporting [canvas](http://caniuse.com/#feat=canvas)
  and [typed arrays](http://caniuse.com/#feat=typedarrays).
- [Webworkers](http://caniuse.com/#feat=webworkers) support is not required, but they will be used if available.
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

- Vitaly Puzrin [@puzrin](https://github.com/puzrin)
- Alexander Rodin [@a-rodin](https://github.com/a-rodin)
- Loïc Faure-Lacroix [@llacroix](https://github.com/llacroix)


Licence
-------

[MIT](https://github.com/nodeca/pica/blob/master/LICENSE)
