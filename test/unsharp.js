'use strict';

const pica   = require('../index.js')();
const assert = require('assert');

describe('Unsharp mask', function () {
  it('save random image untouched when amount, radius and threshold are equal to 0', function () {
    let width = 100,
        height = 100,
        size = width * height * 4,
        srcImage = new Uint8Array(size),
        image = new Uint8Array(size);

    for (let i = 0; i < size; i++) {
      image[i] = srcImage[i] = (Math.random() * 0xff + 0.5) | 0;
    }

    return pica.init()
      .then(() => {
        pica.__mathlib.unsharp_mask(image, width, height, 1e-4, 0, 0);

        for (let i = 0; i < size; i++) {
          assert.strictEqual(image[i], srcImage[i]);
        }
      });
  });

  it('save white color untouched', function () {
    let srcImage = [ 255, 255, 255, 255 ];
    let image = [ 255, 255, 255, 255 ];

    return pica.init()
      .then(() => {
        pica.__mathlib.unsharp_mask(image, 1, 1, 0, 0, 0);

        for (var i = 0; i < image.length; i++) {
          assert.strictEqual(image[i], srcImage[i]);
        }
      });
  });

  it('save black color untouched', function () {
    let srcImage = [ 0, 0, 0, 0 ];
    let image = [ 0, 0, 0, 0 ];

    return pica.init()
      .then(() => {
        pica.__mathlib.unsharp_mask(image, 1, 1, 0, 0, 0);

        for (var i = 0; i < image.length; i++) {
          assert.strictEqual(image[i], srcImage[i]);
        }
      });
  });

  it('save red color untouched', function () {
    let srcImage = [ 255, 0, 0, 0 ];
    let image = [ 255, 0, 0, 0 ];

    return pica.init()
      .then(() => {
        pica.__mathlib.unsharp_mask(image, 1, 1, 0, 0, 0);

        for (var i = 0; i < image.length; i++) {
          assert.strictEqual(image[i], srcImage[i]);
        }
      });
  });
});
