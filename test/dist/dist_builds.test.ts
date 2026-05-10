import pixelmatch from 'pixelmatch'
import { expect } from 'vitest'

import originalURL from '../fixtures/original.jpg?url'
import resizedURL from '../fixtures/resized.png?url'

async function loadScript (url) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')

    script.onload = resolve
    script.onerror = reject
    script.src = url
    document.head.appendChild(script)
  })
}

async function loadImage (url) {
  const image = new Image()

  image.src = url
  await new Promise(resolve => { image.onload = resolve })

  return image
}

async function assertResizeViaWorker (p) {
  await p.init()

  expect(p.resize_features.ww).toBe(true)

  const sourceImage = await loadImage(originalURL)
  const expectedImage = await loadImage(resizedURL)

  const srcCanvas = p.__createCanvas(sourceImage.width, sourceImage.height)
  const srcCtx = srcCanvas.getContext('2d')

  srcCtx.drawImage(sourceImage, 0, 0)

  const expectedCanvas = p.__createCanvas(expectedImage.width, expectedImage.height)
  const expectedCtx = expectedCanvas.getContext('2d')

  expectedCtx.drawImage(expectedImage, 0, 0)

  const destCanvas = p.__createCanvas(expectedImage.width, expectedImage.height)
  const destCtx = destCanvas.getContext('2d')
  const diffImageData = destCtx.createImageData(destCanvas.width, destCanvas.height)

  await p.resize(srcCanvas, destCanvas, { filter: 'lanczos3', unsharpAmount: 0 })

  const destImageData = destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height)
  const expectedImageData = expectedCtx.getImageData(0, 0, expectedCanvas.width, expectedCanvas.height)

  const numDiffPixels = pixelmatch(
    destImageData.data,
    expectedImageData.data,
    diffImageData.data,
    expectedCanvas.width,
    expectedCanvas.height,
    { threshold: 0.1, includeAA: true }
  )

  expect(numDiffPixels).toBeLessThan(expectedCanvas.width * expectedCanvas.height * 0.02)
}

describe('dist builds', () => {
  it('full .js build should resize via inline worker', async () => {
    await loadScript('/dist/pica.js')

    const p = window.pica({ features: ['js', 'ww'] })

    await assertResizeViaWorker(p)
  })

  it('full .mjs build should resize via inline worker', async () => {
    const pica = (await import('/dist/pica.mjs')).default
    const p = pica({ features: ['js', 'ww'] })

    await assertResizeViaWorker(p)
  })

  it('split .js build should resize via explicit workerURL', async () => {
    await loadScript('/dist/pica_main.js')

    const p = window.pica({ features: ['js', 'ww'], workerURL: '/dist/pica_worker.js' })

    await assertResizeViaWorker(p)
  })

  it('split .mjs build should resize via explicit workerURL', async () => {
    const pica = (await import('/dist/pica_main.mjs')).default
    const p = pica({ features: ['js', 'ww'], workerURL: '/dist/pica_worker.mjs' })

    await assertResizeViaWorker(p)
  })

  it('split build without workerURL should fail when ww is requested', async () => {
    await loadScript('/dist/pica_main.js')

    expect(() => window.pica({ features: ['js', 'ww'] })).toThrow('Pica: cannot use WebWorker without workerURL')
  })
})
