#!/usr/bin/env node

/* eslint-disable no-console */

'use strict';


const Benchmark   = require('benchmark');
const pica        = require('../')();
const lightness16 = require('../lib/mathlib/lightness16_js');
const filter_gen  = require('../lib/mathlib/resize_filter_gen');
const resize_raw  = require('../lib/mathlib/resize_js');
const glurMono16  = require('glur/mono16');


const sample = {
  width:  3200,
  height: 2500
};
sample.buffer    = new Uint8Array(sample.width * sample.height * 4);
sample.lightness = lightness16(sample.buffer, sample.width, sample.height);


/* eslint-disable new-cap */
Benchmark.Suite()

.add(`Resize of ${sample.width}x${sample.height}`, {
  defer: true,
  fn: function (defer) {
    pica.resizeBuffer({
      src:      sample.buffer,
      width:    sample.width,
      height:   sample.height,
      toWidth:  (sample.width * 0.15)|0,
      toHeight: (sample.height * 0.15)|0,
      quality:  3
    })
    .then(() => defer.resolve());
  }
})

.add(`Resize RAW of ${sample.width}x${sample.height}`, {
  fn: function () {
    resize_raw({
      src:      sample.buffer,
      width:    sample.width,
      height:   sample.height,
      toWidth:  (sample.width * 0.15)|0,
      toHeight: (sample.height * 0.15)|0
    });
  }
})

.add(`Unsharp of ${sample.width}x${sample.height}`, {
  fn: function () {
    pica.__mathlib.unsharp(
      sample.buffer, sample.width, sample.height,
      80, 0.5, 4
    );
  }
})

.add(`Lightness of ${sample.width}x${sample.height}`, {
  fn: function () {
    lightness16(sample.buffer, sample.width, sample.height);
  }
})

.add(`Gaus16 lightness blur of ${sample.width}x${sample.height}`, {
  fn: function () {
    glurMono16(
      sample.lightness,
      sample.width,
      sample.height,
      0.5
    );
  }
})

.add(`Build filters for ${sample.width}x${sample.height}`, {
  fn: function () {
    filter_gen(
      3,
      sample.width,
      (sample.width * 0.15)|0,
      sample.width / ((sample.width * 0.15)|0),
      0.0
    );
    filter_gen(
      3,
      sample.height,
      (sample.height * 0.15)|0,
      sample.height / ((sample.height * 0.15)|0),
      0.0
    );
  }
})

.on('cycle', event => {
  console.log(`> ${event.target}`);
})

.run();
