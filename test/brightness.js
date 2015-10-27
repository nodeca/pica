// Check that brightness is not changes after rescale
/*global describe, it*/
'use strict';


var resize = require('../lib/pure/resize');
var assert = require('assert');


function createTest(color) {
  var srcSize = 4 * 100 * 100,
      resultSize = 4 * 10 * 10,
      hexColor = color.toString(16),
      src = new Uint8Array(srcSize),
      correct = new Uint8Array(resultSize);

  src.fill(color);
  correct.fill(color);

  it('test 100x100 -> 10x10 with color #' + hexColor + hexColor + hexColor, function () {
    var result = resize({
      src: src,
      width: 100,
      height: 100,
      toWidth: 10,
      toHeight: 10,
      alpha: true
    });

    assert.deepEqual(result, correct);
    // console.log(result);
  });
}


describe('Brightness should not change', function () {
  createTest(255);
  createTest(127);
  createTest(0);
});
