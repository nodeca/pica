import { Canvas } from '@napi-rs/canvas'
import pica from 'pica'

// Documented way to use pica in Node.js: expose an external canvas library as
// the global OffscreenCanvas. Workers are not used in Node.js.
globalThis.OffscreenCanvas = Canvas as any

describe('Node.js canvas resize (@napi-rs/canvas)', () => {
  it('should resize canvas to smaller size', async () => {
    const p = pica()

    const src = new OffscreenCanvas(200, 100)
    const ctx = src.getContext('2d')!
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 200, 100)

    const dst = new OffscreenCanvas(100, 50)
    await p.resize(src, dst)

    const dstCtx = dst.getContext('2d')!
    const data = dstCtx.getImageData(0, 0, 100, 50)

    expect(data.width).toBe(100)
    expect(data.height).toBe(50)
    expect(data.data.length).toBe(100 * 50 * 4)
    expect(data.data[0]).toBeGreaterThan(200) // R — red channel dominates
    expect(data.data[2]).toBeLessThan(50)     // B
  })
})
