#!/usr/bin/env node

'use strict';


var pica      = require('../')({ features: [ 'js' ] });


function noop() {}


const sample = {
  width:  3200,
  height: 2500
};
sample.buffer    = new Uint8Array(sample.width * sample.height * 4);


for (var i = 0; i < 10; i++) {
  pica.resizeBuffer({
    src:    sample.buffer,
    width:  sample.width,
    height: sample.height,
    toWidth: 300,
    toHeight: 225,
    quality: 3
  })
  .then(noop);
}
/*
var unsharp = require('../lib/pure/unsharp');

for (var i = 0; i < 30; i++) {
  unsharp(data, image.width, image.height, 100, 1.0, 0);
}
*/
