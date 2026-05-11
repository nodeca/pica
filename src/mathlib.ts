// @ts-nocheck
// Collection of math functions
//
// 1. Combine components together
// 2. Has async init to load wasm modules
//
import Multimath from 'multimath'

import mm_unsharp_mask from './mm_unsharp_mask'
import mm_resize from './mm_resize'

export default class MathLib extends Multimath {
  constructor (requested_features) {
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

  resizeAndUnsharp (options, cache) {
    const result = this.resize(options, cache)

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
