'use strict';

var resize = require('./js/resize_array');
var unsharp = require('./js/unsharp');
var utils = require('./js/utils');

var SRC_TILE_SIZE = 1024;
var DEST_TILE_BORDER = 3;

function resize_js(from, to, options, callback) {
  var fromCtx = from.getContext('2d');
  var toCtx = to.getContext('2d');

  utils.eachLimit(utils.createRegions({
    width: from.width,
    height: from.height,
    srcTileSize: SRC_TILE_SIZE,
    toWidth: to.width,
    toHeight: to.height,
    destTileBorder: DEST_TILE_BORDER
  }), 1, function (tile, next) {
    var fromImageData = fromCtx.getImageData(tile.x, tile.y, tile.width, tile.height);
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

    toCtx.putImageData(toImageData, tile.toX, tile.toY, 0, 0, tile.toWidth, tile.toHeight);
    next();
  }, callback);
}

module.exports = resize_js;
