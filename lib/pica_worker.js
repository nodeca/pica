// Web Worker wrapper for image resize function

'use strict'

const MathLib = require('./mathlib')
const supported_features = require('./supported_features')


const workerScope = self

let mathLib

function resize_math (data, tileOpts) {
  if (!mathLib) mathLib = new MathLib(data.features)

  // Use multimath's sync auto-init. Avoid Promise use in old browsers,
  // because polyfills are not propagated to webworker.
  return mathLib.resizeAndUnsharp(tileOpts)
}

function resize (data) {
  const result = resize_math(data, data.opts)

  workerScope.postMessage({ data: result }, [result.buffer])
}

function resize_bitmap (data) {
  const tileOpts = data.opts
  let srcCanvas = new OffscreenCanvas(tileOpts.width, tileOpts.height)
  const srcCtx = srcCanvas.getContext('2d')

  srcCtx.drawImage(tileOpts.srcBitmap, 0, 0)
  tileOpts.src = srcCtx.getImageData(0, 0, tileOpts.width, tileOpts.height).data
  srcCanvas.width = srcCanvas.height = 0
  srcCanvas = null
  tileOpts.srcBitmap.close()
  tileOpts.srcBitmap = null

  const result = resize_math(data, tileOpts)
  const canvas = new OffscreenCanvas(tileOpts.toWidth, tileOpts.toHeight)
  const ctx = canvas.getContext('2d')

  const toImageData = ctx.createImageData(tileOpts.toWidth, tileOpts.toHeight)
  toImageData.data.set(result)
  ctx.putImageData(toImageData, 0, 0)

  const bitmap = canvas.transferToImageBitmap()

  workerScope.postMessage({ bitmap: bitmap }, [bitmap])
}

const methods = {
  resize: resize,
  resize_bitmap: resize_bitmap,
  get_supported_features: supported_features.get_supported_features
}

workerScope.onmessage = function (ev) {
  const method = ev.data.method || 'resize'

  if (!methods[method]) {
    workerScope.postMessage({ err: `Unknown worker method: ${method}` })
    return
  }

  Promise.resolve()
    .then(() => methods[method](ev.data))
    .then(
      result => {
        if (method === 'get_supported_features') workerScope.postMessage({ data: result })
      },
      err => { workerScope.postMessage({ err }) }
    )
}
