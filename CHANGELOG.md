# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [6.1.1] - 2020-08-20
### Fixed
- Aded Safari canvas GC workaround, #199.


## [6.1.0] - 2020-07-10
### Added
- Aded OffscreenCanvas support, #195.


## [6.0.0] - 2020-06-25
### Changed
- Use `dist/pica.js` as main entry. No more workarounds needed for webpack.
- Avoid babelify dependency in dependent packages if browserify used.
- Rewrite build scripts.

### Added
- Added `ImageBitmap` input support.


## [5.3.0] - 2020-06-09
### Changed
- Use `derequire` to allow nested `browserify` for `/dist/pica.js`. 


## [5.2.0] - 2020-05-25
### Added
- Aded OffscreenCanvas support, #195.


## [5.1.1] - 2020-05-18
### Fixed
- Suppress `createImageBitmap` errors to use fallback, #190.


## [5.1.0] - 2019-07-15
### Changed
- Bump multimath dependency.

### Fixed
- Avoid possible CSP warnings, caused by WASM check, when feature not requested
  in options.


## [5.0.1] - 2019-07-12
### Fixed
- Fix unsharp crash when CIB enabled (from 4.0.0), #160.

### Changed
- Dev deps bump.


## [5.0.0] - 2018-11-02
### Changed
- Maintenance, babelify upgrade: switch to @babel/core and @babel/preset-env.


## [4.2.0] - 2018-10-25
### Fixed
- Added bounds check for invalid output canvas size (#155).

### Changed
- Maintenance: dev deps bump.


## [4.1.1] - 2018-03-31
### Changed
- Should return result via promise (regression), fix #139.


## [4.1.0] - 2018-03-27
### Changed
- Resize in multiple steps for big scales, fix #135.


## [4.0.2] - 2018-03-05
### Fixed
- Multimath bump, should fix issue with broken WebAssembly engine in IOS 11.2.x
  Webkit (Safary/Chrome).


## [4.0.1] - 2017-10-13
### Fixed
- Attempt to fix failure when WebAssembly disabled via CSP.


## [4.0.0] - 2017-09-30
### Changed
- Internals rewritten to use `multimath` library.
- WebAssembly implementation for `unsharp mask`, as bonus.


## [3.0.6] - 2017-07-13
### Fixed
- More constrains for `createImageBitmap()` use. Filter out browsers
  without `ImageBitmap.prototype.close()` method (Chrome 51 etc).


## [3.0.5] - 2017-06-30
### Fixed
- Avoid Promise use in webworker. Should help with IE11, which suddently
  fixed creating of webworkers from data URI.


## [3.0.4] - 2017-04-20
### Fixed
- IE fix.


## [3.0.3] - 2017-04-18
### Fixed
- Fixed non working `.createImageBitmap()` resize, but disabled
  by default due bad quality.

### Added
- Added debug messages.


## [3.0.2] - 2017-04-16
### Fixed
- Fix wasm crash on upscale, #87.


## [3.0.1] - 2017-04-14
### Fixed
- Add missed `.set()` fallback for ancient browsers.


## [3.0.0] - 2017-04-11
### Added
- Add WebAssembly resizer.
- Add createImageBitmap() resizer.
- Add .toBlob() method.

### Changed
- Major rewrite. New API, promise-based.
- Add async image decode via createImageBitmap().

### Removed
- Drop WebGL resizer.


## [2.0.8] - 2016-10-01
### Changed
- Set default number of CPUs (workers) to 1 if `navigator.hardwareConcurrency`
  not supported (ancient browsers).


## [2.0.7] - 2016-10-01
### Fixed
- Fix Safary bug (grid could appear on downscaled image).

### Changed
- WEBGL shaders rework (still buggy, not for production).


## [2.0.6] - 2016-08-04
### Fixed
- Fix tiler math: bad rounding could produce tiles out of src area, #61.


## [2.0.5] - 2016-07-19
### Fixed
- Fix mem leak: release objectURL, used to create Web Workers.


## [2.0.4] - 2016-06-24
### Changed
- Deps bump (`webworkify`). Previous version had problems with IE Edge, #56.


## [2.0.3] - 2016-06-07
### Changed
- Deps bump. Use fresh `webworkify` with proper ObjectURL release, #55.


## [2.0.2] - 2016-03-30
### Changed
- Optimised previous fix.


## [2.0.1] - 2016-03-30
### Fixed
- Fixed garbage on image edge tiles when alpha exists.


## [2.0.0] - 2016-03-12
### Added
- Support `Image()` as input src.

### Changed
- Architecture rework: images are now splitted to tiles to restrict memory use
  and allow parallel processing.
- Built-in WebWorkers manager to use all available CPU cores.
- Feature flags (WW, WEBGL) are forced to `false` after resize call,
  if feature not supported or disabled due fatal error.
- `unsharpRadius` range restricted to 0.5..2.0.
- Experimental code for WebGL support (noisy & buggy, disabled by default).
- `.resizeBuffer()` is no longer recommended for use. It does not use webworkers
  anymore (and option `transferable` is not used too).


## [1.1.1] - 2015-11-10
### Changed
- Bumped `glur` version to fix bug in unsharp mask with vertical images.


## [1.1.0] - 2015-11-09
### Changed
- Unsharp mask now useable.


## [1.0.8] - 2015-10-28
### Fixed
- Fixed brightness loss due missed value rounding in convolvers.


## [1.0.7] - 2014-11-18
### Fixed
- Fixed alpha reset for images without alpha channel (regression in 1.0.5).


## [1.0.6] - 2014-11-08
### Changed
- Removed alpha correction, because canvas data is not premultipled (#13).
  Thanks to @devongovett.


## [1.0.5] - 2014-11-03
### Changed
- Expose WebWorker on pica call, to allow early termination of task.
- Minor speed opts.


## [1.0.4] - 2014-10-04
### Added
- Added transferable objects support.

### Fixed
- Fixed demo to fork over ssl too.


## [1.0.3] - 2014-09-29
### Added
- Added unsharp mask implementation (very naive). Need futher work.

### Changed
- ~25% speed boost (thanks to @mraleph for advice).


## [1.0.2] - 2014-09-27
### Fixed
- Improved capabilities detection.
- `.WW` now shows if pica can use Web Workers or not.


## [1.0.1] - 2014-09-25
### Added
- Enchanced API to allow pass destination buffer by reference.

### Fixed
- Added IE workarounds. Thanks to @noomorph.


## [1.0.0] - 2014-09-24
### Changed
- First release.


[6.1.1]: https://github.com/nodeca/pica/compare/6.1.0...6.1.1
[6.1.0]: https://github.com/nodeca/pica/compare/6.0.0...6.1.0
[6.0.0]: https://github.com/nodeca/pica/compare/5.3.0...6.0.0
[5.3.0]: https://github.com/nodeca/pica/compare/5.2.0...5.3.0
[5.2.0]: https://github.com/nodeca/pica/compare/5.1.1...5.2.0
[5.1.1]: https://github.com/nodeca/pica/compare/5.1.0...5.1.1
[5.1.0]: https://github.com/nodeca/pica/compare/5.0.1...5.1.0
[5.0.1]: https://github.com/nodeca/pica/compare/5.0.0...5.0.1
[5.0.0]: https://github.com/nodeca/pica/compare/4.2.0...5.0.0
[4.2.0]: https://github.com/nodeca/pica/compare/4.1.1...4.2.0
[4.1.1]: https://github.com/nodeca/pica/compare/4.1.0...4.1.1
[4.1.0]: https://github.com/nodeca/pica/compare/4.0.2...4.1.0
[4.0.2]: https://github.com/nodeca/pica/compare/4.0.1...4.0.2
[4.0.1]: https://github.com/nodeca/pica/compare/4.0.0...4.0.1
[4.0.0]: https://github.com/nodeca/pica/compare/3.0.6...4.0.0
[3.0.6]: https://github.com/nodeca/pica/compare/3.0.5...3.0.6
[3.0.5]: https://github.com/nodeca/pica/compare/3.0.4...3.0.5
[3.0.4]: https://github.com/nodeca/pica/compare/3.0.3...3.0.4
[3.0.3]: https://github.com/nodeca/pica/compare/3.0.2...3.0.3
[3.0.2]: https://github.com/nodeca/pica/compare/3.0.1...3.0.2
[3.0.1]: https://github.com/nodeca/pica/compare/3.0.0...3.0.1
[3.0.0]: https://github.com/nodeca/pica/compare/2.0.8...3.0.0
[2.0.8]: https://github.com/nodeca/pica/compare/2.0.7...2.0.8
[2.0.7]: https://github.com/nodeca/pica/compare/2.0.6...2.0.7
[2.0.6]: https://github.com/nodeca/pica/compare/2.0.5...2.0.6
[2.0.5]: https://github.com/nodeca/pica/compare/2.0.4...2.0.5
[2.0.4]: https://github.com/nodeca/pica/compare/2.0.3...2.0.4
[2.0.3]: https://github.com/nodeca/pica/compare/2.0.2...2.0.3
[2.0.2]: https://github.com/nodeca/pica/compare/2.0.1...2.0.2
[2.0.1]: https://github.com/nodeca/pica/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/nodeca/pica/compare/1.1.1...2.0.0
[1.1.1]: https://github.com/nodeca/pica/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/nodeca/pica/compare/1.0.8...1.1.0
[1.0.8]: https://github.com/nodeca/pica/compare/1.0.7...1.0.8
[1.0.7]: https://github.com/nodeca/pica/compare/1.0.6...1.0.7
[1.0.6]: https://github.com/nodeca/pica/compare/1.0.5...1.0.6
[1.0.5]: https://github.com/nodeca/pica/compare/1.0.4...1.0.5
[1.0.4]: https://github.com/nodeca/pica/compare/1.0.3...1.0.4
[1.0.3]: https://github.com/nodeca/pica/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/nodeca/pica/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/nodeca/pica/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/nodeca/pica/releases/tag/1.0.0