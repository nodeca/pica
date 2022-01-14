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


describe('Fixture resize', () => {

  it.skip('.resizeCanvas() should be correct for the given fixture', async () => {
    this.timeout(3000);

    let srcImage = new Image();
    let srcBuf = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.jpg'));

    srcImage.src = 'data:image/jpeg;base64,' + srcBuf.toString('base64');
    await new Promise(resolve => { srcImage.onload = resolve; });

    let srcCanvas = document.createElement('canvas');

    srcCanvas.width = srcImage.width;
    srcCanvas.height = srcImage.height;

    let srcCtx = srcCanvas.getContext('2d');

    srcCtx.drawImage(srcImage, 0, 0);

    let fixtureImage = new Image();
    let fixtureBuf = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.png'));

    fixtureImage.src = 'data:image/png;base64,' + fixtureBuf.toString('base64');
    await new Promise(resolve => { fixtureImage.onload = resolve; });

    let fixtureCanvas = document.createElement('canvas');

    fixtureCanvas.width = fixtureImage.width;
    fixtureCanvas.height = fixtureImage.height;

    let fixtureCtx = fixtureCanvas.getContext('2d');

    fixtureCtx.drawImage(fixtureImage, 0, 0);

    let fixtureImageData = fixtureCtx.getImageData(0, 0, fixtureCanvas.width, fixtureCanvas.height);
    let destCanvas = document.createElement('canvas');

    destCanvas.width = fixtureImage.width;
    destCanvas.height = fixtureImage.height;

    let destCtx = destCanvas.getContext('2d');
    let diffCanvas = document.createElement('canvas');

    diffCanvas.width = fixtureImage.width;
    diffCanvas.height = fixtureImage.height;

    let diffCtx = diffCanvas.getContext('2d');
    let diffImageData = diffCtx.createImageData(diffCanvas.width, diffCanvas.height);

    await pica({ features: [ 'js' ] })
      .resize(srcCanvas, destCanvas, { filter: 'lanczos3', unsharpAmount: 0 });

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

      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-diff.png'),
        Buffer.from(await pica().toBlob(diffCanvas).then(b => b.arrayBuffer()))
      );

      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-output.png'),
        Buffer.from(await pica().toBlob(destCanvas).then(b => b.arrayBuffer()))
      );

      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-expected.png'),
        Buffer.from(await pica().toBlob(fixtureCanvas).then(b => b.arrayBuffer()))
      );

      throw new Error(`Images mismatch in ${numDiffPixels} pixels`);
    }
  });


  it('.resizeBuffer() should be correct for the given fixture', async () => {
    let src     = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.ppm')));
    let fixture = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.ppm')));

    let dest = new Uint8Array(fixture.buffer.length);
    let diff = new Uint8Array(fixture.buffer.length);

    await pica({ features: [ 'js' ] }).resizeBuffer({
      src:      src.buffer,
      width:    src.width,
      height:   src.height,
      dest:     dest,
      toWidth:  fixture.width,
      toHeight: fixture.height,
      filter:   'lanczos3'
    });

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
