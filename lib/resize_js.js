'use strict';

var resize = require('./js/resize_array');
var unsharp = require('./js/unsharp');
var utils = require('./js/utils');
var createCanvas = require('./js/create_canvas');

var SRC_TILE_SIZE = 1024;
var DEST_TILE_BORDER = 3;

function resize_js(from, to, options, callback) {
  var toCtx = to.getContext('2d');
  /* We use intermediate canvases because without it Firefox resizes 8x times slower
   * than with it. It makes resize 20% slower in Chrome */
  var fromTile = createCanvas();
  var fromTileCtx;

  fromTile.width = Math.min(SRC_TILE_SIZE, from.width);
  fromTile.height = Math.min(SRC_TILE_SIZE, from.height);
  fromTileCtx = fromTile.getContext('2d');

  utils.eachLimit(utils.createRegions({
    width: from.width,
    height: from.height,
    srcTileSize: SRC_TILE_SIZE,
    toWidth: to.width,
    toHeight: to.height,
    destTileBorder: DEST_TILE_BORDER
  }), 1, function (tile, next) {
    fromTileCtx.drawImage(from, tile.x, tile.y, tile.width, tile.height,
      0, 0, tile.width, tile.height);
    var fromImageData = fromTileCtx.getImageData(0, 0, tile.width, tile.height);
    var toImageData = toCtx.createImageData(tile.toWidth, tile.toHeight);
    var _opts = {
      src:      fromImageData.data,
      dest:     toImageData.data,
      width:    tile.width,
      height:   tile.height,
      toWidth:  tile.toWidth,
      toHeight: tile.toHeight,
      scaleX:   tile.scaleX,
      scaleY:   tile.scaleY,
      offsetX:  tile.offsetX,
      offsetY:  tile.offsetY,
      quality:  options.quality,
      alpha:    options.alpha
    };

    resize(_opts);
    if (options.unsharpAmount) {
      unsharp(_opts.dest, _opts.toWidth, _opts.toHeight,
        options.unsharpAmount, options.unsharpRadius, options.unsharpThreshold);
    }

    toCtx.putImageData(toImageData, tile.toX, tile.toY,
      tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
      tile.toInnerWidth, tile.toInnerHeight);
    next();
  }, callback);
}

module.exports = resize_js;
