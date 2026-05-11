// @ts-nocheck
function objClass (obj) { return Object.prototype.toString.call(obj) }

export function isCanvas (element) {
  const cname = objClass(element)

  return cname === '[object HTMLCanvasElement]'/* browser */ ||
         cname === '[object OffscreenCanvas]' ||
         cname === '[object Canvas]'/* node-canvas */
}

export function isImage (element) {
  return objClass(element) === '[object HTMLImageElement]'
}

export function isImageBitmap (element) {
  return objClass(element) === '[object ImageBitmap]'
}

export function limiter (concurrency) {
  let active = 0
  const queue = []

  function roll () {
    if (active < concurrency && queue.length) {
      active++
      queue.shift()()
    }
  }

  return function limit (fn) {
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

export function cib_quality_name (num) {
  switch (num) {
    case 0: return 'pixelated'
    case 1: return 'low'
    case 2: return 'medium'
  }
  return 'high'
}
