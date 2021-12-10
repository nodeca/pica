#!/usr/bin/env node

/* eslint-disable no-console */

'use strict';


const Benchmark   = require('benchmark');
const filter_gen  = require('../lib/mm_resize/resize_filter_gen');
const resize_raw  = require('../lib/mm_resize/resize');

const pica_js     = require('../index.js')({ features: [ 'js' ] });
const pica_wasm   = require('../index.js')({ features: [ 'wasm' ] });

const SRC_WIDTH = 1024;
const SRC_HEIGHT = 1024;
const SCALE = 0.15;
const DST_WIDTH = (SRC_WIDTH * SCALE)|0;
const DST_HEIGHT = (SRC_HEIGHT * SCALE)|0;


const sample = new Uint8Array(SRC_WIDTH * SRC_HEIGHT * 4);
sample.fill(255);

const sampleWithAlpha = new Uint8Array(SRC_WIDTH * SRC_HEIGHT * 4);
sampleWithAlpha.fill(127);

const RESIZE_DEFAULTS = {
  width:    SRC_WIDTH,
  height:   SRC_HEIGHT,
  toWidth:  DST_WIDTH,
  toHeight: DST_HEIGHT,
  filter:   'lanczos3'
};

/* eslint-disable new-cap */
Benchmark.Suite()

.add(`[js] resize (${SRC_WIDTH}x${SRC_HEIGHT} => ${DST_WIDTH}x${DST_HEIGHT})`, {
  defer: true,
  fn: function (defer) {
    pica_js.resizeBuffer({ src: sample, ...RESIZE_DEFAULTS })
    .then(() => defer.resolve());
  }
})

.add(`[js] resize & premultiply (${SRC_WIDTH}x${SRC_HEIGHT} => ${DST_WIDTH}x${DST_HEIGHT})`, {
  defer: true,
  fn: function (defer) {
    pica_js.resizeBuffer({ src: sampleWithAlpha, ...RESIZE_DEFAULTS })
    .then(() => defer.resolve());
  }
})

.add(`[wasm] resize (${SRC_WIDTH}x${SRC_HEIGHT} => ${DST_WIDTH}x${DST_HEIGHT})`, {
  defer: true,
  fn: function (defer) {
    pica_wasm.resizeBuffer({ src: sample, ...RESIZE_DEFAULTS })
    .then(() => defer.resolve());
  }
})

.add(`[wasm] resize & premultiply (${SRC_WIDTH}x${SRC_HEIGHT} => ${DST_WIDTH}x${DST_HEIGHT})`, {
  defer: true,
  fn: function (defer) {
    pica_wasm.resizeBuffer({ src: sampleWithAlpha, ...RESIZE_DEFAULTS })
    .then(() => defer.resolve());
  }
})

.add(`mm js resize (${SRC_WIDTH}x${SRC_HEIGHT} => ${DST_WIDTH}x${DST_HEIGHT})`, {
  fn: function () {
    resize_raw({ src: sample, ...RESIZE_DEFAULTS });
  }
})

.add(`mm js resize & premultiply (${SRC_WIDTH}x${SRC_HEIGHT} => ${DST_WIDTH}x${DST_HEIGHT})`, {
  fn: function () {
    resize_raw({ src: sampleWithAlpha, ...RESIZE_DEFAULTS });
  }
})

.add(`[js] unsharp (${SRC_WIDTH}x${SRC_HEIGHT})`, {
  fn: function () {
    pica_js.__mathlib.unsharp_mask(sample, SRC_WIDTH, SRC_HEIGHT, 80, 0.5, 4);
  }
})

.add(`[wasm] unsharp (${SRC_WIDTH}x${SRC_HEIGHT})`, {
  fn: function () {
    pica_wasm.__mathlib.unsharp_mask(sample, SRC_WIDTH, SRC_HEIGHT, 80, 0.5, 4);
  }
})

.add(`Build filters for (${SRC_WIDTH}x${SRC_HEIGHT})`, {
  fn: function () {
    filter_gen('lanczos3', SRC_WIDTH, DST_WIDTH, SCALE, 0.0);
    filter_gen('lanczos3', SRC_HEIGHT, DST_HEIGHT, SCALE, 0.0);
  }
})

.on('cycle', event => {
  console.log(`> ${event.target}`);
})

.run();
