declare module 'glur/mono16' {
  export default function glurMono16 (
    src: Uint16Array,
    width: number,
    height: number,
    radius: number
  ): void
}

declare module 'multimath' {
  export interface MultimathPlugin {
    name: string
    fn: Function
    wasm_fn?: Function
    wasm_src?: string
  }

  export interface Multimath {
    features: import('./types').MathFeaturesMap
    __memory: WebAssembly.Memory
    __?: unknown

    has_wasm(): boolean
    init(): Promise<this>
    use(plugin: MultimathPlugin): this
    resize(
      options: import('./types').ResizeMathOptions,
      cache?: Record<string, unknown>
    ): Uint8Array
    unsharp_mask(
      img: Uint8Array | Uint8ClampedArray | number[],
      width: number,
      height: number,
      amount: number,
      radius: number,
      threshold: number
    ): void
    __align(offset: number): number
    __instance(
      name: string,
      bytes: number,
      imports?: Record<string, unknown>
    ): import('./types').WasmInstance
  }

  export interface MultimathConstructor {
    new(features?: Partial<import('./types').MathFeaturesMap>): Multimath
    (features?: Partial<import('./types').MathFeaturesMap>): Multimath
    prototype: Multimath
  }

  const Multimath: MultimathConstructor
  export default Multimath
}
