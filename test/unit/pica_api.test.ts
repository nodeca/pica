import pica from '../../src/pica_main'

describe('API buffer', () => {
  // Need node 8 to run
  it('Upscale (unexpected use) via wasm should not crash', async () => {
    const p = pica({ features: ['wasm'] })

    const input = new Uint8Array(500 * 500 * 4)

    await p.resizeBuffer({
      src: input,
      width: 500,
      height: 500,
      toWidth: 1000,
      toHeight: 1000
    })
  })
})
