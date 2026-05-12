// Web Worker wrapper for image resize function

import MathLib from './mathlib'
import * as supported_features from './supported_features'
import type { MathResizeAndUnsharpOptions } from './mathlib'
import type { PicaFeaturesFlat, TileResizeJob, WorkerPayload } from './types'

const workerScope = self as unknown as DedicatedWorkerGlobalScope

let mathLib: MathLib | null = null

function resize_math (data: { features: PicaFeaturesFlat }, tileJob: MathResizeAndUnsharpOptions): Uint8Array {
  if (!mathLib) mathLib = new MathLib(data.features)

  // Use multimath's sync auto-init. Avoid Promise use in old browsers,
  // because polyfills are not propagated to webworker.
  return mathLib.resizeAndUnsharp(tileJob)
}

function resize (data: Extract<WorkerPayload, { method: 'resize' }>): void {
  const result = resize_math(data, data.opts as MathResizeAndUnsharpOptions)

  workerScope.postMessage({ data: result }, [result.buffer])
}

function resize_bitmap (data: Extract<WorkerPayload, { method: 'resize_bitmap' }>): void {
  const tileJob: TileResizeJob = data.opts
  let srcCanvas: OffscreenCanvas | null = new OffscreenCanvas(tileJob.width, tileJob.height)
  const srcCtx = srcCanvas.getContext('2d')!

  srcCtx.drawImage(tileJob.srcBitmap!, 0, 0)
  tileJob.src = srcCtx.getImageData(0, 0, tileJob.width, tileJob.height).data
  srcCanvas.width = srcCanvas.height = 0
  srcCanvas = null
  tileJob.srcBitmap!.close()
  tileJob.srcBitmap = null

  const result = resize_math(data, tileJob as MathResizeAndUnsharpOptions)
  const canvas = new OffscreenCanvas(tileJob.toWidth, tileJob.toHeight)
  const ctx = canvas.getContext('2d')!

  const toImageData = ctx.createImageData(tileJob.toWidth, tileJob.toHeight)
  toImageData.data.set(result)
  ctx.putImageData(toImageData, 0, 0)

  const bitmap = canvas.transferToImageBitmap()

  workerScope.postMessage({ bitmap }, [bitmap])
}

const methods = {
  resize,
  resize_bitmap,
  get_supported_features: supported_features.get_supported_features
}

workerScope.onmessage = function (ev) {
  const data = ev.data as WorkerPayload
  const method = data.method

  if (!method || !methods[method]) {
    workerScope.postMessage({ err: `Unknown worker method: ${method}` })
    return
  }

  Promise.resolve()
    .then((): unknown => {
      if (method === 'get_supported_features') return methods.get_supported_features()
      if (method === 'resize') return methods.resize(data as Extract<WorkerPayload, { method: 'resize' }>)
      return methods.resize_bitmap(data as Extract<WorkerPayload, { method: 'resize_bitmap' }>)
    })
    .then(
      result => {
        if (method === 'get_supported_features') workerScope.postMessage({ data: result })
      },
      err => { workerScope.postMessage({ err }) }
    )
}
