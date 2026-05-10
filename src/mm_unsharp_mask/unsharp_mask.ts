// @ts-nocheck
// Unsharp mask filter
//
// http://stackoverflow.com/a/23322820/1031804
// USM(O) = O + (2 * (Amount / 100) * (O - GB))
// GB - gaussian blur.
//
// Image is converted from RGB to HSV, unsharp mask is applied to the
// brightness channel and then image is converted back to RGB.
//
'use strict'


import glur_mono16 from 'glur/mono16'


function hsv_v16 (img, width, height) {
  const size = width * height
  const out = new Uint16Array(size)
  let r, g, b, max
  for (let i = 0; i < size; i++) {
    r = img[4 * i]
    g = img[4 * i + 1]
    b = img[4 * i + 2]
    max = (r >= g && r >= b) ? r : (g >= b && g >= r) ? g : b
    out[i] = max << 8
  }
  return out
}


export default function unsharp (img, width, height, amount, radius, threshold) {
  let v1, v2, vmul
  let diff, iTimes4

  if (amount === 0 || radius < 0.5) {
    return
  }
  if (radius > 2.0) {
    radius = 2.0
  }

  const brightness = hsv_v16(img, width, height)

  const blured = new Uint16Array(brightness) // copy, because blur modify src

  glur_mono16(blured, width, height, radius)

  const amountFp = (amount / 100 * 0x1000 + 0.5)|0
  const thresholdFp = threshold << 8

  const size = width * height


  for (let i = 0; i < size; i++) {
    v1 = brightness[i]
    diff = v1 - blured[i]

    if (Math.abs(diff) >= thresholdFp) {
      // add unsharp mask to the brightness channel
      v2 = v1 + ((amountFp * diff + 0x800) >> 12)

      // Both v1 and v2 are within [0.0 .. 255.0] (0000-FF00) range, never going into
      // [255.003 .. 255.996] (FF01-FFFF). This allows to round this value as (x+.5)|0
      // later without overflowing.
      v2 = v2 > 0xff00 ? 0xff00 : v2
      v2 = v2 < 0x0000 ? 0x0000 : v2

      // Avoid division by 0. V=0 means rgb(0,0,0), unsharp with unsharpAmount>0 cannot
      // change this value (because diff between colors gets inflated), so no need to verify correctness.
      v1 = v1 !== 0 ? v1 : 1

      // Multiplying V in HSV model by a constant is equivalent to multiplying each component
      // in RGB by the same constant (same for HSL), see also:
      // https://beesbuzz.biz/code/16-hsv-color-transforms
      vmul = ((v2 << 12) / v1)|0

      // Result will be in [0..255] range because:
      //  - all numbers are positive
      //  - r,g,b <= (v1/256)
      //  - r,g,b,(v1/256),(v2/256) <= 255
      // So highest this number can get is X*255/X+0.5=255.5 which is < 256 and rounds down.

      iTimes4 = i * 4
      img[iTimes4] = (img[iTimes4] * vmul + 0x800) >> 12 // R
      img[iTimes4 + 1] = (img[iTimes4 + 1] * vmul + 0x800) >> 12 // G
      img[iTimes4 + 2] = (img[iTimes4 + 2] * vmul + 0x800) >> 12 // B
    }
  }
}
