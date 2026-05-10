'use strict'


function objClass (obj) { return Object.prototype.toString.call(obj) }


module.exports.isCanvas = function isCanvas (element) {
  const cname = objClass(element)

  return cname === '[object HTMLCanvasElement]'/* browser */ ||
         cname === '[object OffscreenCanvas]' ||
         cname === '[object Canvas]'/* node-canvas */
}


module.exports.isImage = function isImage (element) {
  return objClass(element) === '[object HTMLImageElement]'
}


module.exports.isImageBitmap = function isImageBitmap (element) {
  return objClass(element) === '[object ImageBitmap]'
}


module.exports.limiter = function limiter (concurrency) {
  let active = 0,
    queue  = []

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


module.exports.cib_quality_name = function cib_quality_name (num) {
  switch (num) {
    case 0: return 'pixelated'
    case 1: return 'low'
    case 2: return 'medium'
  }
  return 'high'
}
