// Web Worker wrapper for image resize function

import MathLib from './mathlib'
import * as supported_features from './supported_features'
import type { MathResizeAndUnsharpOptions } from './mathlib'
import type { PicaFeaturesFlat, TileResizeBitmapJob, WorkerPayload, WorkerResizePayload } from './types'

const workerScope = self as unknown as DedicatedWorkerGlobalScope

let mathLib: MathLib | null = null

function resize_math (data: { features: PicaFeaturesFlat }, tileJob: MathResizeAndUnsharpOptions): Uint8Array {
  if (!mathLib) mathLib = new MathLib(data.features)

  // Use multimath's sync auto-init. Avoid Promise use in old browsers,
  // because polyfills are not propagated to webworker.
  return mathLib.resizeAndUnsharp(tileJob)
}

function resizeBitmap (data: WorkerResizePayload, tileJob: TileResizeBitmapJob): void {
  let srcCanvas: OffscreenCanvas | null = new OffscreenCanvas(tileJob.width, tileJob.height)
  const srcCtx = srcCanvas.getContext('2d')!

  srcCtx.drawImage(tileJob.src, 0, 0)
  const src = srcCtx.getImageData(0, 0, tileJob.width, tileJob.height).data
  srcCanvas.width = srcCanvas.height = 0
  srcCanvas = null
  tileJob.src.close()

  const mathOpts: MathResizeAndUnsharpOptions = {
    src,
    width: tileJob.width,
    height: tileJob.height,
    toWidth: tileJob.toWidth,
    toHeight: tileJob.toHeight,
    scaleX: tileJob.scaleX,
    scaleY: tileJob.scaleY,
    offsetX: tileJob.offsetX,
    offsetY: tileJob.offsetY,
    filter: tileJob.filter,
    unsharpAmount: tileJob.unsharpAmount,
    unsharpRadius: tileJob.unsharpRadius,
    unsharpThreshold: tileJob.unsharpThreshold
  }

  const result = resize_math(data, mathOpts)
  const canvas = new OffscreenCanvas(tileJob.toWidth, tileJob.toHeight)
  const ctx = canvas.getContext('2d')!

  const toImageData = ctx.createImageData(tileJob.toWidth, tileJob.toHeight)
  toImageData.data.set(result)
  ctx.putImageData(toImageData, 0, 0)

  const bitmap = canvas.transferToImageBitmap()

  workerScope.postMessage({ kind: 'bitmap', data: bitmap }, [bitmap])
}

function resize (data: WorkerResizePayload): void {
  if (data.job.kind === 'bitmap') {
    resizeBitmap(data, data.job)
    return
  }

  const result = resize_math(data, data.job)

  workerScope.postMessage({ kind: 'array', data: result }, [result.buffer])
}

function handleMessage (data: WorkerPayload): Promise<void> {
  switch (data.method) {
    case 'get_supported_features':
      return supported_features.get_supported_features()
        .then(result => { workerScope.postMessage({ data: result }) })

    case 'resize':
      resize(data)
      return Promise.resolve()

    default:
      return Promise.reject(new Error(`Unknown worker method: ${(data as { method?: unknown }).method}`))
  }
}

workerScope.onmessage = function (ev) {
  Promise.resolve()
    .then(() => handleMessage(ev.data as WorkerPayload))
    .catch(err => { workerScope.postMessage({ err }) })
}
