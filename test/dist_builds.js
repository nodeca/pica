'use strict';


const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch').default;
const { pathToFileURL } = require('url');


const importModule = new Function('url', 'return import(url);'); // eslint-disable-line no-new-func
const FIXTURES_DIRECTORY = path.join(__dirname, 'fixtures');


function distURL(file) {
  return pathToFileURL(path.join(__dirname, '..', 'dist', file)).href;
}


async function loadImage(file, mime) {
  let image = new Image();
  let buf = fs.readFileSync(path.join(FIXTURES_DIRECTORY, file));

  image.src = `data:${mime};base64,${buf.toString('base64')}`;
  await new Promise(resolve => { image.onload = resolve; });

  return image;
}


async function assertResizeViaWorker(p) {
  await p.init();

  assert.strictEqual(p.resize_features.ww, true);

  let sourceImage = await loadImage('original.jpg', 'image/jpeg');
  let expectedImage = await loadImage('resized.png', 'image/png');

  let srcCanvas = p.__createCanvas(sourceImage.width, sourceImage.height);
  let srcCtx = srcCanvas.getContext('2d');

  srcCtx.drawImage(sourceImage, 0, 0);

  let expectedCanvas = p.__createCanvas(expectedImage.width, expectedImage.height);
  let expectedCtx = expectedCanvas.getContext('2d');

  expectedCtx.drawImage(expectedImage, 0, 0);

  let destCanvas = p.__createCanvas(expectedImage.width, expectedImage.height);
  let destCtx = destCanvas.getContext('2d');
  let diffImageData = destCtx.createImageData(destCanvas.width, destCanvas.height);

  await p.resize(srcCanvas, destCanvas, { filter: 'lanczos3', unsharpAmount: 0 });

  let destImageData = destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height);
  let expectedImageData = expectedCtx.getImageData(0, 0, expectedCanvas.width, expectedCanvas.height);

  let numDiffPixels = pixelmatch(
    destImageData.data,
    expectedImageData.data,
    diffImageData.data,
    expectedCanvas.width,
    expectedCanvas.height,
    { threshold: 0.1, includeAA: true }
  );

  assert.ok(numDiffPixels < expectedCanvas.width * expectedCanvas.height * 0.02);
}


describe('dist builds', () => {

  it('full .js build should resize via inline worker', async () => {
    const pica = require('../dist/pica.js');
    const p = pica({ features: [ 'js', 'ww' ] });

    await assertResizeViaWorker(p);
  });

  it('full .mjs build should resize via inline worker', async () => {
    const pica = (await importModule(distURL('pica.mjs'))).default;
    const p = pica({ features: [ 'js', 'ww' ] });

    await assertResizeViaWorker(p);
  });

  it('split .js build should resize via explicit workerURL', async () => {
    const pica = require('../dist/pica_main.js');
    const p = pica({ features: [ 'js', 'ww' ], workerURL: distURL('pica_worker.js') });

    await assertResizeViaWorker(p);
  });

  it('split .mjs build should resize via explicit workerURL', async () => {
    const pica = (await importModule(distURL('pica_main.mjs'))).default;
    const p = pica({ features: [ 'js', 'ww' ], workerURL: distURL('pica_worker.mjs') });

    await assertResizeViaWorker(p);
  });

  it('split build without workerURL should fail when ww is requested', async () => {
    const pica = require('../dist/pica_main.js');

    assert.throws(
      () => pica({ features: [ 'js', 'ww' ] }),
      { message: 'Pica: cannot use WebWorker without workerURL' }
    );
  });
});
