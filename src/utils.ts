import type { CibResizeQuality, Filter, Limiter, PicaCanvas } from './types'

// Uses constructor.name — safe because all targets are browser built-ins or
// native Node.js library classes that minifiers don't rename. If this ever
// breaks after a toolchain change, fall back to Object.prototype.toString:
//   Object.prototype.toString.call(obj) === '[object HTMLCanvasElement]'  etc.
function objClass (obj: unknown): string {
  return (obj as any)?.constructor?.name ?? ''
}

export function isCanvas (element: unknown): element is PicaCanvas {
  const cname = objClass(element)

  return cname === 'HTMLCanvasElement' ||
         cname === 'OffscreenCanvas' ||
         cname === 'Canvas' /* node-canvas */ ||
         cname === 'CanvasElement' /* @napi-rs/canvas */
}

export function isImage (element: unknown): element is HTMLImageElement {
  return objClass(element) === 'HTMLImageElement'
}

export function isImageBitmap (element: unknown): element is ImageBitmap {
  return objClass(element) === 'ImageBitmap'
}

export function limiter (concurrency: number): Limiter {
  let active = 0
  const queue: Array<() => void> = []

  function roll () {
    if (active < concurrency && queue.length) {
      active++
      queue.shift()?.()
    }
  }

  return function limit<T> (fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        fn().then(
          result => {
            resolve(result)
            active--
            roll()
          },
          err => {
            reject(err)
            active--
            roll()
          }
        )
      })

      roll()
    })
  }
}

export function cib_quality_name (num: number): ResizeQuality {
  switch (num) {
    case 0: return 'pixelated'
    case 1: return 'low'
    case 2: return 'medium'
  }
  return 'high'
}

const CIB_QUALITY_FILTERS: Filter[] = ['box', 'hamming', 'lanczos2', 'lanczos3']

export function cib_quality_filter (num: CibResizeQuality): Filter {
  return CIB_QUALITY_FILTERS[num]
}

export function is_cib_filter (filter: Filter): boolean {
  return CIB_QUALITY_FILTERS.indexOf(filter) >= 0
}

export function filter_to_cib_quality (filter: Filter): CibResizeQuality | undefined {
  const index = CIB_QUALITY_FILTERS.indexOf(filter)

  return index >= 0 ? index as CibResizeQuality : undefined
}

type ResizeQuality = 'pixelated' | 'low' | 'medium' | 'high'
