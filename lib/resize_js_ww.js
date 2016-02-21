'use strict';

var webworkify = require('webworkify');
var resizeWorker = require('./js/worker.js');
var utils = require('./js/utils');
/* global navigator */

var SRC_TILE_SIZE = 512;
var DEST_TILE_BORDER = 3;

function createWorkers(concurrency) {
  var i;
  var result = [];

  for (i = 0; i < concurrency; i++) {
    result.push(webworkify(resizeWorker));
  }
  return result;
}

function terminateWorkers(workers) {
  for (var i = 0; i < workers.length; i++) {
    workers[i].terminate();
  }
}

function resize_js_ww(from, to, options, callback) {
  var fromCtx = from.getContext('2d');
  var toCtx = to.getContext('2d');
  var concurrency = navigator && navigator.hardwareConcurrency || 4;
  var workers = createWorkers(concurrency);

  utils.eachLimit(utils.createRegions({
    width: from.width,
    height: from.height,
    srcTileSize: SRC_TILE_SIZE,
    toWidth: to.width,
    toHeight: to.height,
    destTileBorder: DEST_TILE_BORDER
  }), concurrency, function (tile, next) {
    var fromImageData = fromCtx.getImageData(tile.x, tile.y, tile.width, tile.height);
    var _opts = {
      src:      fromImageData.data,
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
      unsharpAmount: options.unsharpAmount,
      unsharpRadius: options.unsharpRadius,
      unsharpThreshold: options.unsharpThreshold
    };
    var worker = workers.pop();

    worker.onmessage = function (ev) {
      var i, l;
      var imageDataTo, output, dest;

      workers.push(worker);

      if (ev.data.err) {
        callback(ev.data.err);
        return;
      }

      imageDataTo = toCtx.createImageData(tile.toWidth, tile.toHeight);
      output = ev.data.output;
      dest = imageDataTo.data;

      if (dest.set) {
        dest.set(output);
      } else {
        for (i = 0, l = output.length; i < l; i++) {
          dest[i] = output[i];
        }
      }

      toCtx.putImageData(imageDataTo, tile.toX, tile.toY, 0, 0, tile.toWidth, tile.toHeight);
      next();
    };

    worker.postMessage(_opts, [ _opts.src.buffer ]);
  }, function (err) {
    callback(err);
    terminateWorkers(workers);
  });
}

module.exports = resize_js_ww;
