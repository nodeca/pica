'use strict';


const _pica  = require('../index.js');
const assert = require('assert');


describe('API', () => {

  // Need node 8 to run
  it('Upscale (unexpected use) via wasm should not crash', async () => {
    const p = _pica({ features: [ 'wasm' ] });

    const input = new Uint8Array(500 * 500 * 4);

    await p.resizeBuffer({
      src:      input,
      width:    500,
      height:   500,
      toWidth:  1000,
      toHeight: 1000
    });
  });

  it('Should return result in promise', async () => {
    let src = document.createElement('canvas');

    src.width = 1000;
    src.height = 1000;

    let to = document.createElement('canvas');

    to.width = 100;
    to.height = 100;

    const result = await _pica().resize(src, to);
    assert.strictEqual(result, to);
  });

  it('Resize with bad output size should fail', async () => {
    let src = document.createElement('canvas');
    src.width = 1000;
    src.height = 1000;
    let to = document.createElement('canvas');
    to.width = 0;
    to.height = 0;

    await assert.rejects(
      async () => _pica().resize(src, to),
      { message: 'Invalid output size: 0x0' }
    );
  });

});
