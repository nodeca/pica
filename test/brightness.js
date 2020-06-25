// Check that brightness is not changes after rescale
//
'use strict';


const pica   = require('../index.js')();
const assert = require('assert');


function fill(arr, val) {
  for (let i = 0; i < arr.length; i++) { arr[i] = val; }
}

const SRC_W =  1000,
      SRC_H =  768,
      DEST_W = 140,
      DEST_H = 108;

function createTest(color) {
  let srcSize    = 4 * SRC_W * SRC_H,
      resultSize = 4 * DEST_W * DEST_H,
      hexColor   = color.toString(16),
      src        = new Uint8Array(srcSize),
      correct    = new Uint8Array(resultSize);

  fill(src, color);
  fill(correct, color);

  let test_name = `test ${SRC_W}x${SRC_H} -> ${DEST_W}x${DEST_H} with color #${hexColor}${hexColor}${hexColor}`;

  it(test_name, function () {
    return pica.resizeBuffer({
      src:      src,
      width:    SRC_W,
      height:   SRC_H,
      toWidth:  DEST_W,
      toHeight: DEST_H,
      alpha:    true
    })
    .then(result => assert.deepEqual(result, correct));
  });
}


describe('Brightness should not change', function () {
  createTest(255);
  createTest(127);
});
