import MathLib, { type MathResizeAndUnsharpOptions } from './mathlib'
import Pool from './pool'
import * as utils from './utils'
import createStages, { type Stage } from './stepper'
import createRegions, { type Tile } from './tiler'
import * as supported_features from './supported_features'
import type {
  Capabilities,
  CreateCanvasPreference,
  PicaFeaturesFlat,
  Filter,
  Limiter,
  PicaCanvas,
  PicaCanvasCtx,
  PicaOptions,
  PicaSource,
  ResizeBufferOptions,
  ResizeContext,
  ResizeFeaturesMap,
  ResizeSettings,
  ResizeStage,
  TileResizeJob,
  TileResizeJobBase,
  ResizeOptions,
  ResizeResult,
  ResolvedPicaOptions,
  StageEnv,
  WorkerFeaturesResult,
  WorkerMethod,
  WorkerResizePayload
} from './types'

export type {
  PicaFeaturesFlat,
  Filter,
  PicaCanvas,
  PicaOptions,
  PicaSource,
  ResizeBufferOptions,
  ResizeOptions,
  CibResizeQuality
} from './types'

declare const __PICA_WORKER_SRC__: string | undefined

const WORKER_SRC = typeof __PICA_WORKER_SRC__ !== 'undefined' ? __PICA_WORKER_SRC__ : ''

let concurrency = 1
if (typeof navigator !== 'undefined') {
  concurrency = Math.min(navigator.hardwareConcurrency || 1, 4)
}

const DEFAULT_PICA_OPTS: ResolvedPicaOptions = {
  tile: 1024,
  concurrency,
  features: ['js', 'wasm', 'ww'],
  idle: 2000,
}

const DEFAULT_RESIZE_OPTS: ResizeSettings = {
  filter: 'mks2013',
  unsharpAmount: 0,
  unsharpRadius: 0.0,
  unsharpThreshold: 0
}

// //////////////////////////////////////////////////////////////////////////////
// API methods

export class Pica {
  private options: ResolvedPicaOptions
  private __limit: Limiter
  private resize_features: ResizeFeaturesMap
  private __workersPool: Pool<Worker> | null
  private capabilities: Capabilities
  private __requested_features: PicaFeaturesFlat
  private __mathlib: MathLib | null
  private __initPromise?: Promise<this>

  constructor (options?: PicaOptions) {
    this.options = Object.assign({}, DEFAULT_PICA_OPTS, options || {})

    const workerRequested = this.options.features.indexOf('ww') >= 0 || this.options.features.indexOf('all') >= 0

    if (workerRequested && !this.options.workerURL && !WORKER_SRC) {
      throw new Error('Pica: cannot use WebWorker without workerURL')
    }

    this.__limit = utils.limiter(this.options.concurrency)

    // List of enabled resize methods, according to options & browser/node.js
    this.resize_features = {
      js: false, // pure JS implementation, can be disabled for testing
      wasm: false, // webassembly implementation for heavy functions
      cib: false, // resize via createImageBitmap (only FF at this moment)
      ww: false // webworkers
    }

    this.__workersPool = null
    this.capabilities = {
      worker: false,
      ww_offscreen_canvas: false,
      canvas: false,
      offscreen_canvas: false,
      may_be_worker: false,
      create_image_bitmap: false,
      safari_put_image_data_fix: false,
      bug_canvas_orientation_region: true,
      bug_image_bitmap_orientation_region: true,
      cib_resize: false
    }

    // Store requested features for webworkers
    this.__requested_features = []

    this.__mathlib = null
  }

  init (): Promise<this> {
    if (this.__initPromise) return this.__initPromise

    this.__initPromise = this.__init()

    return this.__initPromise
  }

  private async __init (): Promise<this> {
    let features = this.options.features.slice()

    if (features.indexOf('all') >= 0) {
      features = ['cib', 'wasm', 'js', 'ww']
    }

    this.__requested_features = features

    this.__mathlib = new MathLib(features)

    const result = await supported_features.get_supported_features()
    Object.assign(this.capabilities, result)

    if (this.capabilities.cib_resize && features.indexOf('cib') >= 0) {
      this.resize_features.cib = true
    }

    // Check WebWorker support if requested
    if (this.capabilities.may_be_worker && features.indexOf('ww') >= 0 && (WORKER_SRC || this.options.workerURL)) {
      this.__workersPool = new Pool(() => this.__createWorkerSlot(), this.options.idle)
    }

    if (this.__workersPool) {
      try {
        const result = await this.__invokeWorker<WorkerFeaturesResult>('get_supported_features')
        const resultData = result && result.data
        if (resultData) {
          this.capabilities.worker = true
          this.resize_features.ww = true
          this.capabilities.ww_offscreen_canvas = !!resultData.offscreen_canvas
        }
      } catch (__) {}
    }

    const mathlib = await this.__mathlib.init()
    // Copy detected resize methods
    Object.assign(this.resize_features, mathlib.features)

    return this
  }

  createCanvas (width: number, height: number, preferOffscreen?: CreateCanvasPreference): PicaCanvas {
    if (preferOffscreen && this.capabilities.offscreen_canvas) {
      return new OffscreenCanvas(width, height)
    }

    if (this.capabilities.canvas) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      return canvas
    }

    if (this.capabilities.ww_offscreen_canvas) {
      return new OffscreenCanvas(width, height)
    }

    throw new Error('Pica: cannot create canvas')
  }

  private __createWorkerSlot (): { value: Worker, destroy: () => void } {
    if (this.options.workerURL) {
      const worker = new Worker(String(this.options.workerURL))
      return { value: worker, destroy () { worker.terminate() } }
    }

    if (WORKER_SRC) {
      const objectURL = window.URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }))
      const worker = new Worker(objectURL)
      return {
        value: worker,
        destroy () {
          worker.terminate()
          if (typeof window !== 'undefined') {
            window.URL?.revokeObjectURL?.(objectURL)
          }
        }
      }
    }

    throw new Error('Pica: no worker source available')
  }

  // Call resizer in webworker or locally, depending on config
  private __invokeWorker<TResult> (
    method: WorkerMethod,
    payload?: Record<string, unknown>,
    transfer?: Transferable[],
    opts?: { cancelToken?: Promise<unknown> }
  ): Promise<TResult> {
    return new Promise((resolve, reject) => {
      const w = this.__workersPool!.acquire()

      if (opts && opts.cancelToken) opts.cancelToken.catch(err => reject(err))

      w.value.onmessage = ev => {
        w.release()

        if (ev.data.err) reject(ev.data.err)
        else resolve(ev.data)
      }

      w.value.postMessage(Object.assign({ method }, payload || {}), transfer || [])
    })
  }

  private async __invokeResize (tileJob: TileResizeJob, ctx: ResizeContext): Promise<ResizeResult> {
    await Promise.resolve()

    if (!this.resize_features.ww) {
    // not possible to have ImageBitmap here if user disabled WW
      if (tileJob.kind !== 'array') throw new Error('Pica: resize tile data is missing')

      const mathOpts: MathResizeAndUnsharpOptions = {
        src: tileJob.src,
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

      return { kind: 'array', data: this.__mathlib!.resizeAndUnsharp(mathOpts) }
    }

    const transfer = []

    if (tileJob.kind === 'array') transfer.push(tileJob.src.buffer)
    else transfer.push(tileJob.src)

    return this.__invokeWorker<ResizeResult>(
      'resize',
      {
        job: tileJob,
        features: this.__requested_features
      } satisfies Omit<WorkerResizePayload, 'method'>,
      transfer,
      ctx
    )
  }

  // this function can return promise if createImageBitmap is used
  private __extractTileData (
    tile: Tile,
    from: PicaSource,
    stageEnv: StageEnv,
    extractTo: TileResizeJobBase
  ): TileResizeJob {
    if (this.resize_features.ww && this.capabilities.ww_offscreen_canvas) {
      this.debug('Create tile imageBitmap')

      const tileCanvas = this.createCanvas(tile.width, tile.height, { preferOffscreen: true })
      const tileCtx = tileCanvas.getContext('2d') as PicaCanvasCtx

      tileCtx.drawImage(stageEnv.srcImageBitmap || from,
        tile.x, tile.y, tile.width, tile.height,
        0, 0, tile.width, tile.height)

      if (!('transferToImageBitmap' in tileCanvas)) {
        throw new Error('Pica: offscreen canvas is not available for worker transfer')
      }

      return Object.assign({}, extractTo, {
        kind: 'bitmap' as const,
        src: tileCanvas.transferToImageBitmap()
      })

    // Direct region extraction, intentionally disabled. This can be faster,
    // but has known EXIF orientation bugs in some browsers.
    //
    // return createImageBitmap(stageEnv.srcImageBitmap || from, tile.x, tile.y, tile.width, tile.height)
    //   .then(bitmap => {
    //     extractTo.src = bitmap;
    //     return extractTo;
    //   });
    }

    // Extract tile RGBA buffer, depending on input type
    if (utils.isCanvas(from)) {
      if (!stageEnv.srcCtx) stageEnv.srcCtx = from.getContext('2d') as PicaCanvasCtx

      // If input is Canvas - extract region data directly
      this.debug('Get tile pixel data')
      return Object.assign({}, extractTo, {
        kind: 'array' as const,
        src: stageEnv.srcCtx.getImageData(tile.x, tile.y, tile.width, tile.height).data
      })
    }

    // If input is Image or decoded to ImageBitmap,
    // draw region to temporary canvas and extract data from it
    //
    // Note! Attempt to reuse this canvas causes significant slowdown in chrome
    //
    this.debug('Draw tile imageBitmap/image to temporary canvas')

    const tmpCanvas = this.createCanvas(tile.width, tile.height, { preferOffscreen: true })

    const tmpCtx = tmpCanvas.getContext('2d') as PicaCanvasCtx
    tmpCtx.globalCompositeOperation = 'copy'
    tmpCtx.drawImage(stageEnv.srcImageBitmap || from,
      tile.x, tile.y, tile.width, tile.height,
      0, 0, tile.width, tile.height)

    this.debug('Get tile pixel data')

    const src = tmpCtx.getImageData(0, 0, tile.width, tile.height).data

    // Safari 12 workaround
    // https://github.com/nodeca/pica/issues/199
    tmpCanvas.width = tmpCanvas.height = 0

    return Object.assign({}, extractTo, {
      kind: 'array' as const,
      src
    })
  }

  private __landTileData (tile: Tile, result: ResizeResult, stageEnv: StageEnv): null {
    if (result.kind === 'bitmap') {
      stageEnv.toCtx!.drawImage(result.data, tile.toX, tile.toY)
      result.data.close()
      return null
    }

    this.debug('Draw tile')

    const toImageData = stageEnv.toCtx!.createImageData(tile.toWidth, tile.toHeight)
    toImageData.data.set(result.data)

    if (this.capabilities.safari_put_image_data_fix) {
    // Safari draws thin white stripes between tiles without this fix
      stageEnv.toCtx!.putImageData(toImageData, tile.toX, tile.toY,
        tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
        tile.toInnerWidth + 1e-5, tile.toInnerHeight + 1e-5)
    } else {
      stageEnv.toCtx!.putImageData(toImageData, tile.toX, tile.toY,
        tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
        tile.toInnerWidth, tile.toInnerHeight)
    }

    return null
  }

  private async __tileAndResize (
    from: PicaSource,
    to: PicaCanvas,
    settings: ResizeSettings,
    stage: ResizeStage,
    ctx: ResizeContext
  ): Promise<PicaCanvas> {
    const stageEnv: StageEnv = {
      srcCtx: null,
      srcImageBitmap: null,
      isImageBitmapReused: false,
      toCtx: null
    }

    const processTile = (tile: Tile) => this.__limit(async () => {
      if (ctx.canceled) return ctx.cancelToken

      const tileJob: TileResizeJobBase = {
        width: tile.width,
        height: tile.height,
        toWidth: tile.toWidth,
        toHeight: tile.toHeight,
        scaleX: tile.scaleX,
        scaleY: tile.scaleY,
        offsetX: tile.offsetX,
        offsetY: tile.offsetY,
        filter: settings.filter,
        unsharpAmount: settings.unsharpAmount,
        unsharpRadius: settings.unsharpRadius,
        unsharpThreshold: settings.unsharpThreshold
      }

      this.debug('Invoke resize math')

      const extractedTileJob = await this.__extractTileData(tile, from, stageEnv, tileJob)

      this.debug('Invoke resize math')
      const result = await this.__invokeResize(extractedTileJob, ctx)

      if (ctx.canceled) return ctx.cancelToken
      return this.__landTileData(tile, result, stageEnv)
    })

    // Need to normalize data source first. It can be canvas or image.
    // If image - try to decode in background if possible
    await Promise.resolve()

    stageEnv.toCtx = to.getContext('2d') as PicaCanvasCtx

    if (utils.isCanvas(from)) {
    // Source is ready as-is.
    } else if (utils.isImageBitmap(from)) {
      stageEnv.srcImageBitmap = from
      stageEnv.isImageBitmapReused = true
    } else if (utils.isImage(from)) {
    // try do decode image in background for faster next operations;
    // if we're using offscreen canvas, cib is called per tile, so not needed here
      if (this.capabilities.create_image_bitmap) {
        this.debug('Decode image via createImageBitmap')

        // Suppress error to use fallback, if method fails
        // https://github.com/nodeca/pica/issues/190
        try {
          stageEnv.srcImageBitmap = await createImageBitmap(from)
        } catch (__) {}
      }
    } else {
      throw new Error('Pica: ".from" should be Image, Canvas or ImageBitmap')
    }

    if (ctx.canceled) return ctx.cancelToken as Promise<PicaCanvas>

    this.debug('Calculate tiles')

    //
    // Here we are with "normalized" source,
    // follow to tiling
    //

    const regions = createRegions({
      width: stage.width,
      height: stage.height,
      srcTileSize: this.options.tile,
      toWidth: stage.toWidth,
      toHeight: stage.toHeight,
      destTileBorder: stage.destTileBorder
    })

    const jobs = regions.map(tile => processTile(tile))

    function cleanup (stageEnv: StageEnv) {
      if (stageEnv.srcImageBitmap) {
        if (!stageEnv.isImageBitmapReused) stageEnv.srcImageBitmap.close()
        stageEnv.srcImageBitmap = null
      }
    }

    this.debug('Process tiles')

    try {
      await Promise.all(jobs)
      this.debug('Finished!')
      cleanup(stageEnv)
      return to
    } catch (err) {
      cleanup(stageEnv)
      throw err
    }
  }

  private async __processStages (
    stages: Stage[],
    from: PicaSource,
    to: PicaCanvas,
    settings: ResizeSettings,
    stage: ResizeStage,
    ctx: ResizeContext
  ): Promise<PicaCanvas> {
    if (ctx.canceled) return ctx.cancelToken as Promise<PicaCanvas>

    const [toWidth, toHeight] = stages.shift()!

    const isLastStage = (stages.length === 0)

    // Optimization for legacy filters -
    // only use user-defined quality for the last stage,
    // use simpler (Hamming) filter for the first stages where
    // scale factor is large enough (more than 2-3)
    //
    // For advanced filters (mks2013 and custom) - skip optimization,
    // because need to apply sharpening every time
    let filter: Filter

    if (isLastStage || !utils.is_cib_filter(settings.filter)) filter = settings.filter
    else if (settings.filter === 'box') filter = 'box'
    else filter = 'hamming'

    const stageSettings = Object.assign({}, settings, {
      filter
    })

    const currentStage = Object.assign({}, stage, {
      toWidth,
      toHeight
    })

    let tmpCanvas: PicaCanvas | undefined

    if (!isLastStage) {
    // create temporary canvas
      tmpCanvas = this.createCanvas(toWidth, toHeight, { preferOffscreen: true })
    }

    try {
      await this.__tileAndResize(from, (isLastStage ? to : tmpCanvas)!, stageSettings, currentStage, ctx)

      if (isLastStage) return to

      const nextStage = Object.assign({}, currentStage, {
        width: toWidth,
        height: toHeight
      })

      return await this.__processStages(stages, tmpCanvas!, to, stageSettings, nextStage, ctx)
    } finally {
      if (tmpCanvas) {
      // Safari 12 workaround
      // https://github.com/nodeca/pica/issues/199
        tmpCanvas.width = tmpCanvas.height = 0
      }
    }
  }

  private async __resizeViaCreateImageBitmap (
    from: PicaSource,
    to: PicaCanvas,
    settings: ResizeSettings,
    stage: ResizeStage,
    ctx: ResizeContext
  ): Promise<PicaCanvas> {
    let toCtx: PicaCanvasCtx | null = to.getContext('2d') as PicaCanvasCtx

    this.debug('Resize via createImageBitmap()')

    const imageBitmap = await createImageBitmap(from, {
      resizeWidth: stage.toWidth,
      resizeHeight: stage.toHeight,
      resizeQuality: utils.cib_quality_name(utils.filter_to_cib_quality(settings.filter) ?? 3)
    })
    if (ctx.canceled) return ctx.cancelToken as Promise<PicaCanvas>

    // if no unsharp - draw directly to output canvas
    if (!settings.unsharpAmount) {
      toCtx.drawImage(imageBitmap, 0, 0)
      imageBitmap.close()
      toCtx = null

      this.debug('Finished!')

      return to
    }

    this.debug('Unsharp result')

    let tmpCanvas: PicaCanvas | null = this.createCanvas(stage.toWidth, stage.toHeight)

    let tmpCtx: PicaCanvasCtx | null = tmpCanvas.getContext('2d') as PicaCanvasCtx

    tmpCtx.drawImage(imageBitmap, 0, 0)
    imageBitmap.close()

    let iData: ImageData | null = tmpCtx.getImageData(0, 0, stage.toWidth, stage.toHeight)

    this.__mathlib!.unsharp_mask(
      iData.data,
      stage.toWidth,
      stage.toHeight,
      settings.unsharpAmount,
      settings.unsharpRadius,
      settings.unsharpThreshold
    )

    toCtx.putImageData(iData, 0, 0)

    // Safari 12 workaround
    // https://github.com/nodeca/pica/issues/199
    tmpCanvas.width = tmpCanvas.height = 0

    iData = tmpCtx = tmpCanvas = toCtx = null

    this.debug('Finished!')

    return to
  }

  async resize<TCanvas extends PicaCanvas> (
    from: PicaSource,
    to: TCanvas,
    options?: ResizeOptions
  ): Promise<TCanvas> {
    this.debug('Start resize...')

    const requested: ResizeOptions = {}

    if (options) {
      Object.assign(requested, options)
    }

    const settings: ResizeSettings = {
      filter: requested.filter || DEFAULT_RESIZE_OPTS.filter,
      unsharpAmount: requested.unsharpAmount || DEFAULT_RESIZE_OPTS.unsharpAmount,
      unsharpRadius: requested.unsharpRadius || DEFAULT_RESIZE_OPTS.unsharpRadius,
      unsharpThreshold: requested.unsharpThreshold || DEFAULT_RESIZE_OPTS.unsharpThreshold
    }

    // Legacy `.quality` option
    if (Object.prototype.hasOwnProperty.call(requested, 'quality')) {
      const quality = requested.quality
      if (typeof quality !== 'number' || quality < 0 || quality > 3) {
        throw new Error(`Pica: .quality should be [0..3], got ${quality}`)
      }
      settings.filter = utils.cib_quality_filter(quality)
    }

    const stage: ResizeStage = {
      width: utils.isImage(from) ? from.naturalWidth : from.width,
      height: utils.isImage(from) ? from.naturalHeight : from.height,
      toWidth: to.width,
      toHeight: to.height,
      destTileBorder: 0
    }

    // Prevent stepper from infinite loop
    if (to.width === 0 || to.height === 0) {
      return Promise.reject(new Error(`Invalid output size: ${to.width}x${to.height}`))
    }

    if (settings.unsharpRadius > 2) settings.unsharpRadius = 2

    const ctx: ResizeContext = {
      cancelToken: requested.cancelToken,
      canceled: false
    }

    if (ctx.cancelToken) {
    // Wrap cancelToken to avoid successive resolve & set flag
      ctx.cancelToken = ctx.cancelToken.then(
        data => { ctx.canceled = true; throw data },
        err => { ctx.canceled = true; throw err }
      )
    }

    const DEST_TILE_BORDER = 3 // Max possible filter window size
    stage.destTileBorder = Math.ceil(Math.max(DEST_TILE_BORDER, 2.5 * settings.unsharpRadius|0))

    await this.init()

    if (ctx.canceled) return ctx.cancelToken as Promise<TCanvas>

    // createImageBitmap doesn't work for images (Image, ImageBitmap) with
    // Exif orientation in Chrome. Enforce canvas use for such inputs.
    // see https://bugs.chromium.org/p/chromium/issues/detail?id=1220671
    if (this.capabilities.bug_image_bitmap_orientation_region &&
      (utils.isImage(from) || (utils.isImageBitmap(from)))) {
      const tmpCanvas = this.createCanvas(stage.width, stage.height)
      const tmpCtx = tmpCanvas.getContext('2d') as PicaCanvasCtx
      tmpCtx.drawImage(from, 0, 0)
      from = tmpCanvas
    }

    // if createImageBitmap supports resize, just do it and return
    if (this.resize_features.cib) {
      if (utils.is_cib_filter(settings.filter)) {
        return this.__resizeViaCreateImageBitmap(from, to, settings, stage, ctx) as Promise<TCanvas>
      }

      this.debug('cib is enabled, but not supports provided filter, fallback to manual math')
    }

    if (!this.capabilities.canvas) {
      const err = new Error('Pica: cannot use getImageData on canvas, ' +
                        "make sure fingerprinting protection isn't enabled")
      // @ts-ignore
      err.code = 'ERR_GET_IMAGE_DATA'
      throw err
    }

    //
    // No easy way, let's resize manually via arrays
    //

    const stages = createStages(
      stage.width,
      stage.height,
      stage.toWidth,
      stage.toHeight,
      this.options.tile,
      stage.destTileBorder
    )

    return this.__processStages(stages, from, to, settings, stage, ctx) as Promise<TCanvas>
  }

  // RGBA buffer resize
  //
  async resizeBuffer (options: ResizeBufferOptions): Promise<Uint8Array> {
    const opts = Object.assign({}, DEFAULT_RESIZE_OPTS, options)

    // Legacy `.quality` option
    if (Object.prototype.hasOwnProperty.call(opts, 'quality')) {
      const quality = opts.quality
      if (typeof quality !== 'number' || quality < 0 || quality > 3) {
        throw new Error(`Pica: .quality should be [0..3], got ${quality}`)
      }
      opts.filter = utils.cib_quality_filter(quality)
    }

    await this.init()
    if (!this.__mathlib) throw new Error('Pica: math library is not initialized')

    const mathOpts: MathResizeAndUnsharpOptions = {
      src: opts.src,
      width: opts.width,
      height: opts.height,
      toWidth: opts.toWidth,
      toHeight: opts.toHeight,
      dest: opts.dest,
      scaleX: opts.toWidth / opts.width,
      scaleY: opts.toHeight / opts.height,
      offsetX: 0,
      offsetY: 0,
      filter: opts.filter,
      unsharpAmount: opts.unsharpAmount,
      unsharpRadius: opts.unsharpRadius,
      unsharpThreshold: opts.unsharpThreshold
    }

    return this.__mathlib.resizeAndUnsharp(mathOpts)
  }

  async toBlob (canvas: HTMLCanvasElement | OffscreenCanvas, mimeType?: string, quality?: number): Promise<Blob> {
    mimeType = mimeType || 'image/png'

    // Ordinary Canvas
    if ('toBlob' in canvas && canvas.toBlob) {
      return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob as Blob), mimeType, quality)
      })
    }

    // OffscreenCanvas
    if ('convertToBlob' in canvas && canvas.convertToBlob) {
      return canvas.convertToBlob({
        type: mimeType,
        quality
      })
    }

    // Fallback for old browsers
    const asString = atob((canvas as HTMLCanvasElement).toDataURL(mimeType, quality).split(',')[1])
    const len = asString.length
    const asBuffer = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
      asBuffer[i] = asString.charCodeAt(i)
    }

    return new Blob([asBuffer], { type: mimeType })
  }

  debug (..._args: unknown[]): void {}
}

export default function pica (options?: PicaOptions): Pica {
  return new Pica(options)
}
