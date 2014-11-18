1.0.7 / 2014.11.18
------------------

- Fixed alpha reset for images without alpha channel (regression in 1.0.5).


1.0.6 / 2014.11.08
------------------

- Removed alpha correction, because canvas data is not premultipled (#13).
  Thanks to @devongovett.


1.0.5 / 2014.11.03
------------------

- Expose WebWorker on pica call, to allow early termination of task.
- Minor speed opts.


1.0.4 / 2014.10.04
------------------

- Added transferable objects support.
- Fixed demo to fork over ssl too.


1.0.3 / 2014.09.29
------------------

- ~25% speed boost (thanks to @mraleph for advice).
- Added unsharp mask implementation (very naive). Need futher work.


1.0.2 / 2014.09.27
------------------

- Improved capabilities detection.
- `.WW` now shows if pica can use Web Workers or not.


1.0.1 / 2014.09.25
------------------

- Added IE workarounds. Thanks to @noomorph.
- Enchanced API to allow pass destination buffer by reference.


1.0.0 / 2014.09.24
------------------

- First release.
