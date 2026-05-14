export interface Tile {
  toX: number
  toY: number
  toWidth: number
  toHeight: number
  toInnerX: number
  toInnerY: number
  toInnerWidth: number
  toInnerHeight: number
  offsetX: number
  offsetY: number
  scaleX: number
  scaleY: number
  x: number
  y: number
  width: number
  height: number
}

export interface TilerOptions {
  width: number
  height: number
  srcTileSize: number
  toWidth: number
  toHeight: number
  destTileBorder: number
}

// Split original image into multiple 1024x1024 chunks to reduce memory usage
// (images have to be unpacked into typed arrays for resizing) and allow
// parallel processing of multiple tiles at a time.
//

/*
 * pixelFloor and pixelCeil are modified versions of Math.floor and Math.ceil
 * functions which take into account floating point arithmetic errors.
 * Those errors can cause undesired increments/decrements of sizes and offsets:
 * Math.ceil(36 / (36 / 500)) = 501
 * pixelCeil(36 / (36 / 500)) = 500
 */

const PIXEL_EPSILON = 1e-5

function pixelFloor (x: number): number {
  const nearest = Math.round(x)

  if (Math.abs(x - nearest) < PIXEL_EPSILON) { return nearest }
  return Math.floor(x)
}

function pixelCeil (x: number): number {
  const nearest = Math.round(x)

  if (Math.abs(x - nearest) < PIXEL_EPSILON) { return nearest }
  return Math.ceil(x)
}

export default function createRegions (options: TilerOptions): Tile[] {
  const scaleX = options.toWidth / options.width
  const scaleY = options.toHeight / options.height

  const innerTileWidth = pixelFloor(options.srcTileSize * scaleX) - 2 * options.destTileBorder
  const innerTileHeight = pixelFloor(options.srcTileSize * scaleY) - 2 * options.destTileBorder

  // prevent infinite loop, this should never happen
  if (innerTileWidth < 1 || innerTileHeight < 1) {
    throw new Error('Internal error in pica: target tile width/height is too small.')
  }

  let x, y
  let innerX, innerY, toTileWidth, toTileHeight
  const tiles: Tile[] = []
  let tile: Tile

  // we go top-to-bottom instead of left-to-right so the image is displayed
  // from top to bottom in the browser
  for (innerY = 0; innerY < options.toHeight; innerY += innerTileHeight) {
    for (innerX = 0; innerX < options.toWidth; innerX += innerTileWidth) {
      x = innerX - options.destTileBorder
      if (x < 0) { x = 0 }
      toTileWidth = innerX + innerTileWidth + options.destTileBorder - x
      if (x + toTileWidth >= options.toWidth) {
        toTileWidth = options.toWidth - x
      }

      y = innerY - options.destTileBorder
      if (y < 0) { y = 0 }
      toTileHeight = innerY + innerTileHeight + options.destTileBorder - y
      if (y + toTileHeight >= options.toHeight) {
        toTileHeight = options.toHeight - y
      }

      tile = {
        toX: x,
        toY: y,
        toWidth: toTileWidth,
        toHeight: toTileHeight,

        toInnerX: innerX,
        toInnerY: innerY,
        toInnerWidth: innerTileWidth,
        toInnerHeight: innerTileHeight,

        offsetX: x / scaleX - pixelFloor(x / scaleX),
        offsetY: y / scaleY - pixelFloor(y / scaleY),
        scaleX,
        scaleY,

        x: pixelFloor(x / scaleX),
        y: pixelFloor(y / scaleY),
        width: pixelCeil(toTileWidth / scaleX),
        height: pixelCeil(toTileHeight / scaleY)
      }

      tiles.push(tile)
    }
  }

  return tiles
}
