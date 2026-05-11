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
})
