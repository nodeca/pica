'use strict';

function createRegions(options) {
  var scaleX = options.toWidth / options.width;
  var scaleY = options.toHeight / options.height;

  var innerTileWidth = Math.floor(options.srcTileSize * scaleX) - 2 * options.destTileBorder;
  var innerTileHeight = Math.floor(options.srcTileSize * scaleY) - 2 * options.destTileBorder;

  var x, y;
  var innerX, innerY, toTileWidth, toTileHeight;
  var tiles = [];
  var tile;

  // we go top-to-down instead of left-to-right to make image displayed from top to
  // doesn in the browser
  for (innerY = 0; innerY < options.toHeight; innerY += innerTileHeight) {
    for (innerX = 0; innerX < options.toWidth; innerX += innerTileWidth) {
      x = innerX - options.destTileBorder;
      if (x < 0) { x = 0; }
      toTileWidth = innerX + innerTileWidth + options.destTileBorder - x;
      if (x + toTileWidth >= options.toWidth) {
        toTileWidth = options.toWidth - x;
      }

      y = innerY - options.destTileBorder;
      if (y < 0) { y = 0; }
      toTileHeight = innerY + innerTileHeight + options.destTileBorder - y;
      if (y + toTileHeight >= options.toHeight) {
        toTileHeight = options.toHeight - y;
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

        offsetX: x / scaleX - Math.floor(x / scaleX),
        offsetY: y / scaleY - Math.floor(y / scaleY),
        scaleX: scaleX,
        scaleY: scaleY,

        x: Math.floor(x / scaleX),
        y: Math.floor(y / scaleY),
        width: Math.ceil(toTileWidth / scaleX),
        height: Math.ceil(toTileHeight / scaleY)
      };

      tiles.push(tile);
    }
  }

  return tiles;
}

function eachLimit(list, limit, iterator, callback) {
  if (list.length === 0) {
    callback();
  }

  var current = 0;
  var failed = false;

  var next = function (err) {
    if (err) {
      if (!failed) {
        failed = true;
        callback(err);
      }
      return;
    }

    if (current < list.length) {
      iterator(list[current++], next);
    } else {
      callback();
    }
  };

  for (current = 0; current < limit && current < list.length; current++) {
    iterator(list[current], next);
  }
}

module.exports.createRegions = createRegions;
module.exports.eachLimit = eachLimit;
