5.0.0 / 2018-11-02
------------------

- Maintenance, babelify upgrade: switch to @babel/core and @babel/preset-env.


4.2.0 / 2018-10-25
------------------

- Added bounds check for invalid output canvas size (#155).
- Maintenance: dev deps bump.


4.1.1 / 2018-03-31
------------------

- Should return result via promise (regression), fix #139.


4.1.0 / 2018-03-27
------------------

- Resize in multiple steps for big scales, fix #135.


4.0.2 / 2018-03-05
------------------

- Multimath bump, should fix issue with broken WebAssembly engine in IOS 11.2.x
  Webkit (Safary/Chrome).


4.0.1 / 2017-10-13
------------------

- Attempt to fix failure when WebAssembly disabled via CSP.


4.0.0 / 2017-09-30
------------------

- Internals rewritten to use `multimath` library.
- WebAssembly implementation for `unsharp mask`, as bonus.


3.0.6 / 2017-07-13
------------------

- More constrains for `createImageBitmap()` use. Filter out browsers
  without `ImageBitmap.prototype.close()` method (Chrome 51 etc).


3.0.5 / 2017-06-30
------------------

- Avoid Promise use in webworker. Should help with IE11, which suddently
  fixed creating of webworkers from data URI.


3.0.4 / 2017-04-20
------------------

- IE fix.


3.0.3 / 2017-04-18
------------------

- Fixed non working `.createImageBitmap()` resize, but disabled
  by default due bad quality.
- Added debug messages.


3.0.2 / 2017-04-16
------------------

- Fix wasm crash on upscale, #87.


3.0.1 / 2017-04-14
------------------

- Add missed `.set()` fallback for ancient browsers.


3.0.0 / 2017-04-11
------------------

- Major rewrite. New API, promise-based.
- Drop WebGL resizer.
- Add async image decode via createImageBitmap().
- Add WebAssembly resizer.
- Add createImageBitmap() resizer.
- Add .toBlob() method.


2.0.8 / 2016-10-01
------------------

- Set default number of CPUs (workers) to 1 if `navigator.hardwareConcurrency`
  not supported (ancient browsers).


2.0.7 / 2016-10-01
------------------

- Fix Safary bug (grid could appear on downscaled image).
- WEBGL shaders rework (still buggy, not for production).


2.0.6 / 2016-08-04
------------------

- Fix tiler math: bad rounding could produce tiles out of src area, #61.


2.0.5 / 2016-07-19
------------------

- Fix mem leak: release objectURL, used to create Web Workers.


2.0.4 / 2016-06-24
------------------

- Deps bump (`webworkify`). Previous version had problems with IE Edge, #56.


2.0.3 / 2016-06-07
------------------

- Deps bump. Use fresh `webworkify` with proper ObjectURL release, #55.


2.0.2 / 2016-03-30
------------------

- Optimised previous fix.


2.0.1 / 2016-03-30
------------------

- Fixed garbage on image edge tiles when alpha exists.


2.0.0 / 2016-03-12
------------------

- Support `Image()` as input src.
- Architecture rework: images are now splitted to tiles to restrict memory use
  and allow parallel processing.
- Built-in WebWorkers manager to use all available CPU cores.
- Feature flags (WW, WEBGL) are forced to `false` after resize call,
  if feature not supported or disabled due fatal error.
- `unsharpRadius` range restricted to 0.5..2.0.
- Experimental code for WebGL support (noisy & buggy, disabled by default).
- `.resizeBuffer()` is no longer recommended for use. It does not use webworkers
  anymore (and option `transferable` is not used too).


1.1.1 / 2015-11-10
------------------

- Bumped `glur` version to fix bug in unsharp mask with vertical images.


1.1.0 / 2015-11-09
------------------

- Unsharp mask now useable.


1.0.8 / 2015-10-28
------------------

- Fixed brightness loss due missed value rounding in convolvers.


1.0.7 / 2014-11-18
------------------

- Fixed alpha reset for images without alpha channel (regression in 1.0.5).


1.0.6 / 2014-11-08
------------------

- Removed alpha correction, because canvas data is not premultipled (#13).
  Thanks to @devongovett.


1.0.5 / 2014-11-03
------------------

- Expose WebWorker on pica call, to allow early termination of task.
- Minor speed opts.


1.0.4 / 2014-10-04
------------------

- Added transferable objects support.
- Fixed demo to fork over ssl too.


1.0.3 / 2014-09-29
------------------

- ~25% speed boost (thanks to @mraleph for advice).
- Added unsharp mask implementation (very naive). Need futher work.


1.0.2 / 2014-09-27
------------------

- Improved capabilities detection.
- `.WW` now shows if pica can use Web Workers or not.


1.0.1 / 2014-09-25
------------------

- Added IE workarounds. Thanks to @noomorph.
- Enchanced API to allow pass destination buffer by reference.


1.0.0 / 2014-09-24
------------------

- First release.
