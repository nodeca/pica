// Check that brightness is not changes after rescale
/*global describe, it*/
'use strict';


var resize = require('../lib/pure/resize');
var assert = require('assert');

function fill(arr, val) {
  for (var i = 0; i < arr.length; i++) { arr[i] = val; }
}

var SRC_W =  1000,
    SRC_H =  768,
    DEST_W = 140,
    DEST_H = 108;

function createTest(color) {
  var srcSize = 4 * SRC_W * SRC_H,
      resultSize = 4 * DEST_W * DEST_H,
      hexColor = color.toString(16),
      src = new Uint8Array(srcSize),
      correct = new Uint8Array(resultSize);

  fill(src, color);
  fill(correct, color);

  it.skip('test 100x100 -> 10x10 with color #' + hexColor + hexColor + hexColor, function () {
    var result = resize({
      src:      src,
      width:    SRC_W,
      height:   SRC_H,
      toWidth:  DEST_W,
      toHeight: DEST_H,
      alpha:    true
    });

    assert.deepEqual(result, correct);
    // console.log(result);
  });
}


describe('Brightness should not change', function () {
  createTest(255);
  // createTest(127);
});
