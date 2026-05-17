import fn from './resize'
import wasm_fn from './resize_wasm'
import wasm_src from './convolve_wasm_base64'

export default {
  name: 'resize' as const,
  fn,
  wasm_fn,
  wasm_src
}
