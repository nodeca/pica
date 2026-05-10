// Algorythm should not change. Use fixtures to check.
//
'use strict'

const fs         = require('fs')
const path       = require('path')
const pica       = require('../lib/pica_main')
const pixelmatch = require('pixelmatch').default

const ppm        = require('./ppm')

const FIXTURES_DIRECTORY = path.join(__dirname, 'fixtures')
const OUTPUT_DIRECTORY   = path.join(__dirname, '..')


describe('Fixture resize', () => {

  it('.resizeCanvas() should be correct for the given fixture', async () => {
    const resizer = pica({ features: ['js'] })
    await resizer.init()

    const srcImage = new Image()
    const srcBuf = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.jpg'))

    srcImage.src = 'data:image/jpeg;base64,' + srcBuf.toString('base64')
    await new Promise(resolve => { srcImage.onload = resolve })

    const srcCanvas = resizer.__createCanvas(srcImage.width, srcImage.height)

    const srcCtx = srcCanvas.getContext('2d')

    srcCtx.drawImage(srcImage, 0, 0)

    const fixtureImage = new Image()
    const fixtureBuf = fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.png'))

    fixtureImage.src = 'data:image/png;base64,' + fixtureBuf.toString('base64')
    await new Promise(resolve => { fixtureImage.onload = resolve })

    const fixtureCanvas = resizer.__createCanvas(fixtureImage.width, fixtureImage.height)

    const fixtureCtx = fixtureCanvas.getContext('2d')

    fixtureCtx.drawImage(fixtureImage, 0, 0)

    const fixtureImageData = fixtureCtx.getImageData(0, 0, fixtureCanvas.width, fixtureCanvas.height)
    const destCanvas = resizer.__createCanvas(fixtureImage.width, fixtureImage.height)

    const destCtx = destCanvas.getContext('2d')
    const diffCanvas = resizer.__createCanvas(fixtureImage.width, fixtureImage.height)

    const diffCtx = diffCanvas.getContext('2d')
    const diffImageData = diffCtx.createImageData(diffCanvas.width, diffCanvas.height)

    await resizer.resize(srcCanvas, destCanvas, { filter: 'lanczos3', unsharpAmount: 0 })

    const destImageData = destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height)

    const numDiffPixels = pixelmatch(
      destImageData.data,
      fixtureImageData.data,
      diffImageData.data,
      fixtureCanvas.width,
      fixtureCanvas.height,
      { threshold: 0, includeAA: true }
    )

    if (numDiffPixels > 0) {
      diffCtx.putImageData(diffImageData, 0, 0)

      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-diff.png'),
        Buffer.from(await pica({ features: ['js'] }).toBlob(diffCanvas).then(b => b.arrayBuffer()))
      )

      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-output.png'),
        Buffer.from(await pica({ features: ['js'] }).toBlob(destCanvas).then(b => b.arrayBuffer()))
      )

      fs.writeFileSync(
        path.join(OUTPUT_DIRECTORY, 'fixture-test-expected.png'),
        Buffer.from(await pica({ features: ['js'] }).toBlob(fixtureCanvas).then(b => b.arrayBuffer()))
      )

      throw new Error(`Images mismatch in ${numDiffPixels} pixels`)
    }
  })


  it('.resizeBuffer() should be correct for the given fixture', async () => {
    const src     = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'original.ppm')))
    const fixture = ppm.decode(fs.readFileSync(path.join(FIXTURES_DIRECTORY, 'resized.ppm')))

    const dest = new Uint8Array(fixture.buffer.length)
    const diff = new Uint8Array(fixture.buffer.length)

    await pica({ features: ['js'] }).resizeBuffer({
      src: src.buffer,
      width: src.width,
      height: src.height,
      dest: dest,
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
