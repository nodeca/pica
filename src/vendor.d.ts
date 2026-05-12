declare module 'glur/mono16' {
  export default function glurMono16 (
    src: Uint16Array,
    width: number,
    height: number,
    radius: number
  ): void
}

declare module 'multimath' {
  export interface MmFeaturesMap {
    js: boolean
    wasm: boolean
  }

  export interface MmOptions extends Partial<MmFeaturesMap> {
    modules?: Record<string, MmPlugin>
  }

  export interface MmJsPlugin {
    name: string
    fn: Function
  }

  export interface MmWasmPlugin extends MmJsPlugin {
    wasm_fn: Function
    wasm_src: string
  }

  export type MmPlugin = MmJsPlugin | MmWasmPlugin

  export interface MmWasmContext {
    __memory: WebAssembly.Memory
    __align: (offset: number, base?: number) => number
    __instance: (name: string, bytes: number, imports?: Record<string, unknown>) => WebAssembly.Instance
  }

  export interface MmInstance {
    options: MmFeaturesMap
    __memory: WebAssembly.Memory | null

    has_wasm(): boolean
    init(): Promise<this>
    use(plugin: MmPlugin): this
    __base64decode(data: string): Uint8Array
    __reallocate(bytes: number): WebAssembly.Memory
    __align(offset: number, base?: number): number
    __instance(name: string, bytes: number, imports?: Record<string, unknown>): WebAssembly.Instance
  }

  export type MmUnsharpImage = Uint8Array | Uint8ClampedArray | number[]

  export type MmUnsharpMask = (
    img: MmUnsharpImage,
    width: number,
    height: number,
    amount: number,
    radius: number,
    threshold: number
  ) => void

  export interface MmUnsharpMaskInstance extends MmInstance {
    unsharp_mask: MmUnsharpMask
  }

  export interface MmConstructor {
    new(options?: MmOptions): MmInstance
    (options?: MmOptions): MmInstance
    prototype: MmInstance
  }

  const Multimath: MmConstructor
  export default Multimath
}

declare module 'multimath/lib/unsharp_mask' {
  import type { MmPlugin } from 'multimath'

  const plugin: MmPlugin
  export = plugin
}
