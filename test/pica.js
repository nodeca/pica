'use strict';


const _pica  = require('../lib/pica_main');
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
    const p = _pica({ features: [ 'js', 'wasm' ] });
    await p.init();

    let src = p.__createCanvas(1000, 1000);
    let to = p.__createCanvas(100, 100);

    const result = await p.resize(src, to);
    assert.strictEqual(result, to);
  });

  it('Resize with bad output size should fail', async () => {
    const p = _pica({ features: [ 'js', 'wasm' ] });
    await p.init();

    let src = p.__createCanvas(1000, 1000);
    let to = p.__createCanvas(0, 0);

    await assert.rejects(
      async () => p.resize(src, to),
      { message: 'Invalid output size: 0x0' }
    );
  });

});
