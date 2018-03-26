'use strict';


const assert       = require('assert');
const createStages = require('../lib/stepper');

const TILE_SIZE = 1024;
const TILE_BORDER = 3;


describe('createStages', function () {
  it('1024x1024 -> 300x300 (1 stage)', function () {
    assert.deepEqual(createStages(
      1024,
      1024,
      300,
      300,
      TILE_SIZE,
      TILE_BORDER
    ), [ [ 300, 300 ] ]);
  });

  it('1024x1024 -> 2x2 (2 stages)', function () {
    assert.deepEqual(createStages(
      1024,
      1024,
      2,
      2,
      TILE_SIZE,
      TILE_BORDER
    ), [ [ 45, 45 ], [ 2, 2 ] ]);
  });

  it('102400x100 -> 1x1 (3 stages)', function () {
    assert.deepEqual(createStages(
      102400,
      100,
      1,
      1,
      TILE_SIZE,
      TILE_BORDER
    ), [ [ 2189, 22 ], [ 47, 5 ], [ 1, 1 ] ]);
  });

  it('20000x1 -> 1x20000 (magnifying along another axis)', function () {
    assert.deepEqual(createStages(
      20000,
      1,
      1,
      20000,
      TILE_SIZE,
      TILE_BORDER
    ), [ [ 737, 27 ], [ 27, 737 ], [ 1, 20000 ] ]);
  });

  it('1x1 -> 20000x20000 (magnifying should always be single stage)', function () {
    assert.deepEqual(createStages(
      1,
      1,
      20000,
      20000,
      TILE_SIZE,
      TILE_BORDER
    ), [ [ 20000, 20000 ] ]);
  });
});
