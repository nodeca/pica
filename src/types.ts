export type PicaFeaturesFlat = ('js' | 'wasm' | 'ww' | 'cib' | 'all')[]

export type Filter = 'box' | 'hamming' | 'lanczos2' | 'lanczos3' | 'mks2013'

export type CibResizeQuality = 0 | 1 | 2 | 3

export type PicaCanvas = HTMLCanvasElement | OffscreenCanvas
export type PicaCanvasCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export type PicaSource = PicaCanvas | HTMLImageElement | ImageBitmap

export type CreateCanvasPreference = { preferOffscreen?: boolean }

export interface PicaOptions {
  tile?: number
  concurrency?: number
  features?: PicaFeaturesFlat
  idle?: number
  workerURL?: string | URL
}

export interface ResolvedPicaOptions {
  tile: number
  concurrency: number
  features: PicaFeaturesFlat
  idle: number
  workerURL?: string | URL
}

export interface ResizeOptions {
  quality?: CibResizeQuality
  filter?: Filter
  unsharpAmount?: number
  unsharpRadius?: number
  unsharpThreshold?: number
  cancelToken?: Promise<unknown>
}

export interface ResizeBufferOptions extends ResizeOptions {
  src: Uint8Array | Uint8ClampedArray
  width: number
  height: number
  toWidth: number
  toHeight: number
  dest?: Uint8Array
  scaleX?: number
  scaleY?: number
  offsetX?: number
  offsetY?: number
}

export interface NormalizedResizeOptions extends Required<Omit<ResizeOptions, 'cancelToken' | 'quality'>> {
  quality?: CibResizeQuality
  cancelToken?: Promise<unknown>
  width: number
  height: number
  toWidth: number
  toHeight: number
  canceled: boolean
  __destTileBorder: number
  __mathCache?: MathCache
}

export interface ResizeMathOptions extends Required<Omit<ResizeBufferOptions, 'dest' | 'cancelToken' | 'quality'>> {
  quality?: CibResizeQuality
  cancelToken?: Promise<unknown>
  dest?: Uint8Array
  srcBitmap?: ImageBitmap | null
}

import type { SupportedFeatures } from './supported_features'

export interface Capabilities extends SupportedFeatures {
  worker: boolean
  ww_offscreen_canvas: boolean
}

export interface ResizeFeaturesMap {
  js: boolean
  wasm: boolean
  cib: boolean
  ww: boolean
}

export interface MathFeaturesMap {
  js: boolean
  wasm: boolean
}

export type MathCache = Record<string, unknown>

export interface StageEnv {
  srcCtx: PicaCanvasCtx | null
  srcImageBitmap: ImageBitmap | null
  isImageBitmapReused: boolean
  toCtx: PicaCanvasCtx | null
}

export type WorkerMethod = 'resize' | 'resize_bitmap' | 'get_supported_features'

export interface WorkerArrayResizePayload {
  method: 'resize'
  opts: ResizeMathOptions
  features: PicaFeaturesFlat
  preload: {
    wasm_nodule?: unknown
  }
}

export interface WorkerBitmapResizePayload {
  method: 'resize_bitmap'
  opts: ResizeMathOptions
  features: PicaFeaturesFlat
  preload: {
    wasm_nodule?: unknown
  }
}

export interface WorkerFeaturesPayload {
  method: 'get_supported_features'
}

export type WorkerPayload = WorkerArrayResizePayload | WorkerBitmapResizePayload | WorkerFeaturesPayload

export type WorkerResult =
  | { data: Uint8Array }
  | { bitmap: ImageBitmap }
  | { data: Capabilities }
  | { err: unknown }

export type ResizeResult = { data: Uint8Array } | { bitmap: ImageBitmap }

export interface WorkerWithObjectURL extends Worker {
  objectURL?: string
}

export interface PoolResource<T> {
  id: number
  value: T
  lastUsed?: number
  release: () => void
  destroy: () => void
}

export type Limiter = <T>(fn: () => Promise<T>) => Promise<T>

export interface WasmExports {
  [name: string]: Function | undefined
}

export interface WasmInstance {
  exports: WasmExports
}

export interface WasmMathContext {
  __memory: WebAssembly.Memory
  __align: (offset: number) => number
  __instance: (name: string, bytes: number, imports?: Record<string, unknown>) => WasmInstance
}
