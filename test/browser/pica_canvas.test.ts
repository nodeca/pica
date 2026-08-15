import { expect } from 'vitest'

describe('API canvas', () => {
  it('Should return result in promise', async () => {
    const picaFactory = (await import('/dist/pica_main.mjs')).default
    const p = picaFactory({ features: ['js', 'wasm'] })
    await p.init()

    const src = p.createCanvas(1000, 1000)
    const to = p.createCanvas(100, 100)

    const result = await p.resize(src, to)
    expect(result).toBe(to)
  })

  it('Resize with bad output size should fail', async () => {
    const picaFactory = (await import('/dist/pica_main.mjs')).default
    const p = picaFactory({ features: ['js', 'wasm'] })
    await p.init()

    const src = p.createCanvas(1000, 1000)
    const to = p.createCanvas(0, 0)

    await expect(p.resize(src, to)).rejects.toThrow('Invalid output size: 0x0')
  })

  it('Web worker output should match main thread output at tile borders', async () => {
    const picaFactory = (await import('/dist/pica.mjs')).default
    const src = document.createElement('canvas')

    src.width = 1600
    src.height = 2400

    const srcCtx = src.getContext('2d', { willReadFrequently: true })!

    srcCtx.fillStyle = '#fff'
    srcCtx.fillRect(0, 0, src.width, src.height)
    srcCtx.fillStyle = '#000'

    for (let y = 0; y < src.height; y += 6) {
      for (let x = 0; x < src.width; x += 6) {
        srcCtx.fillRect(x, y, 3, 3)
      }
    }

    const expectedCanvas = document.createElement('canvas')
    expectedCanvas.width = 492
    expectedCanvas.height = 738

    const mainThreadPica = picaFactory({ features: ['js', 'wasm'] })
    await mainThreadPica.resize(src, expectedCanvas)

    const expected = expectedCanvas.getContext('2d', { willReadFrequently: true })!
      .getImageData(0, 0, expectedCanvas.width, expectedCanvas.height).data

    const actualCanvas = document.createElement('canvas')
    actualCanvas.width = 492
    actualCanvas.height = 738

    const workerPica = picaFactory({ features: ['js', 'wasm', 'ww'] })
    await workerPica.resize(src, actualCanvas)

    const actual = actualCanvas.getContext('2d', { willReadFrequently: true })!
      .getImageData(0, 0, actualCanvas.width, actualCanvas.height).data
    let differentPixels = 0

    for (let i = 0; i < actual.length; i += 4) {
      if (actual[i] !== expected[i] ||
          actual[i + 1] !== expected[i + 1] ||
          actual[i + 2] !== expected[i + 2] ||
          actual[i + 3] !== expected[i + 3]) {
        differentPixels++
      }
    }

    expect(differentPixels).toBe(0)
  }, 30_000)
})
