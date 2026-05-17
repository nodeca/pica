// Collection of math functions
//
// 1. Combine components together
// 2. Has async init to load wasm modules
//
import { MultiMath } from 'multimath'

import mm_unsharp_mask from './mm_unsharp_mask'
import mm_resize from './mm_resize'

export type MathFeaturesMap = { js: boolean; wasm: boolean }
export type { MultiMathPlugin as MathPlugin } from 'multimath'
export type MathImageBuffer = Uint8Array | Uint8ClampedArray
export type MathWasmContext = MultiMath

export type MathResizeFilter = 'box' | 'hamming' | 'lanczos2' | 'lanczos3' | 'mks2013'

export interface MathResizeOptions {
  src: MathImageBuffer
  width: number
  height: number
  toWidth: number
  toHeight: number
  dest?: Uint8Array
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
  filter: MathResizeFilter
}

export interface MathResizeAndUnsharpOptions extends MathResizeOptions {
  unsharpAmount: number
  unsharpRadius: number
  unsharpThreshold: number
}

export default class MathLib extends MultiMath {
  declare features: MathFeaturesMap
  declare resize: typeof mm_resize.fn
  declare unsharp_mask: typeof mm_unsharp_mask.fn

  constructor (requested_features?: readonly string[]) {
    const __requested_features = requested_features || []

    const features = {
      js: __requested_features.indexOf('js') >= 0,
      wasm: __requested_features.indexOf('wasm') >= 0
    }

    super(features)

    this.features = {
      js: features.js,
      wasm: features.wasm && this.has_wasm()
    }

    this.use(mm_unsharp_mask)
    this.use(mm_resize)
  }

  resizeAndUnsharp (options: MathResizeAndUnsharpOptions): Uint8Array {
    const result = this.resize(options)

    if (options.unsharpAmount) {
      this.unsharp_mask(
        result,
        options.toWidth,
        options.toHeight,
        options.unsharpAmount,
        options.unsharpRadius,
        options.unsharpThreshold
      )
    }

    return result
  }
}
