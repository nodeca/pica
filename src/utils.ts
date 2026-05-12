import type { Limiter, PicaCanvas } from './types'

function objClass (obj: unknown): string { return Object.prototype.toString.call(obj) }

export function isCanvas (element: unknown): element is PicaCanvas {
  const cname = objClass(element)

  return cname === '[object HTMLCanvasElement]'/* browser */ ||
         cname === '[object OffscreenCanvas]' ||
         cname === '[object Canvas]'/* node-canvas */
}

export function isImage (element: unknown): element is HTMLImageElement {
  return objClass(element) === '[object HTMLImageElement]'
}

export function isImageBitmap (element: unknown): element is ImageBitmap {
  return objClass(element) === '[object ImageBitmap]'
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

type ResizeQuality = 'pixelated' | 'low' | 'medium' | 'high'
