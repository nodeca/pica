'use strict';
/* global it, describe */

var Canvas     = require('canvas');
var Image      = Canvas.Image;
var fs         = require('fs');
var path       = require('path');
var pica       = require('../');
var pixelmatch = require('pixelmatch');

var FIXTURES_DIRECTORY = path.join(__dirname, 'fixtures');
var OUTPUT_DIRECTORY = path.join(__dirname, '..');

describe('Fixtures', function () {
  it('algorithm should be correct for the given fixture', function (done) {
    var srcImage, srcCanvas, srcCtx,
        fixtureImage, fixtureCanvas, fixtureCtx, fixtureImageData,
        destCanvas, destCtx, destImageData,
        diffCanvas, diffCtx, diffImageData,
        numDiffPixels;

    this.timeout(3000);

    srcImage = new Image();
    srcImage.src = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.jpg'));

    srcCanvas = new Canvas();
    srcCanvas.width = srcImage.width;
    srcCanvas.height = srcImage.height;
    srcCtx = srcCanvas.getContext('2d');
    srcCtx.drawImage(srcImage, 0, 0);

    fixtureImage = new Image();
    fixtureImage.src = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.png'));
    fixtureCanvas = new Canvas();
    fixtureCanvas.width = fixtureImage.width;
    fixtureCanvas.height = fixtureImage.height;
    fixtureCtx = fixtureCanvas.getContext('2d');
    fixtureCtx.drawImage(fixtureImage, 0, 0);
    fixtureImageData = fixtureCtx.getImageData(0, 0, fixtureCanvas.width, fixtureCanvas.height);

    destCanvas = new Canvas();
    destCanvas.width = fixtureImage.width;
    destCanvas.height = fixtureImage.height;
    destCtx = destCanvas.getContext('2d');

    diffCanvas = new Canvas();
    diffCanvas.width = fixtureImage.width;
    diffCanvas.height = fixtureImage.height;
    diffCtx = diffCanvas.getContext('2d');
    diffImageData = diffCtx.createImageData(diffCanvas.width, diffCanvas.height);

    pica.WEBGL = false;
    pica.WW = false;

    pica.resizeCanvas(srcCanvas, destCanvas, {
      quality: 3,
      unsharpAmount: 0
    }, function (err) {
      if (err) {
        throw err;
      }

      destImageData = destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height);

      numDiffPixels = pixelmatch(
        destImageData.data,
        fixtureImageData.data,
        diffImageData.data,
        fixtureCanvas.width,
        fixtureCanvas.height,
        { threshold: 0, includeAA: true }
      );

      if (numDiffPixels > 0) {
        diffCtx.putImageData(diffImageData, 0, 0);
        diffCanvas
          .pngStream()
          .pipe(fs.createWriteStream(path.join(OUTPUT_DIRECTORY, 'fixture-test-diff.png')));
        destCanvas
          .pngStream()
          .pipe(fs.createWriteStream(path.join(OUTPUT_DIRECTORY, 'fixture-test-output.png')));
        fixtureCanvas
          .pngStream()
          .pipe(fs.createWriteStream(path.join(OUTPUT_DIRECTORY, 'fixture-test-expected.png')));
        done(new Error('Images mismatch in ' + numDiffPixels + ' pixels'));
      } else {
        done();
      }
    });
  });
});
