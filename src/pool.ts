import type { PoolResource } from './types'

const GC_INTERVAL = 100

export default class Pool<T> {
  create: () => Omit<PoolResource<T>, 'id' | 'lastUsed' | 'release'>
  available: Array<PoolResource<T>>
  acquired: Record<number, PoolResource<T>>
  lastId: number
  timeoutId: ReturnType<typeof setTimeout> | 0
  idle: number

  constructor (create: () => Omit<PoolResource<T>, 'id' | 'lastUsed' | 'release'>, idle?: number) {
    this.create = create

    this.available = []
    this.acquired = {}
    this.lastId = 1

    this.timeoutId = 0
    this.idle = idle || 2000
  }

  acquire (): PoolResource<T> {
    let resource: PoolResource<T>

    if (this.available.length !== 0) {
      resource = this.available.pop() as PoolResource<T>
    } else {
      resource = this.create() as PoolResource<T>
      resource.id = this.lastId++
      resource.release = () => this.release(resource)
    }
    this.acquired[resource.id] = resource
    return resource
  }

  release (resource: PoolResource<T>): void {
    delete this.acquired[resource.id]

    resource.lastUsed = Date.now()
    this.available.push(resource)

    if (this.timeoutId === 0) {
      this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL)
    }
  }

  gc (): void {
    const now = Date.now()

    this.available = this.available.filter(resource => {
      if (now - (resource.lastUsed || 0) > this.idle) {
        resource.destroy()
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
