type MathImageBuffer = Uint8Array | Uint8ClampedArray;
type MathResizeFilter = 'box' | 'hamming' | 'lanczos2' | 'lanczos3' | 'mks2013';

type PicaFeaturesFlat = ('js' | 'wasm' | 'ww' | 'cib' | 'all')[];
type Filter = MathResizeFilter;
type CibResizeQuality = 0 | 1 | 2 | 3;
type PicaCanvas = HTMLCanvasElement | OffscreenCanvas;
type PicaSource = PicaCanvas | HTMLImageElement | ImageBitmap;
type CreateCanvasPreference = {
    preferOffscreen?: boolean;
};
interface PicaOptions {
    tile?: number;
    concurrency?: number;
    features?: PicaFeaturesFlat;
    idle?: number;
    workerURL?: string | URL;
}
interface _ResizeOptionsCommon {
    quality?: CibResizeQuality;
    filter?: Filter;
    unsharpAmount?: number;
    unsharpRadius?: number;
    unsharpThreshold?: number;
}
interface ResizeOptions extends _ResizeOptionsCommon {
    cancelToken?: Promise<unknown>;
}
interface ResizeBufferOptions extends _ResizeOptionsCommon {
    src: MathImageBuffer;
    width: number;
    height: number;
    toWidth: number;
    toHeight: number;
    dest?: Uint8Array;
}

declare class Pica {
    private options;
    private __limit;
    private resize_features;
    private __workersPool;
    private capabilities;
    private __requested_features;
    private __mathlib;
    private __initPromise?;
    constructor(options?: PicaOptions);
    init(): Promise<this>;
    private __init;
    createCanvas(width: number, height: number, preferOffscreen?: CreateCanvasPreference): PicaCanvas;
    private __createWorkerSlot;
    private __invokeWorker;
    private __invokeResize;
    private __extractTileData;
    private __landTileData;
    private __tileAndResize;
    private __planStagesAndResize;
    private __resizeViaCreateImageBitmap;
    resize<TCanvas extends PicaCanvas>(from: PicaSource, to: TCanvas, options?: ResizeOptions): Promise<TCanvas>;
    resizeBuffer(options: ResizeBufferOptions): Promise<Uint8Array>;
    toBlob(canvas: HTMLCanvasElement | OffscreenCanvas, mimeType?: string, quality?: number): Promise<Blob>;
    debug(..._args: unknown[]): void;
}
declare function pica(options?: PicaOptions): Pica;

export { Pica, pica as default };
export type { CibResizeQuality, Filter, PicaCanvas, PicaFeaturesFlat, PicaOptions, PicaSource, ResizeBufferOptions, ResizeOptions };
