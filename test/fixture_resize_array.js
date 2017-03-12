'use strict';
/* global it, describe */

var fs         = require('fs');
var path       = require('path');
var pica       = require('../');
var pixelmatch = require('pixelmatch');


var ppm        = require('./ppm');


var FIXTURES_DIRECTORY = path.join(__dirname, 'fixtures');
var OUTPUT_DIRECTORY = path.join(__dirname, '..');

describe('Fixtures', function () {
  it('algorithm should be correct for the given fixture', function (done) {
    var src     = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.ppm')));
    var fixture = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.ppm')));

    pica.WEBGL = false;
    pica.WW = false;

    var dest = new Uint8Array(fixture.buffer.length);
    var diff = new Uint8Array(fixture.buffer.length);

    pica.resizeBuffer({
      src:      src.buffer,
      width:    src.width,
      height:   src.height,
      dest:     dest,
      toWidth:  fixture.width,
      toHeight: fixture.height
    }, function (err) {

      if (err) throw err;

      var numDiffPixels = pixelmatch(
        dest,
        fixture.buffer,
        diff,
        fixture.width,
        fixture.height,
        { threshold: 0, includeAA: true }
      );

      if (numDiffPixels > 0) {
        fs.writeFileSync(
          path.join(OUTPUT_DIRECTORY, 'fixture-test-diff.ppm'),
          Buffer.from(ppm.encode(diff, fixture.width, fixture.height))
        );
        fs.writeFileSync(
          path.join(OUTPUT_DIRECTORY, 'fixture-test-output.ppm'),
          Buffer.from(ppm.encode(dest, fixture.width, fixture.height))
        );
        fs.writeFileSync(
          path.join(OUTPUT_DIRECTORY, 'fixture-test-expected.ppm'),
          Buffer.from(ppm.encode(fixture.buffer, fixture.width, fixture.height))
        );
        done(new Error('Images mismatch in ' + numDiffPixels + ' pixels'));
        return;
      }

      done();
    });
  });
});
