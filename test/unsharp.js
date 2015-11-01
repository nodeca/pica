'use strict';
/* globals describe, it */

var unsharp = require('../lib/pure/unsharp');
var assert = require('assert');

describe('Unsharp mask', function () {
  it('save random image untouched when amount, radius and threshold are equal to 0', function () {
    var width = 100;
    var height = 100;
    var size = width * height * 4;
    var srcImage = new Uint8Array(size);
    var image = new Uint8Array(size);
    var i;
    for (i = 0; i < size; i++) {
      image[i] = srcImage[i] = (Math.random() * 0xff + 0.5) | 0;
    }
    unsharp(image, width, height, 1e-4, 0, 0);
    for (i = 0; i < size; i++) {
      assert.strictEqual(image[i], srcImage[i]);
    }
  });

  it('save white color untouched', function () {
    var srcImage = [ 255, 255, 255, 255 ];
    var image = [ 255, 255, 255, 255 ];
    unsharp(image, 1, 1, 0, 0, 0);
    for (var i = 0; i < image.length; i++) {
      assert.strictEqual(image[i], srcImage[i]);
    }
  });

  it('save black color untouched', function () {
    var srcImage = [ 0, 0, 0, 0 ];
    var image = [ 0, 0, 0, 0 ];
    unsharp(image, 1, 1, 0, 0, 0);
    for (var i = 0; i < image.length; i++) {
      assert.strictEqual(image[i], srcImage[i]);
    }
  });

  it('save red color untouched', function () {
    var srcImage = [ 255, 0, 0, 0 ];
    var image = [ 255, 0, 0, 0 ];
    unsharp(image, 1, 1, 0, 0, 0);
    for (var i = 0; i < image.length; i++) {
      assert.strictEqual(image[i], srcImage[i]);
    }
  });
});
