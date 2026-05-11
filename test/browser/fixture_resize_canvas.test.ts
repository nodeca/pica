// Algorythm should not change. Use fixtures to check.
//
import pixelmatch from 'pixelmatch'
import { expect } from 'vitest'

import originalURL from '../fixtures/original.jpg?url'
import resizedURL from '../fixtures/resized.png?url'

async function loadImage (url) {
  const image = new Image()
  image.src = url
  await new Promise(resolve => { image.onload = resolve })

  return image
}

describe('Fixture resize canvas', () => {
  it('.resizeCanvas() should be correct for the given fixture', async () => {
    const picaFactory = (await import('/dist/pica_main.mjs')).default
    const resizer = picaFactory({ features: ['js'] })
    await resizer.init()

    const srcImage = await loadImage(originalURL)
    const srcCanvas = resizer.createCanvas(srcImage.width, srcImage.height)
    const srcCtx = srcCanvas.getContext('2d')

    srcCtx.drawImage(srcImage, 0, 0)

    const fixtureImage = await loadImage(resizedURL)
    const fixtureCanvas = resizer.createCanvas(fixtureImage.width, fixtureImage.height)
    const fixtureCtx = fixtureCanvas.getContext('2d')

    fixtureCtx.drawImage(fixtureImage, 0, 0)

    const fixtureImageData = fixtureCtx.getImageData(0, 0, fixtureCanvas.width, fixtureCanvas.height)
    const destCanvas = resizer.createCanvas(fixtureImage.width, fixtureImage.height)
    const destCtx = destCanvas.getContext('2d')
    const diffCanvas = resizer.createCanvas(fixtureImage.width, fixtureImage.height)
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

    if (numDiffPixels > 0) diffCtx.putImageData(diffImageData, 0, 0)

    expect(numDiffPixels).toBeLessThan(fixtureCanvas.width * fixtureCanvas.height * 0.02)
  })
})
