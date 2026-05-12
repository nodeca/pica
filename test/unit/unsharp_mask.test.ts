import assert from 'assert'
import glur_js from 'glur/mono16'
import mathlib_raw from 'multimath'

import mm_unsharp_mask from '../../src/mm_unsharp_mask'
import type { WasmMathContext } from '../../src/types'

function fill (target: Uint16Array, arr: number | number[]): void {
  const values = Array.isArray(arr) ? arr : [arr]

  for (let i = 0; i < target.length; i++) target[i] = values[i % values.length]
}

describe('unsharp_mask', () => {
  describe('glur_mono16', () => {
    it('js', () => {
      const sample = new Uint16Array(100 * 100)

      fill(sample, 33333)

      const orig = sample.slice(0, sample.length)

      glur_js(sample, 100, 100, 2)

      assert.deepStrictEqual(sample, orig)
    })

    it('wasm', () => {
      const mlib_wasm = mathlib_raw({ js: false }).use(mm_unsharp_mask)

      // unsharp_mask wasm module does not provide API for direct glur16 call
      // Here is simple wrapper for testing
      function glur16_wasm_invoke (
        thisobj: WasmMathContext,
        src: Uint16Array,
        width: number,
        height: number,
        radius: number
      ): Uint16Array {
        // src = grayscale, 16 bits
        const pixels = width * height

        const src_byte_cnt = pixels * 2
        const out_byte_cnt = pixels * 2
        const tmp_byte_cnt = pixels * 2

        const line_byte_cnt = Math.max(width, height) * 4 // float32 array
        const coeffs_byte_cnt = 8 * 4

        const src_offset = 0
        const out_offset = src_offset + src_byte_cnt
        const tmp_offset = out_offset + out_byte_cnt
        const line_offset = tmp_offset + tmp_byte_cnt
        const coeffs_offset = line_offset + line_byte_cnt

        const instance = thisobj.__instance(
          'unsharp_mask',
          coeffs_offset + coeffs_byte_cnt,
          { exp: Math.exp }
        )

        const mem32 = new Uint16Array(thisobj.__memory.buffer)
        mem32.set(src)

        const fn = instance.exports.blurMono16 || instance.exports._blurMono16
        if (!fn) throw new Error('WASM blurMono16 function is not available')

        fn(src_offset, out_offset, tmp_offset, line_offset, coeffs_offset, width, height, radius)

        return new Uint16Array(thisobj.__memory.buffer.slice(out_offset, out_offset + out_byte_cnt))
      }

      const sample = new Uint16Array(100 * 100)
      fill(sample, [0, 255])

      const sample_js = sample.slice(0, sample.length)

      glur_js(sample_js, 100, 100, 2)

      const sample_wasm = glur16_wasm_invoke(mlib_wasm, sample, 100, 100, 2)

      assert.deepStrictEqual(sample_js, sample_wasm)
    })
  })

  describe('unsharp_mask', () => {
    function createSample (width: number, height: number): Uint8Array {
      const result = new Uint8Array(width * height * 4)

      for (let i = 0; i < result.length; i++) result[i] = 20 + i

      return result
    }

    it('js should not throw without wasm', () => {
      const mlib = mathlib_raw({ wasm: false }).use(mm_unsharp_mask)

      const sample = createSample(100, 100)
      mlib.unsharp_mask(sample, 100, 100, 80, 2, 2)
    })

    it('wasm', () => {
      const mlib_js = mathlib_raw({ wasm: false }).use(mm_unsharp_mask)
      const mlib_wasm = mathlib_raw({ js: false }).use(mm_unsharp_mask)

      const sample_js = createSample(100, 100)
      const sample_wasm = createSample(100, 100)

      mlib_js.unsharp_mask(sample_js, 100, 100, 80, 2, 2)
      mlib_wasm.unsharp_mask(sample_wasm, 100, 100, 80, 2, 2)

      assert.deepStrictEqual(sample_js, sample_wasm)
    })
  })
})
