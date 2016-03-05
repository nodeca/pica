'use strict';

var resize        = require('./js/resize_array');
var unsharp       = require('./js/unsharp');
var createRegions = require('./js/utils').createRegions;
var eachLimit     = require('./js/utils').eachLimit;
var generateId    = require('./js/generate_id');
var createCanvas  = require('./js/create_canvas');

var SRC_TILE_SIZE = 1024;
var DEST_TILE_BORDER = 3;

function resize_js(from, to, options, callback) {
  var toCtx = to.getContext('2d');

  // We use intermediate canvases because, getImageData() from canvas region
  // is 8x times slower in FF than getImageData() from whole canvas.
  // That adds ~20% delay in Chrome :(.
  //
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=1001069

  var fromTile = createCanvas();

  fromTile.width = Math.min(SRC_TILE_SIZE, from.width);
  fromTile.height = Math.min(SRC_TILE_SIZE, from.height);

  var fromTileCtx = fromTile.getContext('2d');

  var regions = createRegions({
    width: from.width,
    height: from.height,
    srcTileSize: SRC_TILE_SIZE,
    toWidth: to.width,
    toHeight: to.height,
    destTileBorder: DEST_TILE_BORDER
  });

  eachLimit(regions, 1, function (tile, next) {
    fromTileCtx.drawImage(from, tile.x, tile.y, tile.width, tile.height,
      0, 0, tile.width, tile.height);

    var fromImageData = fromTileCtx.getImageData(0, 0, tile.width, tile.height);
    var toImageData   = toCtx.createImageData(tile.toWidth, tile.toHeight);

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
      alpha:    options.alpha,
      unsharpAmount:    options.unsharpAmount,
      unsharpRadius:    options.unsharpRadius,
      unsharpThreshold: options.unsharpThreshold
    };

    resize(_opts);

    if (options.unsharpAmount) {
      unsharp(_opts.dest, _opts.toWidth, _opts.toHeight,
        _opts.unsharpAmount, _opts.unsharpRadius, _opts.unsharpThreshold);
    }

    toCtx.putImageData(toImageData, tile.toX, tile.toY,
      tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
      tile.toInnerWidth, tile.toInnerHeight);
    next();
  }, callback);

  return generateId();
}

module.exports = resize_js;
module.exports.terminate = function () {};
