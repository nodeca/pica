import createFilters from './resize_filter_gen'
import { convolveHor, convolveVert, convolveHorWithPre, convolveVertWithPre } from './convolve'
import type { MathResizeOptions, MathImageBuffer } from '../mathlib'

function hasAlpha (src: MathImageBuffer, width: number, height: number): boolean {
  let ptr = 3
  const len = (width * height * 4)|0
  while (ptr < len) {
    if (src[ptr] !== 255) return true
    ptr = (ptr + 4)|0
  }
  return false
}

function resetAlpha (dst: Uint8Array, width: number, height: number): void {
  let ptr = 3
  const len = (width * height * 4)|0
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0 }
}

export default function resize (options: MathResizeOptions): Uint8Array {
  const src = options.src
  const srcW = options.width
  const srcH = options.height
  const destW = options.toWidth
  const destH = options.toHeight
  const scaleX = options.scaleX || options.toWidth / options.width
  const scaleY = options.scaleY || options.toHeight / options.height
  const offsetX = options.offsetX || 0
  const offsetY = options.offsetY || 0
  const dest = options.dest || new Uint8Array(destW * destH * 4)

  const filter = typeof options.filter === 'undefined' ? 'mks2013' : options.filter
  const filtersX = createFilters(filter, srcW, destW, scaleX, offsetX),
    filtersY = createFilters(filter, srcH, destH, scaleY, offsetY)

  const tmp = new Uint16Array(destW * srcH * 4)

  // Autodetect if alpha channel exists, and use appropriate method
  if (hasAlpha(src, srcW, srcH)) {
    convolveHorWithPre(src, tmp, srcW, srcH, destW, filtersX)
    convolveVertWithPre(tmp, dest, srcH, destW, destH, filtersY)
  } else {
    convolveHor(src, tmp, srcW, srcH, destW, filtersX)
    convolveVert(tmp, dest, srcH, destW, destH, filtersY)
    resetAlpha(dest, destW, destH)
  }

  return dest
}
