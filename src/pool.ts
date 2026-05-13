const GC_INTERVAL = 100

// Acquired items
export interface PoolResource<T> {
  value: T
  release: () => void
}

// Internal storage format
interface PoolResourceDescriptor<T> {
  id: number
  lastUsed: number
  value: T
  destroy: () => void
}

export default class Pool<T> {
  create: () => { value: T, destroy: () => void }
  available: Array<PoolResourceDescriptor<T>>
  acquired: Record<number, PoolResourceDescriptor<T>>
  lastId: number
  timeoutId: ReturnType<typeof setTimeout> | 0
  idle: number

  constructor (create: () => { value: T, destroy: () => void }, idle?: number) {
    this.create = create

    this.available = []
    this.acquired = {}
    this.lastId = 1

    this.timeoutId = 0
    this.idle = idle || 2000
  }

  acquire (): PoolResource<T> {
    let descriptor: PoolResourceDescriptor<T>

    if (this.available.length !== 0) {
      descriptor = this.available.pop() as PoolResourceDescriptor<T>
    } else {
      const init = this.create()
      descriptor = { ...init, id: this.lastId++, lastUsed: 0 }
    }
    this.acquired[descriptor.id] = descriptor
    return { value: descriptor.value, release: () => this.release(descriptor) }
  }

  release (descriptor: PoolResourceDescriptor<T>): void {
    delete this.acquired[descriptor.id]

    descriptor.lastUsed = Date.now()
    this.available.push(descriptor)

    if (this.timeoutId === 0) {
      this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL)
    }
  }

  gc (): void {
    const now = Date.now()

    this.available = this.available.filter(descriptor => {
      if (now - descriptor.lastUsed > this.idle) {
        descriptor.destroy()
        return false
      }
      return true
    })

    if (this.available.length !== 0) {
      this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL)
    } else {
      this.timeoutId = 0
    }
  }
}
