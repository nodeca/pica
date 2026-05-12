import type { MathResizeFilter, MathResizeImage } from './mathlib'
import type { SupportedFeatures } from './supported_features'

export type PicaFeaturesFlat = ('js' | 'wasm' | 'ww' | 'cib' | 'all')[]

export type Filter = MathResizeFilter

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

export interface _ResizeOptionsCommon {
  quality?: CibResizeQuality
  filter?: Filter
  unsharpAmount?: number
  unsharpRadius?: number
  unsharpThreshold?: number
}

export interface ResizeOptions extends _ResizeOptionsCommon {
  cancelToken?: Promise<unknown>
}

export interface ResizeBufferOptions extends _ResizeOptionsCommon {
  src: Uint8Array | Uint8ClampedArray
  width: number
  height: number
  toWidth: number
  toHeight: number
  dest?: Uint8Array
}

export interface ResizeSettings {
  filter: Filter
  unsharpAmount: number
  unsharpRadius: number
  unsharpThreshold: number
}

export interface ResizeStage {
  width: number
  height: number
  toWidth: number
  toHeight: number
  destTileBorder: number
}

export interface ResizeContext {
  cancelToken?: Promise<unknown>
  canceled: boolean
}

export interface TileResizeJobBase extends ResizeSettings {
  width: number
  height: number
  toWidth: number
  toHeight: number
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
}

export interface TileResizeArrayJob extends TileResizeJobBase {
  kind: 'array'
  src: MathResizeImage
}

export interface TileResizeBitmapJob extends TileResizeJobBase {
  kind: 'bitmap'
  src: ImageBitmap
}

export type TileResizeJob = TileResizeArrayJob | TileResizeBitmapJob

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

export interface StageEnv {
  srcCtx: PicaCanvasCtx | null
  srcImageBitmap: ImageBitmap | null
  isImageBitmapReused: boolean
  toCtx: PicaCanvasCtx | null
}

export type WorkerMethod = 'resize' | 'get_supported_features'

export interface WorkerResizePayload {
  method: 'resize'
  job: TileResizeJob
  features: PicaFeaturesFlat
}

export interface WorkerFeaturesPayload {
  method: 'get_supported_features'
}

export type WorkerPayload = WorkerResizePayload | WorkerFeaturesPayload

export type ResizeResult =
  | { kind: 'array', data: Uint8Array }
  | { kind: 'bitmap', data: ImageBitmap }

export type WorkerFeaturesResult = { data: Capabilities }

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
