// Algorythm should not change. Use fixtures to check.
//
'use strict'

const fs = require('fs')
const path = require('path')
const pica = require('../../lib/pica_main')
const pixelmatch = require('pixelmatch').default

const ppm = require('../ppm')

const FIXTURES_DIRECTORY = path.join(__dirname, '..', 'fixtures')
const OUTPUT_DIRECTORY = path.join(__dirname, '..', '..')


describe('Fixture resize buffer', () => {
  it('.resizeBuffer() should be correct for the given fixture', async () => {
    const src = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.ppm')))
    const fixture = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.ppm')))

    const dest = new Uint8Array(fixture.buffer.length)
    const diff = new Uint8Array(fixture.buffer.length)

    await pica({ features: ['js'] }).resizeBuffer({
      src: src.buffer,
      width: src.width,
      height: src.height,
      dest,
      toWidth: fixture.width,
      toHeight: fixture.height,
      filter: 'lanczos3'
    })

    const numDiffPixels = pixelmatch(
      dest,
      fixture.buffer,
      diff,
      fixture.width,
      fixture.height,
      { threshold: 0, includeAA: true }
    )

    if (numDiffPixels > 0) {
      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-diff.ppm'),
        Buffer.from(ppm.encode(diff, fixture.width, fixture.height))
      )
      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-output.ppm'),
        Buffer.from(ppm.encode(dest, fixture.width, fixture.height))
      )
      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-expected.ppm'),
        Buffer.from(ppm.encode(fixture.buffer, fixture.width, fixture.height))
      )
      throw new Error(`Images mismatch in ${numDiffPixels} pixels`)
    }
  })
})
