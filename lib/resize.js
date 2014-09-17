// Resize RGBA buffer


'use strict';


module.exports = function resize(src, width, height, toWidth, toHeight, method, callback) {
  // TODO: stub - now crop corner instead of resize
  var i, j, srcOffset, dstOffset = 0,
      output = new Uint8Array(toWidth * toHeight * 4);

  for (i = 0; i < toHeight; i++) {
    srcOffset = width * 4 * i;

    for (j = 0; j < toWidth; j++) {
      // Just copy RGBA
      output[dstOffset++] = src[srcOffset++];
      output[dstOffset++] = src[srcOffset++];
      output[dstOffset++] = src[srcOffset++];
      output[dstOffset++] = src[srcOffset++];
    }
  }

  callback(null, output);
};
