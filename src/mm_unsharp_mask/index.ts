import fn from './unsharp_mask'
import wasm_fn from './unsharp_mask_wasm'
import wasm_src from './unsharp_mask_wasm_base64'

export default {
  name: 'unsharp_mask',
  fn,
  wasm_fn,
  wasm_src
}
