// @ts-nocheck
const GC_INTERVAL = 100

export default class Pool {
  constructor (create, idle) {
    this.create = create

    this.available = []
    this.acquired = {}
    this.lastId = 1

    this.timeoutId = 0
    this.idle = idle || 2000
  }

  acquire () {
    let resource

    if (this.available.length !== 0) {
      resource = this.available.pop()
    } else {
      resource = this.create()
      resource.id = this.lastId++
      resource.release = () => this.release(resource)
    }
    this.acquired[resource.id] = resource
    return resource
  }

  release (resource) {
    delete this.acquired[resource.id]

    resource.lastUsed = Date.now()
    this.available.push(resource)

    if (this.timeoutId === 0) {
      this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL)
    }
  }

  gc () {
    const now = Date.now()

    this.available = this.available.filter(resource => {
      if (now - resource.lastUsed > this.idle) {
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
