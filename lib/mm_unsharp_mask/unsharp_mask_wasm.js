'use strict'


module.exports = function unsharp (img, width, height, amount, radius, threshold) {
  if (amount === 0 || radius < 0.5) {
    return
  }

  if (radius > 2.0) {
    radius = 2.0
  }

  const pixels = width * height

  const img_bytes_cnt        = pixels * 4
  const hsv_bytes_cnt        = pixels * 2
  const blur_bytes_cnt       = pixels * 2
  const blur_line_byte_cnt   = Math.max(width, height) * 4 // float32 array
  const blur_coeffs_byte_cnt = 8 * 4 // float32 array

  const img_offset         = 0
  const hsv_offset         = img_bytes_cnt
  const blur_offset        = hsv_offset + hsv_bytes_cnt
  const blur_tmp_offset    = blur_offset + blur_bytes_cnt
  const blur_line_offset   = blur_tmp_offset + blur_bytes_cnt
  const blur_coeffs_offset = blur_line_offset + blur_line_byte_cnt

  const instance = this.__instance(
    'unsharp_mask',
    img_bytes_cnt + hsv_bytes_cnt + blur_bytes_cnt * 2 + blur_line_byte_cnt + blur_coeffs_byte_cnt,
    { exp: Math.exp }
  )

  // 32-bit copy is much faster in chrome
  const img32 = new Uint32Array(img.buffer)
  const mem32 = new Uint32Array(this.__memory.buffer)
  mem32.set(img32)

  // HSL
  let fn = instance.exports.hsv_v16 || instance.exports._hsv_v16
  fn(img_offset, hsv_offset, width, height)

  // BLUR
  fn = instance.exports.blurMono16 || instance.exports._blurMono16
  fn(hsv_offset, blur_offset, blur_tmp_offset,
    blur_line_offset, blur_coeffs_offset, width, height, radius)

  // UNSHARP
  fn = instance.exports.unsharp || instance.exports._unsharp
  fn(img_offset, img_offset, hsv_offset,
    blur_offset, width, height, amount, threshold)

  // 32-bit copy is much faster in chrome
  img32.set(new Uint32Array(this.__memory.buffer, 0, pixels))
}
