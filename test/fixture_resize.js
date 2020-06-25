// Algorythm should not change. Use fixtures to check.
//
'use strict';

const fs         = require('fs');
const path       = require('path');
const pica       = require('../index.js');
const pixelmatch = require('pixelmatch');

const ppm        = require('./ppm');

const FIXTURES_DIRECTORY = path.join(__dirname, 'fixtures');
const OUTPUT_DIRECTORY   = path.join(__dirname, '..');


describe('Fixture resize', function () {

  it('.resizeCanvas() should be correct for the given fixture', function () {
    const { createCanvas, Image } = require('canvas');
    //
    // Shim browser method
    //
    global.document = global.document || {};
    global.document.createElement = global.document.createElement || function (name) {
      if (name === 'canvas') return createCanvas();
      throw new Error('createElement(' + name + ') not shimmed');
    };


    this.timeout(3000);

    let srcImage = new Image();

    srcImage.src = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.jpg'));

    let srcCanvas = createCanvas();

    srcCanvas.width = srcImage.width;
    srcCanvas.height = srcImage.height;

    let srcCtx = srcCanvas.getContext('2d');

    srcCtx.drawImage(srcImage, 0, 0);

    let fixtureImage = new Image();

    fixtureImage.src = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.png'));

    let fixtureCanvas = createCanvas();

    fixtureCanvas.width = fixtureImage.width;
    fixtureCanvas.height = fixtureImage.height;

    let fixtureCtx = fixtureCanvas.getContext('2d');

    fixtureCtx.drawImage(fixtureImage, 0, 0);

    let fixtureImageData = fixtureCtx.getImageData(0, 0, fixtureCanvas.width, fixtureCanvas.height);
    let destCanvas = createCanvas();

    destCanvas.width = fixtureImage.width;
    destCanvas.height = fixtureImage.height;

    let destCtx = destCanvas.getContext('2d');
    let diffCanvas = createCanvas();

    diffCanvas.width = fixtureImage.width;
    diffCanvas.height = fixtureImage.height;

    let diffCtx = diffCanvas.getContext('2d');
    let diffImageData = diffCtx.createImageData(diffCanvas.width, diffCanvas.height);

    return pica({ features: [ 'js' ] })
      .resize(srcCanvas, destCanvas, { quality: 3, unsharpAmount: 0 })
      .then(() => {
        let destImageData = destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height);

        let numDiffPixels = pixelmatch(
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

          throw new Error(`Images mismatch in ${numDiffPixels} pixels`);
        }
      });
  });


  it('.resizeBuffer() should be correct for the given fixture', function () {
    let src     = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.ppm')));
    let fixture = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.ppm')));

    let dest = new Uint8Array(fixture.buffer.length);
    let diff = new Uint8Array(fixture.buffer.length);

    return pica({ features: [ 'js' ] })
      .resizeBuffer({
        src:      src.buffer,
        width:    src.width,
        height:   src.height,
        dest:     dest,
        toWidth:  fixture.width,
        toHeight: fixture.height
      })
      .then(() => {
        let numDiffPixels = pixelmatch(
          dest,
          fixture.buffer,
          diff,
          fixture.width,
          fixture.height,
          { threshold: 0, includeAA: true }
        );

        if (numDiffPixels > 0) {
          fs.writeFileSync(
            path.join(OUTPUT_DIRECTORY, 'fixture-test-diff.ppm'),
            Buffer.from(ppm.encode(diff, fixture.width, fixture.height))
          );
          fs.writeFileSync(
            path.join(OUTPUT_DIRECTORY, 'fixture-test-output.ppm'),
            Buffer.from(ppm.encode(dest, fixture.width, fixture.height))
          );
          fs.writeFileSync(
            path.join(OUTPUT_DIRECTORY, 'fixture-test-expected.ppm'),
            Buffer.from(ppm.encode(fixture.buffer, fixture.width, fixture.height))
          );
          throw new Error(`Images mismatch in ${numDiffPixels} pixels`);
        }
      });
  });

});
