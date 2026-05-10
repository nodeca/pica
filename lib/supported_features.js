'use strict'

// 3x2 JPEG with EXIF orientation 6 (rotate 90deg clockwise when decoded).
//
// Stored pixels, before orientation (Black, White):
//
//   B W B
//   B B B
//
// After orientation is applied, decoded image should be 2x3:
//
//   B B
//   B W  <- pixel at (1, 1) should be white if region crop is correct
//   B B
//
// If crop coordinates are applied before orientation, region (1, 1, 1, 1)
// returns black instead. The checks below use this to detect region/orientation
// bugs in canvas drawImage() and createImageBitmap().
const ORIENTED_JPEG_BASE64 =
  '/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/4AAQSkZJRgABAQAAA' +
  'QABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCw' +
  'kJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAACAAMBAREA/8QAFAABAAAAAAAAAAAAAAAA' +
  'AAAACf/EABsQAAMBAQADAAAAAAAAAAAAAAECAwQFABEx/9oACAEBAAA/AC06fW6va0ps' +
  '7PT179E88MiV02arrCEkjGQZiSEnKc5ovxURVHoADz//2Q=='


const features = {
  canvas: false,
  offscreen_canvas: false,
  image_data: false,
  image_bitmap: false,
  may_be_worker: false,
  create_image_bitmap: false,
  safari_put_image_data_fix: false,
  bug_canvas_orientation_region: true,
  bug_image_bitmap_orientation_region: true,
  cib_resize: false
}

let checked = false
let checking = null

function check_canvas () {
  if (typeof document === 'undefined' || !document.createElement) return false

  try {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 1

    const ctx = canvas.getContext('2d')

    // Fingerprinting protection can randomize readback.
    // In that case we can not rely on canvas pixel data.
    let d = ctx.createImageData(2, 1)

    d.data[0] = 12; d.data[1] = 23; d.data[2] = 34; d.data[3] = 255
    d.data[4] = 45; d.data[5] = 56; d.data[6] = 67; d.data[7] = 255
    ctx.putImageData(d, 0, 0)
    d = ctx.getImageData(0, 0, 2, 1)

    return d.data[0] === 12 && d.data[1] === 23 && d.data[2] === 34 && d.data[3] === 255 &&
           d.data[4] === 45 && d.data[5] === 56 && d.data[6] === 67 && d.data[7] === 255
  } catch (__) {
    return false
  }
}


function check_offscreen_canvas () {
  if (typeof OffscreenCanvas === 'undefined') return false

  try {
    const canvas = new OffscreenCanvas(2, 1)
    const ctx = canvas.getContext('2d')

    // Fingerprinting protection can randomize readback.
    // In that case we can not rely on canvas pixel data.
    let d = ctx.createImageData(2, 1)

    d.data[0] = 12; d.data[1] = 23; d.data[2] = 34; d.data[3] = 255
    d.data[4] = 45; d.data[5] = 56; d.data[6] = 67; d.data[7] = 255
    ctx.putImageData(d, 0, 0)
    d = ctx.getImageData(0, 0, 2, 1)

    return d.data[0] === 12 && d.data[1] === 23 && d.data[2] === 34 && d.data[3] === 255 &&
           d.data[4] === 45 && d.data[5] === 56 && d.data[6] === 67 && d.data[7] === 255
  } catch (__) {
    return false
  }
}


function check_image_data () {
  if (typeof ImageData === 'undefined' || typeof Uint8ClampedArray === 'undefined') return false

  try {
    new ImageData(new Uint8ClampedArray(400), 10, 10)
    return true
  } catch (__) {
    return false
  }
}


function check_image_bitmap () {
  return typeof ImageBitmap !== 'undefined' &&
         ImageBitmap.prototype &&
         !!ImageBitmap.prototype.close
}


function check_create_image_bitmap () {
  return typeof createImageBitmap !== 'undefined'
}


function check_may_be_worker () {
  return typeof Worker !== 'undefined' &&
    // Filter out IE <= 11 for sure
    (typeof URL !== 'undefined' && !!URL.createObjectURL)
}


function check_safari_put_image_data_fix () {
  try {
    return typeof navigator !== 'undefined' &&
           navigator.userAgent &&
           navigator.userAgent.indexOf('Safari') >= 0 &&
           navigator.userAgent.indexOf('Chrome') < 0
  } catch (__) {
    return false
  }
}


function check_bug_canvas_orientation_region_async () {
  return Promise.resolve().then(() => {
    const canOffscreenCanvas = check_offscreen_canvas() &&
                             typeof createImageBitmap !== 'undefined' &&
                             typeof Blob !== 'undefined' &&
                             typeof atob !== 'undefined'

    if (canOffscreenCanvas) {
      const binary = atob(ORIENTED_JPEG_BASE64)
      const bytes = new Uint8Array(binary.length)

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      return createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }))
        .then(bitmap => {
          const canvas = new OffscreenCanvas(1, 1)

          try {
            const ctx = canvas.getContext('2d')
            ctx.drawImage(bitmap, 1, 1, 1, 1, 0, 0, 1, 1)

            return ctx.getImageData(0, 0, 1, 1).data[0] < 240
          } finally {
            bitmap.close()
          }
        })
    }

    if (check_canvas() && typeof Image !== 'undefined') {
      return new Promise(resolve => {
        const image = new Image()

        image.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = 1
            canvas.height = 1

            const ctx = canvas.getContext('2d')
            ctx.drawImage(image, 1, 1, 1, 1, 0, 0, 1, 1)

            resolve(ctx.getImageData(0, 0, 1, 1).data[0] < 240)
          } catch (__) {
            resolve(true)
          }
        }

        image.onerror = () => resolve(true)
        image.src = `data:image/jpeg;base64,${ORIENTED_JPEG_BASE64}`
      })
    }

    return true
  })
    .catch(() => true)
}


function check_bug_image_bitmap_orientation_region_async () {
  return Promise.resolve().then(() => {
    if (!features.image_bitmap && !check_image_bitmap()) return true
    if (typeof Blob === 'undefined' || typeof atob === 'undefined') return true

    const canOffscreenCanvas = check_offscreen_canvas()
    const canCanvas = check_canvas()

    if (!canOffscreenCanvas && !canCanvas) return true

    const binary = atob(ORIENTED_JPEG_BASE64)
    const bytes = new Uint8Array(binary.length)

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    return createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }))
      .then(imageBitmap => createImageBitmap(imageBitmap, 1, 1, 1, 1)
        .then(bitmap => {
          let canvas

          if (canOffscreenCanvas) {
            canvas = new OffscreenCanvas(1, 1)
          } else {
            canvas = document.createElement('canvas')
            canvas.width = 1
            canvas.height = 1
          }

          try {
            const ctx = canvas.getContext('2d')
            ctx.drawImage(bitmap, 0, 0)

            return bitmap.width !== 1 || bitmap.height !== 1 ||
                   ctx.getImageData(0, 0, 1, 1).data[0] < 240
          } finally {
            imageBitmap.close()
            bitmap.close()
          }
        }, () => {
          imageBitmap.close()
          return true
        }))
  })
    .catch(() => true)
}


function check_cib_resize_async () {
  return Promise.resolve().then(() => {
    if (typeof createImageBitmap === 'undefined') return false

    const SRC_SIZE = 20
    const DST_SIZE = 5

    let canvas

    if (features.canvas || check_canvas()) {
      canvas = document.createElement('canvas')
      canvas.width = SRC_SIZE
      canvas.height = SRC_SIZE
    } else if (features.offscreen_canvas || check_offscreen_canvas()) {
      canvas = new OffscreenCanvas(SRC_SIZE, SRC_SIZE)
      // Crome fails to createImageBitmap() from canvas without drawing
      // anything on it.
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, SRC_SIZE, SRC_SIZE)
    } else {
      return false
    }

    return createImageBitmap(canvas, 0, 0, SRC_SIZE, SRC_SIZE, {
      resizeWidth: DST_SIZE,
      resizeHeight: DST_SIZE,
      resizeQuality: 'high'
    })
      .then(bitmap => {
        const status = bitmap.width === DST_SIZE && !!bitmap.close

        if (bitmap.close) bitmap.close()
        canvas = null
        return status
      })
  })
    .catch(() => false)
}


function get_supported_features () {
  if (checked) return Promise.resolve(Object.assign({}, features))
  if (checking) return checking.then(() => Object.assign({}, features))

  features.canvas = check_canvas()
  features.offscreen_canvas = check_offscreen_canvas()
  features.image_data = check_image_data()
  features.may_be_worker = check_may_be_worker()
  features.image_bitmap = check_image_bitmap()
  features.create_image_bitmap = check_create_image_bitmap()
  features.safari_put_image_data_fix = check_safari_put_image_data_fix()

  const bugCanvasOrientationRegion = check_bug_canvas_orientation_region_async()
    .then(result => { features.bug_canvas_orientation_region = result })
    .catch(() => {})

  const bugImageBitmapOrientationRegion = check_bug_image_bitmap_orientation_region_async()
    .then(result => { features.bug_image_bitmap_orientation_region = result })
    .catch(() => {})

  const cibResize = check_cib_resize_async()
    .then(result => { features.cib_resize = result })
    .catch(() => {})

  checking = Promise.all([
    bugCanvasOrientationRegion,
    bugImageBitmapOrientationRegion,
    cibResize
  ]).then(() => {
    checked = true
    checking = null
    return Object.assign({}, features)
  }, err => {
    checking = null
    throw err
  })

  return checking
}


module.exports.get_supported_features = get_supported_features
