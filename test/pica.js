'use strict';


const _pica = require('../');

describe('API', function () {

  // Need node 8 to run
  it.skip('Upscale (unexpected use) via wasm shoudl not crash', function () {
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

});
