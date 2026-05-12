// PPM image format save/load. This format is very easy
// to read/write without canvas and extra dependencies.
//
// Implementation is simplified, for test only.
//
export interface PpmImage {
  width: number
  height: number
  buffer: Uint8Array
}

function is_empty (ch: number): boolean {
  return ch <= 0x20
}

function decode (src: Uint8Array): PpmImage {
  let pos = 0

  function peek_string (src: Uint8Array): string {
    let result = ''

    while (pos <= src.length && !is_empty(src[pos])) {
      result += String.fromCharCode(src[pos])
      pos++
    }

    pos++

    return result
  }

  if (peek_string(src) !== 'P6') throw new Error('Fromat should be P6')

  const width = parseInt(peek_string(src), 10)
  const height = parseInt(peek_string(src), 10)

  const colors = parseInt(peek_string(src), 10)

  if (colors > 255) throw new Error('2-bytes per channel are not supported')

  let pixels = width * height

  if ((src.length - pos) !== pixels * 3) {
    throw new Error('Binary content does not match header')
  }

  const buffer = new Uint8Array(pixels * 4)
  let dest_pos = 0

  while (pixels > 0) {
    buffer[dest_pos + 0] = src[pos + 0]
    buffer[dest_pos + 1] = src[pos + 1]
    buffer[dest_pos + 2] = src[pos + 2]
    buffer[dest_pos + 3] = 0xFF // alpha
    dest_pos += 4
    pos += 3
    pixels--
  }

  return {
    width,
    height,
    buffer
  }
}

function encode (buffer: Uint8Array, width: number, height: number): Uint8Array {
  const header = 'P6\n' + width + ' ' + height + '\n255\n'

  let pixels = width * height

  if (buffer.length !== pixels * 4) {
    throw new Error('Data size does not match width*height')
  }

  const result = new Uint8Array(header.length + pixels * 3)

  let dest_pos = 0

  while (dest_pos < header.length) {
    result[dest_pos] = header.charCodeAt(dest_pos)
    dest_pos++
  }

  let src_pos = 0

  while (pixels > 0) {
    result[dest_pos + 0] = buffer[src_pos + 0]
    result[dest_pos + 1] = buffer[src_pos + 1]
    result[dest_pos + 2] = buffer[src_pos + 2]
    dest_pos += 3
    src_pos += 4
    pixels--
  }

  return result
}

export {
  decode,
  encode
}
