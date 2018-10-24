'use strict';


const _pica  = require('../');
const assert = require('assert');
const Canvas = require('canvas');


describe('API', function () {

  // Need node 8 to run
  it('Upscale (unexpected use) via wasm shoudl not crash', function () {
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
    let src = new Canvas();

    src.width = 1000;
    src.height = 1000;

    let to = new Canvas();

    to.width = 100;
    to.height = 100;

    return _pica().resize(src, to).then(result => {
      assert.strictEqual(result, to);
    });
  });

});
