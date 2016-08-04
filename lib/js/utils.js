'use strict';

function fixPrecision(x) {
  var nearest = Math.round(x);
  return (Math.abs(x - nearest) < 1e-8) ? nearest : x;
}

module.exports.createRegions = function createRegions(options) {

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

        offsetX: x / scaleX - Math.floor(fixPrecision(x / scaleX)),
        offsetY: y / scaleY - Math.floor(fixPrecision(y / scaleY)),
        scaleX: scaleX,
        scaleY: scaleY,

        x: Math.floor(fixPrecision(x / scaleX)),
        y: Math.floor(fixPrecision(y / scaleY)),
        width: Math.min(options.width, Math.ceil(fixPrecision(toTileWidth / scaleX))),
        height: Math.min(options.height, Math.ceil(fixPrecision(toTileHeight / scaleY)))
      };

      tiles.push(tile);
    }
  }

  return tiles;
};

module.exports.eachLimit = function eachLimit(list, limit, iterator, callback) {
  if (list.length === 0) {
    callback();
  }

  var executed = 0;
  var finished = 0;
  var failed = false;

  function next(err) {
    if (failed) {
      return;
    }
    if (err) {
      failed = true;
      callback(err);
      return;
    }

    finished++;
    if (finished === list.length) {
      callback();
    } else if (executed < list.length) {
      iterator(list[executed++], next);
    }
  }

  while (executed < limit && executed < list.length) {
    iterator(list[executed++], next);
  }
};
