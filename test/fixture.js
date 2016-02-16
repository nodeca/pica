'use strict';
/* global it, describe */

var Canvas  = require('canvas');
var Image   = Canvas.Image;
var fs      = require('fs');
var path    = require('path');
var pica    = require('../');
var resemble = require('node-resemble');

var FIXTURES_DIRECTORY = path.join(__dirname, 'fixtures');
var OUTPUT_DIRECTORY = path.join(__dirname, '..');

function saveDataUrlToFile(dataUrl, fileName) {
  var image, canvas;

  image = new Image();
  image.src = dataUrl;
  canvas = new Canvas();
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);

  canvas
    .pngStream()
    .pipe(fs.createWriteStream(path.join(OUTPUT_DIRECTORY, fileName)));
}

describe('Fixtures', function () {
  it('algorithm should be correct for the given fixture', function (done) {
    var srcImage, srcCanvas, srcCtx,
        fixtureImage, fixtureCanvas, fixtureCtx,
        destCanvas;

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

    destCanvas = new Canvas();
    destCanvas.width = fixtureImage.width;
    destCanvas.height = fixtureImage.height;

    pica.WEBGL = false;
    pica.WW = false;

    pica.resizeCanvas(srcCanvas, destCanvas, {
      quality: 3,
      unsharpAmount: 0
    }, function (err) {
      if (err) {
        throw err;
      }

      resemble(destCanvas.toDataURL())
        .compareTo(fixtureCanvas.toDataURL())
        .onComplete(function (data) {
          if (data.misMatchPercentage !== '0.00') {
            saveDataUrlToFile(data.getImageDataUrl(), 'fixture-test-diff.png');
            destCanvas
              .pngStream()
              .pipe(fs.createWriteStream(path.join(OUTPUT_DIRECTORY, 'fixture-test-output.png')));
            fixtureCanvas
              .pngStream()
              .pipe(fs.createWriteStream(path.join(OUTPUT_DIRECTORY, 'fixture-test-expected.png')));
            done(new Error('Images mismatch in ' + data.misMatchPercentage + '% of pixels'));
          } else {
            done();
          }
        });
    });
  });
});
