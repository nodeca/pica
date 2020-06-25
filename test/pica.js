'use strict';


const _pica  = require('../index.js');
const assert = require('assert');
const { createCanvas } = require('canvas');


describe('API', function () {

  // Need node 8 to run
  it('Upscale (unexpected use) via wasm should not crash', function () {
    const p = _pica({ features: [ 'wasm' ] });

    const input = new Uint8Array(500 * 500 * 4);

    return p.init().then(() => p.resizeBuffer({
      src:      input,
      width:    500,
      height:   500,
      toWidth:  1000,
      toHeight: 1000
    }));
  });

  it('Should return result in promise', function () {
    let src = createCanvas();

    src.width = 1000;
    src.height = 1000;

    let to = createCanvas();

    to.width = 100;
    to.height = 100;

    return _pica().resize(src, to).then(result => {
      assert.strictEqual(result, to);
    });
  });

  it('Resize with bad output size should fail', function () {
    let src = createCanvas();
    src.width = 1000;
    src.height = 1000;
    let to = createCanvas();
    to.width = 0;
    to.height = 0;
    return _pica().resize(src, to)
    .then(() => { throw new Error('Resize should fail'); })
    .catch(err => {
      assert.equal(err.message, 'Invalid output size: 0x0');
    });
  });

});
